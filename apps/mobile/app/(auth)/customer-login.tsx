import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { api, tokenStore } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { biometrics } from "@/utils/biometrics";
import { haptics } from "@/utils/haptics";
import type { User } from "@/types/api";

// TODO: Google Sign In
// TODO: Apple Sign In

interface LoginResponse {
  token: string;
  user: User;
}

function errorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "İşlem başarısız";
  const e = err as Error & { status?: number };
  if (e.status === 429) return "Çok fazla deneme. Lütfen birazdan tekrar deneyin.";
  if (e.status === 401) return "E-posta veya şifre hatalı.";
  if (e.status === 403) return "Bu hesap askıya alınmış.";
  if (e.status === 409) return "Bu e-posta adresi zaten kullanılıyor.";
  return e.message || "Sunucu hatası. Lütfen tekrar deneyin.";
}

export default function CustomerLoginScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();

  const [tab, setTab] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Login fields
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register fields
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");

  useEffect(() => {
    (async () => {
      const available = await biometrics.isAvailable();
      const enabled = await biometrics.isEnabled();
      setBiometricAvailable(available && enabled);
    })();
  }, []);

  const handleSuccess = async (data: LoginResponse) => {
    await tokenStore.set(data.token);
    setToken(data.token);
    setUser(data.user);
    router.replace("/(customer)");
  };

  const onLogin = async () => {
    haptics.medium();
    if (!loginEmail.trim() || !loginPassword) {
      setError("E-posta ve şifre gereklidir.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email: loginEmail.trim().toLowerCase(),
        password: loginPassword,
      });
      // Prompt to enable biometrics if available and not yet enabled
      const available = await biometrics.isAvailable();
      const alreadyEnabled = await biometrics.isEnabled();
      if (available && !alreadyEnabled) {
        Alert.alert(
          "Hızlı Giriş",
          "Face ID / Touch ID kullanarak hızlı giriş yapmak ister misin?",
          [
            {
              text: "Hayır",
              style: "cancel",
              onPress: () => handleSuccess(data),
            },
            {
              text: "Evet",
              onPress: async () => {
                await biometrics.enable(data.token);
                setBiometricAvailable(true);
                handleSuccess(data);
              },
            },
          ]
        );
      } else {
        await handleSuccess(data);
      }
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    haptics.medium();
    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setError("Ad soyad, e-posta ve şifre gereklidir.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const payload: Record<string, string> = {
        displayName: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        password: regPassword,
      };
      if (regPhone.trim()) payload.phone = regPhone.trim();
      const { data } = await api.post<LoginResponse>("/auth/register", payload);
      await handleSuccess(data);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const onBiometricLogin = async () => {
    haptics.medium();
    try {
      const token = await biometrics.authenticate();
      if (!token) {
        Alert.alert("Kimlik Doğrulama Başarısız", "Lütfen tekrar deneyin.");
        return;
      }
      await tokenStore.set(token);
      const { data: user } = await api.get<User>("/auth/me");
      await handleSuccess({ token, user });
    } catch {
      Alert.alert("Hata", "Giriş yapılamadı. Lütfen e-posta ve şifre ile giriş yapın.");
    }
  };

  const goGuest = () => {
    router.replace("/(customer)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, padding: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginTop: 16, marginBottom: 36 }}>
            <Text style={[styles.brand, { color: c.foreground }]}>MAKAS</Text>
            <Text style={[styles.tagline, { color: c.mutedForeground }]}>
              Randevularını kolayca yönet
            </Text>
          </View>

          {/* Tab bar */}
          <View style={[styles.tabBar, { backgroundColor: c.secondary, borderColor: c.border }]}>
            <TouchableOpacity
              onPress={() => { setTab("login"); setError(null); }}
              activeOpacity={0.85}
              style={[
                styles.tabBtn,
                tab === "login" && [styles.tabBtnActive, { backgroundColor: c.card, shadowColor: "#000" }],
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === "login" ? c.foreground : c.mutedForeground },
                  tab === "login" && { fontFamily: Typography.fontFamily.semiBold },
                ]}
              >
                Giriş Yap
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setTab("register"); setError(null); }}
              activeOpacity={0.85}
              style={[
                styles.tabBtn,
                tab === "register" && [styles.tabBtnActive, { backgroundColor: c.card, shadowColor: "#000" }],
              ]}
            >
              <Text
                style={[
                  styles.tabLabel,
                  { color: tab === "register" ? c.foreground : c.mutedForeground },
                  tab === "register" && { fontFamily: Typography.fontFamily.semiBold },
                ]}
              >
                Kayıt Ol
              </Text>
            </TouchableOpacity>
          </View>

          {/* Forms */}
          <View style={{ marginTop: 28, gap: 14 }}>
            {tab === "login" ? (
              <>
                <InputField
                  c={c}
                  label="E-posta"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  placeholder="ornek@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <InputField
                  c={c}
                  label="Şifre"
                  value={loginPassword}
                  onChangeText={setLoginPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="password"
                  textContentType="password"
                />
                <TouchableOpacity
                  onPress={() => router.push("/(auth)/forgot-password")}
                  activeOpacity={0.7}
                  style={{ alignSelf: "flex-end" }}
                  hitSlop={{ top: 8, bottom: 8, left: 16, right: 4 }}
                >
                  <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: c.primary }}>
                    Şifremi Unuttum
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <InputField
                  c={c}
                  label="Ad Soyad"
                  value={regName}
                  onChangeText={setRegName}
                  placeholder="Ahmet Yılmaz"
                  autoComplete="name"
                  textContentType="name"
                />
                <InputField
                  c={c}
                  label="E-posta"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  placeholder="ornek@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  textContentType="emailAddress"
                />
                <InputField
                  c={c}
                  label="Şifre"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  placeholder="••••••••"
                  secureTextEntry
                  autoComplete="new-password"
                  textContentType="newPassword"
                />
                <InputField
                  c={c}
                  label="Telefon (opsiyonel)"
                  value={regPhone}
                  onChangeText={setRegPhone}
                  placeholder="0555 123 45 67"
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  textContentType="telephoneNumber"
                />
              </>
            )}

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              onPress={tab === "login" ? onLogin : onRegister}
              disabled={loading}
              activeOpacity={0.85}
              style={[
                styles.submitBtn,
                { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 },
              ]}
            >
              {loading ? (
                <ActivityIndicator color={c.primaryForeground} />
              ) : (
                <Text style={[styles.submitLabel, { color: c.primaryForeground }]}>
                  {tab === "login" ? "Giriş Yap" : "Kayıt Ol"}
                </Text>
              )}
            </TouchableOpacity>

            {/* Biometric login button — only on login tab when available */}
            {tab === "login" && biometricAvailable ? (
              <TouchableOpacity
                onPress={onBiometricLogin}
                activeOpacity={0.8}
                style={[styles.biometricBtn, { borderColor: c.border, backgroundColor: c.card }]}
              >
                <Ionicons name="finger-print" size={22} color={c.primary} />
                <Text style={[styles.biometricLabel, { color: c.foreground }]}>
                  Face ID / Touch ID ile Giriş
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Guest link */}
          <View style={{ alignItems: "center", marginTop: 32 }}>
            <TouchableOpacity onPress={goGuest} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
              <Text style={[styles.guestLink, { color: c.mutedForeground }]}>
                Misafir olarak devam et
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({
  c,
  label,
  ...props
}: {
  c: typeof Colors.light;
  label: string;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={[styles.inputLabel, { color: c.foreground }]}>{label}</Text>
      <TextInput
        style={[
          styles.input,
          {
            borderColor: c.border,
            color: c.foreground,
            backgroundColor: c.input,
          },
        ]}
        placeholderTextColor={c.mutedForeground}
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: 34,
    fontFamily: Typography.fontFamily.bold,
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 4,
  },
  tabBar: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },
  tabBtnActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.medium,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
  },
  submitBtn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  submitLabel: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semiBold,
  },
  guestLink: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
    textDecorationLine: "underline",
  },
  biometricBtn: {
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  biometricLabel: {
    fontSize: 15,
    fontFamily: Typography.fontFamily.medium,
  },
});
