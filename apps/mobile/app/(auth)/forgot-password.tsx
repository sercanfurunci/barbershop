import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, useColorScheme, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { api } from "@/services/api";
import { haptics } from "@/utils/haptics";

export default function ForgotPasswordScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      haptics.success();
      setSent(true);
    } catch {
      // API always returns 200 to avoid probing — treat errors as success too
      haptics.success();
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Şifremi Unuttum",
          headerTitleStyle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 17, color: c.foreground },
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 16 }}
            >
              <Ionicons name="chevron-back" size={24} color={c.foreground} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["bottom"]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Ionicons name="lock-open-outline" size={52} color={c.primary} style={{ alignSelf: "center", marginBottom: 16 }} />

            {sent ? (
              <View style={{ alignItems: "center", gap: 12 }}>
                <Text style={[styles.title, { color: c.foreground }]}>E-posta Gönderildi</Text>
                <Text style={[styles.body, { color: c.mutedForeground }]}>
                  Eğer bu e-posta adresine kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı birkaç dakika içinde gönderilecektir. Spam klasörünüzü de kontrol edin.
                </Text>
                <TouchableOpacity
                  onPress={() => router.back()}
                  activeOpacity={0.85}
                  style={[styles.btn, { backgroundColor: c.primary, marginTop: 8 }]}
                >
                  <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Geri Dön</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ gap: 16 }}>
                <Text style={[styles.title, { color: c.foreground }]}>Şifreni Sıfırla</Text>
                <Text style={[styles.body, { color: c.mutedForeground }]}>
                  Kayıtlı e-posta adresini gir. Sıfırlama bağlantısını göndereceğiz.
                </Text>
                <View>
                  <Text style={[styles.label, { color: c.foreground }]}>E-posta</Text>
                  <TextInput
                    style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.input }]}
                    placeholderTextColor={c.mutedForeground}
                    placeholder="ornek@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    autoCorrect={false}
                    returnKeyType="send"
                    onSubmitEditing={onSubmit}
                  />
                </View>
                <TouchableOpacity
                  onPress={onSubmit}
                  disabled={loading || !email.trim()}
                  activeOpacity={0.85}
                  style={[styles.btn, { backgroundColor: c.primary, opacity: loading || !email.trim() ? 0.6 : 1 }]}
                >
                  {loading ? (
                    <ActivityIndicator color={c.primaryForeground} />
                  ) : (
                    <Text style={[styles.btnLabel, { color: c.primaryForeground }]}>Bağlantı Gönder</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll:    { padding: 24, gap: 4 },
  title:     { fontSize: 22, fontFamily: Typography.fontFamily.bold, textAlign: "center", marginBottom: 4 },
  body:      { fontSize: 14, fontFamily: Typography.fontFamily.regular, textAlign: "center", lineHeight: 22 },
  label:     { fontSize: 13, fontFamily: Typography.fontFamily.medium, marginBottom: 6 },
  input:     { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: Typography.fontFamily.regular },
  btn:       { borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  btnLabel:  { fontSize: 16, fontFamily: Typography.fontFamily.semiBold },
});
