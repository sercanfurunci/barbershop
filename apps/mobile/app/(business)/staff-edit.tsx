import { useState, useCallback } from "react";
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  useColorScheme, Alert, StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { staffService } from "@/services/staff";
import { useAuthStore } from "@/store/auth";
import { queryKeys } from "@/utils/queryKeys";
import { DatePickerSheet } from "@/components/ui/DatePickerSheet";
import type { BarberHoliday } from "@/types/api";

const TR_MONTHS_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: typeof Colors.light }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: c.mutedForeground }]}>{title}</Text>
      <View style={[styles.sectionCard, { backgroundColor: c.card, borderColor: c.border }]}>
        {children}
      </View>
    </View>
  );
}

function RowItem({ label, children, last, c }: {
  label: string; children: React.ReactNode; last?: boolean; c: typeof Colors.light;
}) {
  return (
    <View style={[styles.rowItem, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Text style={[styles.rowLabel, { color: c.mutedForeground }]}>{label}</Text>
      {children}
    </View>
  );
}

export default function StaffEditScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const shopId = user?.shop?.id ?? "";
  const today = todayISO();

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker,   setShowEndPicker]   = useState(false);
  const [leaveStart, setLeaveStart] = useState(today);
  const [leaveEnd,   setLeaveEnd]   = useState(today);
  const [leaveLabel, setLeaveLabel] = useState("İzin");

  const { data: barber, isLoading } = useQuery({
    queryKey: queryKeys.staff.detail(id),
    queryFn: () => staffService.get(id),
    enabled: !!id,
  });

  const { data: allHolidays = [] } = useQuery({
    queryKey: queryKeys.staff.holidays(shopId),
    queryFn: staffService.listHolidays,
    enabled: !!shopId,
    staleTime: 30_000,
  });

  // Upcoming holidays for this barber
  const myHolidays: BarberHoliday[] = allHolidays
    .filter((h) => h.barberId === id && h.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  // Group consecutive holiday dates into ranges for display
  function groupRanges(holidays: BarberHoliday[]) {
    if (!holidays.length) return [];
    const ranges: { start: string; end: string; label: string; ids: string[] }[] = [];
    let cur = { start: holidays[0].date, end: holidays[0].date, label: holidays[0].label, ids: [holidays[0].id] };
    for (let i = 1; i < holidays.length; i++) {
      const prev = new Date(holidays[i-1].date + "T12:00:00");
      const curr = new Date(holidays[i].date + "T12:00:00");
      const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
      if (diffDays === 1 && holidays[i].label === cur.label) {
        cur.end = holidays[i].date;
        cur.ids.push(holidays[i].id);
      } else {
        ranges.push(cur);
        cur = { start: holidays[i].date, end: holidays[i].date, label: holidays[i].label, ids: [holidays[i].id] };
      }
    }
    ranges.push(cur);
    return ranges;
  }

  const leaveRanges = groupRanges(myHolidays);

  const invalidateAll = useCallback(() => {
    qc.invalidateQueries({ queryKey: queryKeys.staff.detail(id) });
    qc.invalidateQueries({ queryKey: queryKeys.staff.holidays(shopId) });
    qc.invalidateQueries({ queryKey: queryKeys.staff.list(shopId) });
  }, [qc, id, shopId]);

  const toggleMutation = useMutation({
    mutationFn: (available: boolean) => staffService.update(id, { available }),
    onSuccess: invalidateAll,
    onError: () => Alert.alert("Hata", "Durum değiştirilemedi."),
  });

  const addLeaveMutation = useMutation({
    mutationFn: () => staffService.addLeave({ startDate: leaveStart, endDate: leaveEnd, label: leaveLabel, barberId: id }),
    onSuccess: () => { invalidateAll(); Alert.alert("Tamam", "İzin eklendi."); },
    onError: () => Alert.alert("Hata", "İzin eklenemedi."),
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((hid) => staffService.deleteHoliday(hid))),
    onSuccess: invalidateAll,
    onError: () => Alert.alert("Hata", "İzin silinemedi."),
  });

  const deleteMutation = useMutation({
    mutationFn: () => staffService.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff.list(shopId) });
      router.back();
    },
    onError: () => Alert.alert("Hata", "Berber silinemedi."),
  });

  if (isLoading || !barber) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ headerShown: true, title: "Berber Düzenle", headerBackTitle: "Personel" }} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={c.foreground} />
        </View>
      </SafeAreaView>
    );
  }

  const initials = barber.nameTr.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={["left","right","bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: barber.nameTr, headerBackTitle: "Personel" }} />

      <DatePickerSheet
        visible={showStartPicker}
        value={leaveStart}
        minDate={today}
        title="İzin Başlangıcı"
        onSelect={(iso) => { setLeaveStart(iso); if (iso > leaveEnd) setLeaveEnd(iso); }}
        onClose={() => setShowStartPicker(false)}
      />
      <DatePickerSheet
        visible={showEndPicker}
        value={leaveEnd}
        minDate={leaveStart}
        title="İzin Bitişi"
        onSelect={setLeaveEnd}
        onClose={() => setShowEndPicker(false)}
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={[styles.avatarText, { color: c.primaryForeground }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: c.foreground }]}>{barber.nameTr}</Text>
          <Text style={[styles.title, { color: c.mutedForeground }]}>{barber.titleTr}</Text>
        </View>

        {/* Availability */}
        <Section title="DURUM" c={c}>
          <RowItem label="Müsait" last c={c}>
            <Switch
              value={barber.available}
              onValueChange={(v) => toggleMutation.mutate(v)}
              disabled={toggleMutation.isPending}
              trackColor={{ true: "#10B981", false: "#6B7280" }}
            />
          </RowItem>
        </Section>

        {/* Leave management */}
        <Section title="İZİN YÖNETİMİ" c={c}>
          {/* Existing leaves */}
          {leaveRanges.map((range, i) => (
            <View
              key={range.start}
              style={[styles.leaveRow, { borderBottomColor: c.border }, i < leaveRanges.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.leaveLabel, { color: c.foreground }]}>{range.label}</Text>
                <Text style={[styles.leaveDate, { color: c.mutedForeground }]}>
                  {range.start === range.end ? fmtDate(range.start) : `${fmtDate(range.start)} – ${fmtDate(range.end)}`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => Alert.alert("İzni Sil", "Bu izin silinsin mi?", [
                  { text: "İptal", style: "cancel" },
                  { text: "Sil", style: "destructive", onPress: () => deleteLeaveMutation.mutate(range.ids) },
                ])}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="trash-outline" size={16} color="#B91C1C" />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add leave form */}
          <View style={styles.addLeaveForm}>
            <Text style={[styles.addLeaveTitle, { color: c.foreground }]}>İzin Ekle</Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <TouchableOpacity
                onPress={() => setShowStartPicker(true)}
                style={[styles.datePill, { backgroundColor: c.secondary, flex: 1 }]}
              >
                <Ionicons name="calendar-outline" size={14} color={c.mutedForeground} />
                <Text style={[styles.datePillText, { color: c.foreground }]}>{fmtDate(leaveStart)}</Text>
              </TouchableOpacity>
              <Ionicons name="arrow-forward" size={14} color={c.mutedForeground} style={{ alignSelf: "center" }} />
              <TouchableOpacity
                onPress={() => setShowEndPicker(true)}
                style={[styles.datePill, { backgroundColor: c.secondary, flex: 1 }]}
              >
                <Ionicons name="calendar-outline" size={14} color={c.mutedForeground} />
                <Text style={[styles.datePillText, { color: c.foreground }]}>{fmtDate(leaveEnd)}</Text>
              </TouchableOpacity>
            </View>
            {/* Label quick-select */}
            <View style={{ flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              {["İzin", "Yıllık İzin", "Hastalık", "Kişisel"].map((lbl) => (
                <TouchableOpacity
                  key={lbl}
                  onPress={() => setLeaveLabel(lbl)}
                  style={[styles.labelChip, {
                    backgroundColor: leaveLabel === lbl ? c.primary : c.secondary,
                  }]}
                >
                  <Text style={{ fontFamily: "Outfit_500Medium", fontSize: 12, color: leaveLabel === lbl ? c.primaryForeground : c.foreground }}>
                    {lbl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              onPress={() => addLeaveMutation.mutate()}
              disabled={addLeaveMutation.isPending}
              style={[styles.addLeaveBtn, { backgroundColor: "#F59E0B" }]}
            >
              <Text style={styles.addLeaveBtnText}>
                {addLeaveMutation.isPending ? "Ekleniyor..." : "İzni Kaydet"}
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        {/* Danger zone */}
        <Section title="DİĞER" c={c}>
          <TouchableOpacity
            onPress={() => Alert.alert("Berberi Sil", `${barber.nameTr} silinecek. Bu işlem geri alınamaz.`, [
              { text: "İptal", style: "cancel" },
              { text: "Sil", style: "destructive", onPress: () => deleteMutation.mutate() },
            ])}
            style={[styles.rowItem, { justifyContent: "center" }]}
          >
            <Text style={{ fontFamily: "Outfit_600SemiBold", color: "#B91C1C", fontSize: 14 }}>
              Berberi Sil
            </Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scroll:       { padding: 20, paddingBottom: 48, gap: 20 },
  avatarWrap:   { alignItems: "center", paddingVertical: 20, gap: 6 },
  avatar:       { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  avatarText:   { fontFamily: "Outfit_700Bold", fontSize: 26 },
  name:         { fontFamily: "Outfit_700Bold", fontSize: 20, letterSpacing: -0.3 },
  title:        { fontFamily: "Outfit_400Regular", fontSize: 13 },
  section:      { gap: 8 },
  sectionTitle: { fontFamily: "Outfit_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 4 },
  sectionCard:  { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  rowItem:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  rowLabel:     { fontFamily: "Outfit_500Medium", fontSize: 14 },
  leaveRow:     { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  leaveLabel:   { fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  leaveDate:    { fontFamily: "Outfit_400Regular", fontSize: 12 },
  addLeaveForm: { padding: 14, gap: 0 },
  addLeaveTitle: { fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  datePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10,
  },
  datePillText: { fontFamily: "Outfit_500Medium", fontSize: 12 },
  labelChip:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  addLeaveBtn:  { marginTop: 12, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  addLeaveBtnText: { fontFamily: "Outfit_600SemiBold", color: "#fff", fontSize: 14 },
});
