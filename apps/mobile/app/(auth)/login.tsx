import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

interface LoginForm {
  email: string;
  password: string;
}

function errorMessage(err: unknown): string {
  if (!(err instanceof Error)) return "Giriş başarısız";
  const e = err as Error & { status?: number };
  if (e.status === 429) return "Çok fazla giriş denemesi. Lütfen birazdan tekrar deneyin.";
  if (e.status === 401) return "E-posta veya şifre hatalı.";
  if (e.status === 403) return "Bu hesap askıya alınmış. Yöneticinize başvurun.";
  return e.message || "Sunucu hatası. Lütfen tekrar deneyin.";
}

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      await login(data.email.trim().toLowerCase(), data.password);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.replace("/(welcome)")}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 16 }}
              accessibilityRole="button"
              accessibilityLabel="Geri"
            >
              <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.medium, color: c.primary }}>
                Geri
              </Text>
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Brand */}
            <View style={{ alignItems: "center", marginBottom: 48 }}>
              <Text
                style={{ fontSize: 36, fontFamily: Typography.fontFamily.bold, color: c.foreground, letterSpacing: -1 }}
                accessibilityRole="header"
              >
                MAKAS
              </Text>
              <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 4 }}>
                Berber Yönetim Sistemi
              </Text>
            </View>

            <View style={{ gap: 16 }}>
              {/* Email */}
              <View>
                <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: c.foreground, marginBottom: 6 }}>
                  E-posta / Kullanıcı Adı
                </Text>
                <Controller
                  control={control}
                  name="email"
                  rules={{ required: "E-posta gerekli" }}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      autoCapitalize="none"
                      keyboardType="email-address"
                      autoCorrect={false}
                      autoComplete="email"
                      textContentType="emailAddress"
                      accessibilityLabel="E-posta adresi"
                      style={{
                        borderWidth: 1,
                        borderColor: errors.email ? c.destructive : c.border,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        fontFamily: Typography.fontFamily.regular,
                        color: c.foreground,
                        backgroundColor: c.input,
                      }}
                      placeholderTextColor={c.mutedForeground}
                      placeholder="ornek@makas.app"
                    />
                  )}
                />
                {errors.email && (
                  <Text style={{ fontSize: 12, color: c.destructive, marginTop: 4 }}>
                    {errors.email.message}
                  </Text>
                )}
              </View>

              {/* Password */}
              <View>
                <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: c.foreground, marginBottom: 6 }}>
                  Şifre
                </Text>
                <Controller
                  control={control}
                  name="password"
                  rules={{ required: "Şifre gerekli" }}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      secureTextEntry
                      autoComplete="password"
                      textContentType="password"
                      accessibilityLabel="Şifre"
                      style={{
                        borderWidth: 1,
                        borderColor: errors.password ? c.destructive : c.border,
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 12,
                        fontSize: 16,
                        fontFamily: Typography.fontFamily.regular,
                        color: c.foreground,
                        backgroundColor: c.input,
                      }}
                      placeholderTextColor={c.mutedForeground}
                      placeholder="••••••••"
                    />
                  )}
                />
                {errors.password && (
                  <Text style={{ fontSize: 12, color: c.destructive, marginTop: 4 }}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              {/* Error banner */}
              {error && (
                <View
                  style={{ backgroundColor: "#FEE2E2", borderRadius: 8, padding: 12 }}
                  accessibilityLiveRegion="polite"
                >
                  <Text style={{ color: c.destructive, fontSize: 14, fontFamily: Typography.fontFamily.regular }}>
                    {error}
                  </Text>
                </View>
              )}

              {/* Submit */}
              <TouchableOpacity
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Giriş Yap"
                accessibilityState={{ disabled: loading }}
                style={{
                  backgroundColor: c.primary,
                  borderRadius: 10,
                  paddingVertical: 14,
                  alignItems: "center",
                  marginTop: 8,
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? (
                  <ActivityIndicator color={c.primaryForeground} />
                ) : (
                  <Text style={{ color: c.primaryForeground, fontSize: 16, fontFamily: Typography.fontFamily.semiBold }}>
                    Giriş Yap
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}
