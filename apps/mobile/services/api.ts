import axios, { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "makas_token";

export const tokenStore = {
  get: () => SecureStore.getItemAsync(TOKEN_KEY),
  set: (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token),
  delete: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};

export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// Attach stored token on every request
api.interceptors.request.use(async (config) => {
  const token = await tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → attempt silent token refresh, retry once.
// On persistent 401 after refresh → clear token + navigate to welcome.
// Other errors → unwrap { error: string } from backend JSON body.
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError<{ error?: string }>) => {
    const original = error.config as typeof error.config & { _retry?: boolean };

    if (error.response?.status === 401 && !original?._retry) {
      original._retry = true;
      try {
        const { data } = await axios.post<{ token: string }>(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { headers: { Authorization: `Bearer ${await tokenStore.get()}` } }
        );
        await tokenStore.set(data.token);
        if (original) {
          original.headers = original.headers ?? {};
          original.headers.Authorization = `Bearer ${data.token}`;
          return api(original);
        }
      } catch {
        // Refresh also failed → session is dead. Clear token and signal to
        // the UI to go back to the welcome screen.
        await tokenStore.delete();
        // Lazy import to avoid circular dep at module init time.
        try {
          const { router } = require("expo-router");
          router.replace("/(welcome)");
        } catch {
          // Router not ready yet (e.g., called before layout mounts) — ignore.
        }
      }
    }

    // Build a clean error with readable message and HTTP status attached.
    let message: string;
    if (error.response?.data?.error) {
      message = error.response.data.error;
    } else if (!error.response) {
      // Network-level error: no response received.
      message = error.code === "ECONNABORTED"
        ? "İstek zaman aşımına uğradı"
        : "Sunucuya ulaşılamıyor — internet bağlantını kontrol et";
    } else {
      message = error.message ?? "Sunucu hatası";
    }

    const e = new Error(message) as Error & { status?: number };
    e.status = error.response?.status;
    return Promise.reject(e);
  }
);
