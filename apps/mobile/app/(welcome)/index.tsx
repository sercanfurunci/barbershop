import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { useModeStore } from "@/store/mode";
import { useAuthStore } from "@/store/auth";

export default function WelcomeScreen() {
  const router = useRouter();
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const { setMode } = useModeStore();
  const { user } = useAuthStore();

  const goCustomer = async () => {
    await setMode("customer");
    router.replace("/(customer)");
  };

  const goBusiness = async () => {
    await setMode("business");
    if (user) router.replace("/(business)");
    else router.replace("/(auth)/login");
  };

  const continueSession = async () => {
    // User already logged in as business — show mode select
    router.replace("/(mode-select)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
        <View style={{ marginBottom: 56 }}>
          <Text style={{ fontSize: 40, fontFamily: Typography.fontFamily.bold, color: c.foreground, letterSpacing: -1 }}>
            MAKAS
          </Text>
          <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 8, lineHeight: 24 }}>
            Randevu al.{"\n"}İşletmeni yönet.
          </Text>
        </View>

        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={goCustomer}
            style={{ backgroundColor: c.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center" }}
          >
            <Text style={{ color: c.primaryForeground, fontSize: 16, fontFamily: Typography.fontFamily.semiBold }}>
              Kuaför Bul
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={goBusiness}
            style={{ backgroundColor: c.secondary, borderRadius: 12, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: c.border }}
          >
            <Text style={{ color: c.secondaryForeground, fontSize: 16, fontFamily: Typography.fontFamily.semiBold }}>
              İşletme Girişi
            </Text>
          </TouchableOpacity>

          {user && (
            <TouchableOpacity onPress={continueSession} style={{ alignItems: "center", paddingVertical: 12 }}>
              <Text style={{ color: c.mutedForeground, fontSize: 14, fontFamily: Typography.fontFamily.regular }}>
                Zaten giriş yapıldı · Devam et
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
