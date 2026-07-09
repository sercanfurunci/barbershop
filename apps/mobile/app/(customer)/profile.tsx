import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { useModeStore } from "@/store/mode";
import { useAuthStore } from "@/store/auth";
import { useAuth } from "@/hooks/useAuth";
import { customerService } from "@/services/customer";
import { haptics } from "@/utils/haptics";
import { biometrics } from "@/utils/biometrics";
import { useState, useEffect } from "react";

function initialsOf(name?: string | null) {
  if (!name) return "M";
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join("") || "M";
}

export default function CustomerProfile() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const { setMode } = useModeStore();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    biometrics.isAvailable().then((available) => {
      setBiometricAvailable(available);
      if (available) biometrics.isEnabled().then(setBiometricEnabled);
    });
  }, []);

  const toggleBiometric = async (val: boolean) => {
    haptics.light();
    if (val) {
      const LocalAuthentication = await import("expo-local-authentication");
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Biyometrik girişi etkinleştir",
        cancelLabel: "İptal",
      });
      if (result.success) {
        const { tokenStore } = await import("@/services/api");
        const token = await tokenStore.get();
        if (token) { await biometrics.enable(token); setBiometricEnabled(true); haptics.success(); }
      } else {
        Alert.alert("İptal edildi", "Biyometrik giriş etkinleştirilmedi.");
      }
    } else {
      await biometrics.disable();
      setBiometricEnabled(false);
    }
  };

  const displayName = user?.displayName ?? "Misafir Kullanıcı";
  const initials = user ? initialsOf(user.displayName) : "M";

  const switchToBusiness = async () => {
    await setMode("business");
    router.replace(user ? "/(business)" : "/(auth)/login");
  };

  const goWelcome = async () => {
    await setMode(null);
    router.replace("/(welcome)");
  };

  const onDeleteAccount = () => {
    haptics.warning();
    Alert.alert(
      "Hesabı Sil",
      "Bu işlem geri alınamaz. Tüm randevu ve favori verileriniz silinecektir.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Hesabı Sil",
          style: "destructive",
          onPress: async () => {
            try {
              await customerService.deleteAccount();
              await logout();
            } catch {
              Alert.alert("Hata", "Hesap silinemedi. Tekrar deneyin.");
            }
          },
        },
      ]
    );
  };

  const goCustomerLogin = () => {
    router.push("/(auth)/customer-login");
  };

  const onNotifSettings = () => {
    router.push("/(customer)/notifications");
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <Text
          style={{
            fontSize: 28,
            fontFamily: Typography.fontFamily.bold,
            color: c.foreground,
            letterSpacing: -0.5,
          }}
        >
          Profil
        </Text>

        {/* ── Profile card ── */}
        <View
          style={[styles.headerCard, { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" }]}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            {/* Avatar */}
            <View style={[styles.avatar, { backgroundColor: c.secondary, borderColor: c.border }]}>
              {user?.avatarUrl ? (
                <Image
                  source={{ uri: user.avatarUrl }}
                  style={{ width: 72, height: 72, borderRadius: 36 }}
                  resizeMode="cover"
                />
              ) : (
                <Text style={{ fontSize: 28, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                  {initials}
                </Text>
              )}
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{ fontSize: 18, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}
              >
                {displayName}
              </Text>
              {user ? (
                <>
                  <Text
                    numberOfLines={1}
                    style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 2 }}
                  >
                    {user.email}
                  </Text>
                  {user.phone ? (
                    <Text
                      numberOfLines={1}
                      style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 1 }}
                    >
                      {user.phone}
                    </Text>
                  ) : null}
                </>
              ) : (
                <Text
                  numberOfLines={2}
                  style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 2, lineHeight: 18 }}
                >
                  Giriş yaparak randevularını takip et
                </Text>
              )}
            </View>
          </View>

          {user ? (
            <TouchableOpacity
              onPress={() => router.push("/(customer)/edit-profile")}
              activeOpacity={0.85}
              style={{
                marginTop: 14,
                borderWidth: 1,
                borderColor: c.border,
                borderRadius: 12,
                paddingVertical: 10,
                alignItems: "center",
              }}
            >
              <Text style={{ color: c.foreground, fontFamily: Typography.fontFamily.semiBold, fontSize: 14 }}>
                Profili Düzenle
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={goCustomerLogin}
              activeOpacity={0.85}
              style={{
                marginTop: 14,
                backgroundColor: c.primary,
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 15 }}>
                Giriş Yap
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Quick actions ── */}
        <View style={{ flexDirection: "row", gap: 12 }}>
          <QuickAction
            c={c}
            icon="calendar-outline"
            label="Randevularım"
            onPress={() => router.push("/(customer)/appointments")}
          />
          <QuickAction
            c={c}
            icon="heart-outline"
            label="Favoriler"
            onPress={() => router.push("/(customer)/favorites")}
          />
          <QuickAction
            c={c}
            icon="time-outline"
            label="Geçmiş"
            onPress={() => router.push("/(customer)/appointments")}
          />
          <QuickAction
            c={c}
            icon="star-outline"
            label="Değerlendirmeler"
            onPress={() => {
              // TODO: Değerlendirmeler ekranı
              Alert.alert("Yakında", "Değerlendirmeler ekranı yakında kullanıma girecek.");
            }}
          />
        </View>

        {/* ── Ayarlar ── */}
        <SectionLabel c={c}>Ayarlar</SectionLabel>
        <View style={[styles.menuGroup, { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" }]}>
          {user?.shop ? (
            <MenuRow
              c={c}
              icon="briefcase-outline"
              label="İşletme paneline geç"
              hint={user.shop.name}
              onPress={switchToBusiness}
              divider
            />
          ) : null}
          <MenuRow
            c={c}
            icon="notifications-outline"
            label="Bildirim Ayarları"
            onPress={onNotifSettings}
            divider
          />
          {user && biometricAvailable ? (
            <MenuRow
              c={c}
              icon="finger-print-outline"
              label="Biyometrik Giriş"
              hint={biometricEnabled ? "Etkin" : "Devre dışı"}
              onPress={() => toggleBiometric(!biometricEnabled)}
              divider
            />
          ) : null}
          <MenuRow c={c} icon="help-circle-outline" label="Yardım" onPress={() => {}} disabled />
        </View>

        {/* ── Hesap ── */}
        <SectionLabel c={c}>Hesap</SectionLabel>
        <View style={[styles.menuGroup, { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" }]}>
          <MenuRow c={c} icon="home-outline" label="Ana Ekrana Dön" onPress={goWelcome} divider={!!user} />
          {user ? (
            <>
              <MenuRow
                c={c}
                icon="log-out-outline"
                label="Çıkış Yap"
                onPress={logout}
                destructive
                divider
              />
              <MenuRow
                c={c}
                icon="trash-outline"
                label="Hesabı Sil"
                onPress={onDeleteAccount}
                destructive
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionLabel({ c, children }: { c: typeof Colors.light; children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontFamily: Typography.fontFamily.semiBold,
        color: c.mutedForeground,
        textTransform: "uppercase",
        letterSpacing: 1,
        marginTop: 4,
      }}
    >
      {children}
    </Text>
  );
}

function QuickAction({
  c,
  icon,
  label,
  onPress,
}: {
  c: typeof Colors.light;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.quickAction,
        { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" },
      ]}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: c.secondary,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Ionicons name={icon} size={18} color={c.foreground} />
      </View>
      <Text
        style={{
          fontSize: 11,
          fontFamily: Typography.fontFamily.semiBold,
          color: c.foreground,
          marginTop: 6,
          textAlign: "center",
        }}
        numberOfLines={2}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MenuRow({
  c,
  icon,
  label,
  hint,
  onPress,
  divider,
  disabled,
  destructive,
}: {
  c: typeof Colors.light;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  hint?: string;
  onPress: () => void;
  divider?: boolean;
  disabled?: boolean;
  destructive?: boolean;
}) {
  const color = destructive ? "#B91C1C" : c.foreground;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: c.border,
      }}
    >
      <Ionicons name={icon} size={20} color={disabled ? c.mutedForeground : color} />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 15,
            fontFamily: Typography.fontFamily.medium,
            color: disabled ? c.mutedForeground : color,
          }}
        >
          {label}
        </Text>
        {hint ? (
          <Text
            style={{
              fontSize: 12,
              fontFamily: Typography.fontFamily.regular,
              color: c.mutedForeground,
              marginTop: 1,
            }}
          >
            {hint}
          </Text>
        ) : null}
      </View>
      {disabled ? (
        <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.medium, color: c.mutedForeground }}>
          Yakında
        </Text>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  quickAction: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: "center",
    paddingHorizontal: 4,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  menuGroup: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
});
