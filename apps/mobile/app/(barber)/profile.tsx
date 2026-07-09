import { useState } from "react";
import {
  View, Text, TouchableOpacity, useColorScheme, ScrollView, Alert,
  Switch, StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Colors } from "@/theme/colors";
import { staffService } from "@/services/staff";
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

function RowDivider({ c }: { c: typeof Colors.light }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: c.border }} />;
}

function groupRanges(holidays: BarberHoliday[]) {
  if (!holidays.length) return [];
  const sorted = [...holidays].sort((a, b) => a.date.localeCompare(b.date));
  const ranges: { start: string; end: string; label: string; ids: string[] }[] = [];
  let cur = { start: sorted[0].date, end: sorted[0].date, label: sorted[0].label, ids: [sorted[0].id] };
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i-1].date + "T12:00:00");
    const curr = new Date(sorted[i].date   + "T12:00:00");
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diff === 1 && sorted[i].label === cur.label) {
      cur.end = sorted[i].date;
      cur.ids.push(sorted[i].id);
    } else {
      ranges.push(cur);
      cur = { start: sorted[i].date, end: sorted[i].date, label: sorted[i].label, ids: [sorted[i].id] };
    }
  }
  ranges.push(cur);
  return ranges;
}

export default function BarberProfileScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const { user, logout, logoutAll } = useAuth();
  const qc = useQueryClient();

  const today = todayISO();
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker,   setShowEndPicker]   = useState(false);
  const [leaveStart, setLeaveStart] = useState(today);
  const [leaveEnd,   setLeaveEnd]   = useState(today);
  const [leaveLabel, setLeaveLabel] = useState("İzin");
  const [showLeaveForm, setShowLeaveForm] = useState(false);

  const barber = user?.barber;
  const initials = (barber?.nameTr ?? user?.displayName ?? "B")
    .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();

  // Fetch own leaves
  const { data: leaves = [], isLoading: leavesLoading } = useQuery({
    queryKey: queryKeys.staff.myLeave(),
    queryFn: staffService.myLeaves,
    staleTime: 30_000,
  });

  const leaveRanges = groupRanges(leaves);

  // Determine status
  const onLeaveToday = leaves.some((h) => h.date === today);
  const upcomingLeave = leaves.length > 0;
  const isAvailable   = user?.barber != null; // optimistic; real value comes from barber.available

  const toggleMutation = useMutation({
    mutationFn: (v: boolean) => staffService.toggleAvailability(v),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["me"] }),
    onError: () => Alert.alert("Hata", "Durum değiştirilemedi."),
  });

  const addLeaveMutation = useMutation({
    mutationFn: () => staffService.addMyLeave({ startDate: leaveStart, endDate: leaveEnd, label: leaveLabel }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff.myLeave() });
      setShowLeaveForm(false);
      Alert.alert("Tamam", "İzin kaydedildi.");
    },
    onError: (e: { message?: string }) => Alert.alert("Hata", e?.message ?? "İzin eklenemedi."),
  });

  const deleteLeaveMutation = useMutation({
    mutationFn: (id: string) => staffService.deleteMyLeave(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.staff.myLeave() }),
    onError: () => Alert.alert("Hata", "İzin silinemedi."),
  });

  const handleLogout = () =>
    Alert.alert("Çıkış", "Oturumu kapatmak istiyor musunuz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: logout },
    ]);

  const handleLogoutAll = () =>
    Alert.alert("Tüm Cihazlardan Çıkış", "Tüm cihazlardaki oturumlar kapatılacak. Emin misiniz?", [
      { text: "İptal", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: logoutAll },
    ]);

  // Status badge
  const statusCfg = onLeaveToday
    ? { label: "İzinde", color: "#F59E0B", bg: "#F59E0B22" }
    : upcomingLeave
    ? { label: "Yaklaşan İzin", color: "#F59E0B", bg: "#F59E0B22" }
    : { label: "Aktif", color: "#10B981", bg: "#10B98122" };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
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
        {/* Avatar + status */}
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, { backgroundColor: c.primary }]}>
            <Text style={[styles.avatarInitials, { color: c.primaryForeground }]}>{initials}</Text>
          </View>
          <Text style={[styles.name, { color: c.foreground }]}>
            {barber?.nameTr ?? user?.displayName}
          </Text>
          <Text style={[styles.shopName, { color: c.mutedForeground }]}>{user?.shop?.name ?? "Berber"}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </View>

        {/* Availability toggle */}
        <Section title="DURUM" c={c}>
          <View style={styles.row}>
            <View style={{ gap: 2 }}>
              <Text style={[styles.rowLabel, { color: c.foreground }]}>Müsait</Text>
              <Text style={[styles.rowHint, { color: c.mutedForeground }]}>
                Kapatırsan müşteriler seni seçemez
              </Text>
            </View>
            <Switch
              value={toggleMutation.isPending ? !isAvailable : isAvailable}
              onValueChange={(v) => toggleMutation.mutate(v)}
              disabled={toggleMutation.isPending}
              trackColor={{ true: "#10B981", false: "#6B7280" }}
            />
          </View>
        </Section>

        {/* Leave management */}
        <Section title="İZİN" c={c}>
          {leavesLoading ? (
            <View style={{ padding: 20, alignItems: "center" }}>
              <ActivityIndicator color={c.mutedForeground} />
            </View>
          ) : (
            <>
              {leaveRanges.map((range) => (
                <View key={range.start}>
                  <View style={styles.leaveRangeRow}>
                    <View style={{ gap: 2, flex: 1 }}>
                      <Text style={[styles.rowLabel, { color: c.foreground }]}>{range.label}</Text>
                      <Text style={[styles.rowHint, { color: c.mutedForeground }]}>
                        {range.start === range.end ? fmtDate(range.start) : `${fmtDate(range.start)} – ${fmtDate(range.end)}`}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => Alert.alert("İzni İptal Et", "Bu izin silinsin mi?", [
                        { text: "İptal", style: "cancel" },
                        { text: "Sil", style: "destructive", onPress: () => range.ids.forEach((id) => deleteLeaveMutation.mutate(id)) },
                      ])}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="close-circle-outline" size={20} color="#B91C1C" />
                    </TouchableOpacity>
                  </View>
                  <RowDivider c={c} />
                </View>
              ))}

              {!showLeaveForm ? (
                <TouchableOpacity
                  onPress={() => setShowLeaveForm(true)}
                  style={styles.addLeaveBtn}
                >
                  <Ionicons name="add-circle-outline" size={18} color={c.primary} />
                  <Text style={[styles.addLeaveBtnText, { color: c.primary }]}>İzin Ekle</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.leaveForm}>
                  <Text style={[styles.rowLabel, { color: c.foreground }]}>İzin Tarihleri</Text>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={() => setShowStartPicker(true)}
                      style={[styles.datePill, { backgroundColor: c.secondary, flex: 1 }]}
                    >
                      <Ionicons name="calendar-outline" size={13} color={c.mutedForeground} />
                      <Text style={[styles.datePillText, { color: c.foreground }]}>{fmtDate(leaveStart)}</Text>
                    </TouchableOpacity>
                    <Ionicons name="arrow-forward" size={13} color={c.mutedForeground} style={{ alignSelf: "center" }} />
                    <TouchableOpacity
                      onPress={() => setShowEndPicker(true)}
                      style={[styles.datePill, { backgroundColor: c.secondary, flex: 1 }]}
                    >
                      <Ionicons name="calendar-outline" size={13} color={c.mutedForeground} />
                      <Text style={[styles.datePillText, { color: c.foreground }]}>{fmtDate(leaveEnd)}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: "row", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                    {["İzin", "Yıllık İzin", "Hastalık", "Kişisel"].map((lbl) => (
                      <TouchableOpacity
                        key={lbl}
                        onPress={() => setLeaveLabel(lbl)}
                        style={[styles.labelChip, { backgroundColor: leaveLabel === lbl ? c.primary : c.secondary }]}
                      >
                        <Text style={{ fontFamily: "Outfit_500Medium", fontSize: 12, color: leaveLabel === lbl ? c.primaryForeground : c.foreground }}>
                          {lbl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
                    <TouchableOpacity
                      onPress={() => setShowLeaveForm(false)}
                      style={[styles.cancelLeaveBtn, { borderColor: c.border }]}
                    >
                      <Text style={{ fontFamily: "Outfit_500Medium", color: c.mutedForeground, fontSize: 14 }}>İptal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => addLeaveMutation.mutate()}
                      disabled={addLeaveMutation.isPending}
                      style={[styles.saveLeaveBtn, { backgroundColor: "#F59E0B", flex: 1 }]}
                    >
                      <Text style={{ fontFamily: "Outfit_600SemiBold", color: "#fff", fontSize: 14 }}>
                        {addLeaveMutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </>
          )}
        </Section>

        {/* Info */}
        {user?.email && (
          <Section title="HESAP" c={c}>
            <View style={styles.row}>
              <Text style={[styles.rowHint, { color: c.mutedForeground }]}>{user.email}</Text>
            </View>
          </Section>
        )}

        {/* Session */}
        <Section title="OTURUM" c={c}>
          <TouchableOpacity onPress={handleLogout} style={styles.row}>
            <Ionicons name="log-out-outline" size={18} color="#B91C1C" />
            <Text style={{ fontFamily: "Outfit_600SemiBold", color: "#B91C1C", fontSize: 14 }}>Çıkış Yap</Text>
          </TouchableOpacity>
          <RowDivider c={c} />
          <TouchableOpacity onPress={handleLogoutAll} style={styles.row}>
            <Ionicons name="phone-portrait-outline" size={18} color="#B91C1C" />
            <Text style={{ fontFamily: "Outfit_600SemiBold", color: "#B91C1C", fontSize: 14 }}>Tüm Cihazlardan Çıkış</Text>
          </TouchableOpacity>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scroll:       { padding: 20, gap: 20, paddingBottom: 48 },
  avatarWrap:   { alignItems: "center", paddingVertical: 20, gap: 6 },
  avatar:       { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  avatarInitials: { fontFamily: "Outfit_700Bold", fontSize: 26 },
  name:         { fontFamily: "Outfit_700Bold", fontSize: 20, letterSpacing: -0.3 },
  shopName:     { fontFamily: "Outfit_400Regular", fontSize: 13 },
  statusBadge:  { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, marginTop: 4 },
  statusText:   { fontFamily: "Outfit_600SemiBold", fontSize: 12 },
  section:      { gap: 8 },
  sectionTitle: { fontFamily: "Outfit_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 4 },
  sectionCard:  { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row:          { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowLabel:     { fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  rowHint:      { fontFamily: "Outfit_400Regular", fontSize: 12 },
  leaveRangeRow: { flexDirection: "row", alignItems: "center", padding: 14, gap: 12 },
  addLeaveBtn:  { flexDirection: "row", alignItems: "center", gap: 8, padding: 14 },
  addLeaveBtnText: { fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  leaveForm:    { padding: 14, gap: 0 },
  datePill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 9, borderRadius: 10,
  },
  datePillText: { fontFamily: "Outfit_500Medium", fontSize: 12 },
  labelChip:    { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
  cancelLeaveBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, alignItems: "center" },
  saveLeaveBtn: { paddingVertical: 12, borderRadius: 10, alignItems: "center" },
});
