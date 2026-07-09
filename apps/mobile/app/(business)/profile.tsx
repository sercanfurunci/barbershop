import { View, Text, TouchableOpacity, useColorScheme, ScrollView, Alert, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { useModeStore } from "@/store/mode";

export default function ProfileScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const { user, logout, logoutAll } = useAuth();
  const router = useRouter();
  const { setMode } = useModeStore();

  const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: "Süper Admin",
    ADMIN: "Salon Yöneticisi",
    BARBER: "Berber",
    RECEPTIONIST: "Resepsiyon",
  };

  const handleLogout = () => {
    Alert.alert("Çıkış", "Oturumu kapatmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: logout },
    ]);
  };

  const handleLogoutAll = () => {
    Alert.alert("Tüm Cihazlardan Çıkış", "Tüm cihazlardaki oturumlar kapatılacak. Emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: logoutAll },
    ]);
  };

  const switchToCustomer = async () => {
    await setMode("customer");
    router.replace("/(customer)");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }}>
        <Text style={{ fontSize: 24, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>Profil</Text>

        {/* Avatar placeholder */}
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <View style={{
            width: 80, height: 80, borderRadius: 40,
            backgroundColor: c.secondary, justifyContent: "center", alignItems: "center",
            borderWidth: 2, borderColor: c.border,
          }}>
            <Text style={{ fontSize: 32, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
              {user?.displayName?.charAt(0)?.toUpperCase() ?? "?"}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontFamily: Typography.fontFamily.semiBold, color: c.foreground, marginTop: 12 }}>
            {user?.displayName ?? user?.email}
          </Text>
          <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 4 }}>
            {user?.role ? ROLE_LABELS[user.role] ?? user.role : ""}
          </Text>
          {user?.shop && (
            <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 2 }}>
              {user.shop.name}
            </Text>
          )}
        </View>

        {/* Info card */}
        <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
          {[
            { label: "E-posta", value: user?.email ?? "" },
            { label: "Rol", value: user?.role ? ROLE_LABELS[user.role] ?? user.role : "" },
            ...(user?.shop ? [{ label: "Salon", value: user.shop.name }] : []),
          ].map((row, i, arr) => (
            <View
              key={row.label}
              style={{
                flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                paddingHorizontal: 16, paddingVertical: 14,
                borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: c.border,
              }}
            >
              <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 14 }}>
                {row.label}
              </Text>
              <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.foreground, fontSize: 14, flex: 1, textAlign: "right" }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        {/* Settings links */}
        {(user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") && (
          <View style={{ backgroundColor: c.card, borderRadius: 12, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
            <TouchableOpacity
              onPress={() => router.push("/(business)/appearance")}
              style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: c.border }}
            >
              <Ionicons name="color-palette-outline" size={18} color={c.mutedForeground} />
              <Text style={{ flex: 1, fontFamily: Typography.fontFamily.medium, color: c.foreground, fontSize: 14 }}>Mobil Görünüm Ayarları</Text>
              <Ionicons name="chevron-forward" size={14} color={c.mutedForeground} />
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <View style={{ gap: 10 }}>
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              backgroundColor: c.card, borderRadius: 10, padding: 16,
              borderWidth: 1, borderColor: c.border, alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.destructive, fontSize: 16 }}>
              Çıkış Yap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleLogoutAll}
            style={{
              backgroundColor: c.card, borderRadius: 10, padding: 16,
              borderWidth: 1, borderColor: c.border, alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.mutedForeground, fontSize: 14 }}>
              Tüm Cihazlardan Çıkış Yap
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={switchToCustomer}
            style={{ backgroundColor: c.secondary, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: "center", marginTop: 8 }}
          >
            <Text style={{ fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>Müşteri moduna geç</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
