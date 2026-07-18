/**
 * Centralized application configuration.
 * All environment variable reads live here — no scattered process.env throughout the codebase.
 * Import config values from this module, never from process.env directly.
 */

function required(key) {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required environment variable: ${key}`);
  return val;
}

function optional(key, fallback = undefined) {
  return process.env[key] ?? fallback;
}

function bool(key, fallback = false) {
  const val = process.env[key];
  if (val === undefined) return fallback;
  return val === "1" || val === "true";
}

// ─── Database ─────────────────────────────────────────────────────────────────
export const db = {
  url:       optional("DATABASE_URL"),
  directUrl: optional("DIRECT_URL"),
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const auth = {
  jwtSecret:        optional("JWT_SECRET", "dev-secret-change-in-prod"),
  accessTokenTtlMs: 15 * 60 * 1000,     // 15 minutes
  refreshTokenTtlMs: 30 * 24 * 3600 * 1000, // 30 days
};

// ─── Rate limiting ────────────────────────────────────────────────────────────
export const rateLimit = {
  upstashUrl:   optional("UPSTASH_REDIS_REST_URL"),
  upstashToken: optional("UPSTASH_REDIS_REST_TOKEN"),
};

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = {
  netgsmUser:     optional("NETGSM_USER"),
  netgsmPassword: optional("NETGSM_PASSWORD"),
  netgsmHeader:   optional("NETGSM_HEADER", "MAKAS"),
};

// ─── Storage / CDN ───────────────────────────────────────────────────────────
export const storage = {
  cloudinaryCloud:  optional("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
  cloudinaryApiKey: optional("CLOUDINARY_API_KEY"),
  cloudinarySecret: optional("CLOUDINARY_API_SECRET"),
};

// ─── Platform ─────────────────────────────────────────────────────────────────
export const platform = {
  superAdminIpAllowlist: optional("SUPER_ADMIN_IP_ALLOWLIST", ""),
  vercelCronSecret:      optional("CRON_SECRET"),
  appUrl:                optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  env:                   optional("NODE_ENV", "development"),
  isProd:                optional("NODE_ENV") === "production",
};

// ─── Google ───────────────────────────────────────────────────────────────────
export const google = {
  placesApiKey: optional("GOOGLE_PLACES_API_KEY"),
  mapsApiKey:   optional("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"),
};

// ─── AI providers ────────────────────────────────────────────────────────────
export const ai = {
  openaiKey:    optional("OPENAI_API_KEY"),
  anthropicKey: optional("ANTHROPIC_API_KEY"),
  geminiKey:    optional("GEMINI_API_KEY"),
  provider:     optional("AI_PROVIDER", "anthropic"), // active provider
  model:        optional("AI_MODEL", "claude-haiku-4-5-20251001"), // default model
};

// ─── Meta (WhatsApp Cloud API) ───────────────────────────────────────────────
const _metaAccessToken   = optional("META_ACCESS_TOKEN");
const _metaPhoneNumberId = optional("META_PHONE_NUMBER_ID");
const _metaAppSecret     = optional("META_APP_SECRET");

export const meta = {
  appSecret:     _metaAppSecret,
  verifyToken:   optional("META_VERIFY_TOKEN"),
  accessToken:   _metaAccessToken,
  phoneNumberId: _metaPhoneNumberId,
  apiVersion:    optional("META_API_VERSION", "v19.0"),
  aiEnabled:     bool("WHATSAPP_AI", false), // feature kill-switch kept as WHATSAPP_AI for clarity
  isConfigured:  !!(_metaAccessToken && _metaPhoneNumberId && _metaAppSecret),
};

// ─── Future: Payment providers ───────────────────────────────────────────────
export const payments = {
  iyzicoApiKey:    optional("IYZICO_API_KEY"),
  iyzicoSecretKey: optional("IYZICO_SECRET_KEY"),
  stripeSecretKey: optional("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: optional("STRIPE_WEBHOOK_SECRET"),
};
