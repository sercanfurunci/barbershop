import { useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  useColorScheme, RefreshControl, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { staffService } from "@/services/staff";
import { useAuthStore } from "@/store/auth";
import { queryKeys } from "@/utils/queryKeys";
import type { BarberAdmin, BarberHoliday } from "@/types/api";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

type StatusKey = "active" | "unavailable" | "on_leave";

function barberStatus(b: BarberAdmin, holidays: BarberHoliday[], today: string): StatusKey {
  const onLeave = holidays.some((h) => h.barberId === b.id && h.date >= today);
  if (onLeave) return "on_leave";
  if (!b.available) return "unavailable";
  return "active";
}

const STATUS_CONFIG: Record<StatusKey, { label: string; color: string; bg: string }> = {
  active:      { label: "Aktif",         color: "#10B981", bg: "#10B98122" },
  unavailable: { label: "Müsait Değil",  color: "#6B7280", bg: "#6B728022" },
  on_leave:    { label: "İzinde",        color: "#F59E0B", bg: "#F59E0B22" },
};

function Avatar({ name, avatar, c }: { name: string; avatar?: string; c: typeof Colors.light }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <View style={[styles.avatar, { backgroundColor: c.primary }]}>
      <Text style={[styles.avatarText, { color: c.primaryForeground }]}>{initials}</Text>
    </View>
  );
}

function BarberCard({ barber, status, onPress, c }: {
  barber: BarberAdmin;
  status: StatusKey;
  onPress: () => void;
  c: typeof Colors.light;
}) {
  const cfg = STATUS_CONFIG[status];
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <Avatar name={barber.nameTr} c={c} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.barberName, { color: c.foreground }]}>{barber.nameTr}</Text>
        <Text style={[styles.barberTitle, { color: c.mutedForeground }]}>{barber.titleTr}</Text>
      </View>
      <View style={{ alignItems: "flex-end", gap: 6 }}>
        <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={c.mutedForeground} />
      </View>
    </TouchableOpacity>
  );
}

export default function StaffScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const shopId = user?.shop?.id ?? "";
  const today = todayISO();

  const { data: barbers = [], isFetching: fetchingBarbers, refetch: refetchBarbers } = useQuery({
    queryKey: queryKeys.staff.list(shopId),
    queryFn: staffService.list,
    enabled: !!shopId,
    staleTime: 30_000,
  });

  const { data: holidays = [], refetch: refetchHolidays } = useQuery({
    queryKey: queryKeys.staff.holidays(shopId),
    queryFn: staffService.listHolidays,
    enabled: !!shopId,
    staleTime: 30_000,
  });

  function refetch() { refetchBarbers(); refetchHolidays(); }

  const withStatus = useMemo(() =>
    barbers.map((b) => ({ barber: b, status: barberStatus(b, holidays, today) })),
    [barbers, holidays, today]
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={["top","left","right"]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.foreground }]}>Personel</Text>
        <TouchableOpacity
          onPress={() => router.push("/(business)/staff-create")}
          style={[styles.addBtn, { backgroundColor: c.primary }]}
        >
          <Ionicons name="add" size={18} color={c.primaryForeground} />
          <Text style={[styles.addBtnText, { color: c.primaryForeground }]}>Berber Ekle</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={fetchingBarbers} onRefresh={refetch} tintColor={c.foreground} />}
      >
        {withStatus.length === 0 && !fetchingBarbers && (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={40} color={c.mutedForeground} />
            <Text style={[styles.emptyText, { color: c.mutedForeground }]}>Henüz berber yok</Text>
          </View>
        )}

        {withStatus.map(({ barber, status }) => (
          <BarberCard
            key={barber.id}
            barber={barber}
            status={status}
            c={c}
            onPress={() => router.push({ pathname: "/(business)/staff-edit", params: { id: barber.id } })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  header:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title:       { fontFamily: "Outfit_700Bold", fontSize: 24, letterSpacing: -0.5 },
  addBtn:      { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12 },
  addBtnText:  { fontFamily: "Outfit_600SemiBold", fontSize: 13 },
  list:        { paddingHorizontal: 20, paddingBottom: 40, gap: 10 },
  card: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderRadius: 14, borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  avatar:      { width: 44, height: 44, borderRadius: 22, justifyContent: "center", alignItems: "center" },
  avatarText:  { fontFamily: "Outfit_700Bold", fontSize: 16 },
  barberName:  { fontFamily: "Outfit_600SemiBold", fontSize: 15 },
  barberTitle: { fontFamily: "Outfit_400Regular", fontSize: 12 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText:  { fontFamily: "Outfit_600SemiBold", fontSize: 10 },
  empty:       { alignItems: "center", marginTop: 60, gap: 8 },
  emptyText:   { fontFamily: "Outfit_400Regular", fontSize: 14 },
});
