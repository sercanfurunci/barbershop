import { useState, useEffect } from "react";
import {
  View, Text, Switch, ScrollView,
  ActivityIndicator, Alert, useColorScheme, StyleSheet, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import * as Notifications from "expo-notifications";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { customerService } from "@/services/customer";
import { useAuthStore } from "@/store/auth";
import { haptics } from "@/utils/haptics";

export default function NotificationsScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [prefs, setPrefs] = useState({
    notifAppt: user?.notifAppt !== false,
    notifReminder: user?.notifReminder !== false,
    notifPromo: user?.notifPromo === true,
  });

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) => setPermissionStatus(status));
  }, []);

  const requestPermission = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === "granted") haptics.success();
  };

  const toggle = (key: keyof typeof prefs) => (val: boolean) => {
    haptics.light();
    setPrefs((p) => ({ ...p, [key]: val }));
    save({ ...prefs, [key]: val });
  };

  const save = async (updated: typeof prefs) => {
    if (!user) return;
    setSaving(true);
    try {
      const result = await customerService.updateProfile(updated);
      setUser({ ...user, ...updated });
    } catch {
      Alert.alert("Hata", "Ayarlar kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Bildirim Ayarları",
          headerTitleStyle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 17, color: c.foreground },
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 16 }}>
              <Ionicons name="chevron-back" size={24} color={c.foreground} />
            </TouchableOpacity>
          ),
          headerRight: () => saving ? <ActivityIndicator size="small" color={c.primary} style={{ marginRight: 8 }} /> : null,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["bottom"]}>
        <ScrollView contentContainerStyle={styles.scroll}>

          {/* Permission banner */}
          {permissionStatus === "denied" && (
            <View style={[styles.banner, { backgroundColor: "#FEF3C7" }]}>
              <Ionicons name="warning-outline" size={20} color="#B45309" />
              <Text style={[styles.bannerText, { color: "#92400E" }]}>
                Bildirimler devre dışı. Ayarlardan izin ver.
              </Text>
            </View>
          )}
          {permissionStatus === "undetermined" && (
            <TouchableOpacity
              onPress={requestPermission}
              style={[styles.banner, { backgroundColor: c.primary + "15" }]}
            >
              <Ionicons name="notifications-outline" size={20} color={c.primary} />
              <Text style={[styles.bannerText, { color: c.primary }]}>
                Bildirimlere izin ver →
              </Text>
            </TouchableOpacity>
          )}

          <SectionLabel c={c}>RANDEVU BİLDİRİMLERİ</SectionLabel>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Row
              c={c}
              label="Randevu Onayı"
              hint="Randevunuz onaylandığında bildirim alın"
              value={prefs.notifAppt}
              onChange={toggle("notifAppt")}
            />
            <Row
              c={c}
              label="Hatırlatma"
              hint="Randevunuzdan önce hatırlatıcı alın"
              value={prefs.notifReminder}
              onChange={toggle("notifReminder")}
              last
            />
          </View>

          <SectionLabel c={c}>KAMPANYA VE HEDİYELER</SectionLabel>
          <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
            <Row
              c={c}
              label="Kampanya Bildirimleri"
              hint="Fırsatlar ve promosyonlar hakkında bilgi alın"
              value={prefs.notifPromo}
              onChange={toggle("notifPromo")}
              last
            />
          </View>

          <Text style={[styles.footer, { color: c.mutedForeground }]}>
            Bildirim sıklığını kontrol altında tutuyoruz. Gereksiz bildirim göndermeyiz.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function SectionLabel({ c, children }: { c: typeof Colors.light; children: string }) {
  return (
    <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>{children}</Text>
  );
}

function Row({ c, label, hint, value, onChange, last }: {
  c: typeof Colors.light; label: string; hint?: string;
  value: boolean; onChange: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowLabel, { color: c.foreground }]}>{label}</Text>
        {hint && <Text style={[styles.rowHint, { color: c.mutedForeground }]}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.primary, false: "#6B7280" }} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll:       { padding: 20, gap: 12, paddingBottom: 48 },
  banner:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, marginBottom: 4 },
  bannerText:   { fontFamily: Typography.fontFamily.medium, fontSize: 14, flex: 1 },
  sectionLabel: { fontFamily: Typography.fontFamily.semiBold, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 4, marginTop: 8 },
  card:         { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row:          { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowLabel:     { fontFamily: Typography.fontFamily.semiBold, fontSize: 14 },
  rowHint:      { fontFamily: Typography.fontFamily.regular, fontSize: 12 },
  footer:       { fontFamily: Typography.fontFamily.regular, fontSize: 12, textAlign: "center", paddingHorizontal: 16, marginTop: 8 },
});
