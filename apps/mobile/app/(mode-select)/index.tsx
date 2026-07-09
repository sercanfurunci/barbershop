import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { useModeStore } from "@/store/mode";
import { useAuthStore } from "@/store/auth";
import { useAuth } from "@/hooks/useAuth";

export default function ModeSelectScreen() {
  const router = useRouter();
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const { setMode } = useModeStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();

  const pick = async (mode: "customer" | "business") => {
    await setMode(mode);
    router.replace(mode === "customer" ? "/(customer)" : "/(business)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 32 }}>
        <Text style={{ fontSize: 22, fontFamily: Typography.fontFamily.bold, color: c.foreground, marginBottom: 8 }}>
          Nasıl devam etmek istersin?
        </Text>
        {user?.displayName && (
          <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginBottom: 32 }}>
            {user.displayName} olarak giriş yapıldı
          </Text>
        )}

        <View style={{ gap: 12 }}>
          <TouchableOpacity
            onPress={() => pick("customer")}
            style={{ backgroundColor: c.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: c.border }}
          >
            <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>Müşteri olarak devam et</Text>
            <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 4 }}>Kuaför ara, randevu al</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pick("business")}
            style={{ backgroundColor: c.primary, borderRadius: 12, padding: 20 }}
          >
            <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: c.primaryForeground }}>İşletme olarak devam et</Text>
            {user?.shop?.name && (
              <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.primaryForeground, opacity: 0.7, marginTop: 4 }}>
                {user.shop.name}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={logout}
            style={{ alignItems: "center", paddingVertical: 14 }}
          >
            <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
              Çıkış Yap
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
