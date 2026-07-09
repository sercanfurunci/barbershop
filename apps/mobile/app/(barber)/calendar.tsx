import {
  useRef, useState, useCallback, useMemo,
} from "react";
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  useColorScheme, RefreshControl, Dimensions, Animated,
  StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { appointmentsService } from "@/services/appointments";
import { staffService } from "@/services/staff";
import { queryKeys } from "@/utils/queryKeys";
import type { Appointment } from "@/types/api";

// ─── Constants ────────────────────────────────────────────────────────────────

const { width: SCREEN_W } = Dimensions.get("window");
const WEEKS_BEFORE = 52;
const WEEKS_AFTER  = 52;
const TOTAL_WEEKS  = WEEKS_BEFORE + WEEKS_AFTER + 1;
const INITIAL_IDX  = WEEKS_BEFORE;

const TR_DAYS  = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const TR_MONTHS = [
  "Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık",
];

const STATUS_COLOR: Record<string, string> = {
  PENDING:   "#F59E0B",
  CONFIRMED: "#10B981",
  COMPLETED: "#6B7280",
  CANCELLED: "#EF4444",
  NOSHOW:    "#EF4444",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING:   "Bekliyor",
  CONFIRMED: "Onaylandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
  NOSHOW:    "Gelmedi",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // Monday
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Pre-generate all week starts so FlatList getItemLayout is exact.
const TODAY     = new Date();
const TODAY_ISO = toISO(TODAY);
const BASE_WEEK = startOfWeek(TODAY);

const ALL_WEEKS: Date[] = Array.from({ length: TOTAL_WEEKS }, (_, i) =>
  addDays(BASE_WEEK, (i - WEEKS_BEFORE) * 7)
);

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ c }: { c: typeof Colors.light }) {
  return (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: c.secondary }]}>
        <Ionicons name="calendar-clear-outline" size={28} color={c.mutedForeground} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.foreground }]}>Randevu yok</Text>
      <Text style={[styles.emptySubtitle, { color: c.mutedForeground }]}>Bugün müsaitsiniz.</Text>
    </View>
  );
}

function ApptRow({ a, c, isLast }: { a: Appointment; c: typeof Colors.light; isLast: boolean }) {
  const color = STATUS_COLOR[a.status] ?? "#6B7280";
  const label = STATUS_LABEL[a.status] ?? a.status;

  return (
    <View style={[styles.apptRow, !isLast && { borderBottomWidth: 1, borderBottomColor: c.border }]}>
      {/* Time column */}
      <View style={styles.timeCol}>
        <Text style={[styles.timeText, { color: c.foreground }]}>{a.time}</Text>
        <Text style={[styles.durText, { color: c.mutedForeground }]}>{a.duration}dk</Text>
      </View>

      {/* Status bar */}
      <View style={[styles.statusBar, { backgroundColor: color }]} />

      {/* Details */}
      <View style={styles.apptDetails}>
        <Text style={[styles.clientName, { color: c.foreground }]} numberOfLines={1}>
          {a.client.name}
        </Text>
        <Text style={[styles.serviceName, { color: c.mutedForeground }]} numberOfLines={1}>
          {a.service.nameTr}
        </Text>
      </View>

      {/* Status badge */}
      <View style={[styles.badge, { backgroundColor: color + "22" }]}>
        <Text style={[styles.badgeText, { color }]}>{label}</Text>
      </View>
    </View>
  );
}

function DayChip({
  date, isSelected, isToday, c, onPress,
}: {
  date: Date;
  isSelected: boolean;
  isToday: boolean;
  c: typeof Colors.light;
  onPress: () => void;
}) {
  const bg = isSelected ? c.primary : isToday ? c.primary + "20" : "transparent";
  const dayColor = isSelected ? c.primaryForeground : c.mutedForeground;
  const numColor = isSelected ? c.primaryForeground : isToday ? c.primary : c.foreground;

  return (
    <TouchableOpacity onPress={onPress} style={[styles.dayChip, { backgroundColor: bg }]} activeOpacity={0.7}>
      <Text style={[styles.dayLabel, { color: dayColor }]}>{TR_DAYS[date.getDay()]}</Text>
      <Text style={[styles.dayNum, { color: numColor }]}>{date.getDate()}</Text>
    </TouchableOpacity>
  );
}

// ─── Week Strip (one "page" of the FlatList) ─────────────────────────────────

type WeekStripProps = {
  weekStart: Date;
  selected: string;
  c: typeof Colors.light;
  onSelect: (iso: string) => void;
};

function WeekStrip({ weekStart, selected, c, onSelect }: WeekStripProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  return (
    <View style={[styles.weekStrip, { width: SCREEN_W }]}>
      {days.map((d) => {
        const iso = toISO(d);
        return (
          <DayChip
            key={iso}
            date={d}
            isSelected={iso === selected}
            isToday={iso === TODAY_ISO}
            c={c}
            onPress={() => onSelect(iso)}
          />
        );
      })}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function BarberCalendarScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const qc = useQueryClient();

  const [selected, setSelected]     = useState(TODAY_ISO);
  const [weekIdx, setWeekIdx]        = useState(INITIAL_IDX);
  const listRef = useRef<FlatList>(null);

  // Month label derived from visible week
  const visibleMonth = ALL_WEEKS[weekIdx];
  const monthLabel = `${TR_MONTHS[visibleMonth.getMonth()]} ${visibleMonth.getFullYear()}`;

  // Fetch selected day's appointments (cached per day)
  const { data: appts = [], isFetching, refetch } = useQuery({
    queryKey: ["barber-cal", selected],
    queryFn: () => appointmentsService.list({ date: selected }),
    staleTime: 60_000,
  });

  // Fetch own upcoming leaves — for status badge
  const { data: leaves = [] } = useQuery({
    queryKey: queryKeys.staff.myLeave(),
    queryFn: staffService.myLeaves,
    staleTime: 60_000,
  });
  const isOnLeave = leaves.some((h: { date: string }) => h.date === selected);

  // Prefetch adjacent days silently
  const prefetchDay = useCallback((iso: string) => {
    qc.prefetchQuery({
      queryKey: ["barber-cal", iso],
      queryFn: () => appointmentsService.list({ date: iso }),
      staleTime: 60_000,
    });
  }, [qc]);

  const handleSelectDay = useCallback((iso: string) => {
    setSelected(iso);
    prefetchDay(toISO(addDays(new Date(iso + "T12:00:00"), 1)));
    prefetchDay(toISO(addDays(new Date(iso + "T12:00:00"), -1)));
  }, [prefetchDay]);

  // When week pager scrolls, update weekIdx and month title
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems[0]?.index != null) {
      setWeekIdx(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 51 }).current;

  const jumpWeek = useCallback((delta: number) => {
    const next = Math.max(0, Math.min(TOTAL_WEEKS - 1, weekIdx + delta));
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [weekIdx]);

  const sorted = useMemo(
    () => [...appts].sort((a, b) => a.time.localeCompare(b.time)),
    [appts]
  );

  const renderWeek = useCallback(({ item }: { item: Date }) => (
    <WeekStrip weekStart={item} selected={selected} c={c} onSelect={handleSelectDay} />
  ), [selected, c, handleSelectDay]);

  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: SCREEN_W, offset: SCREEN_W * index, index,
  }), []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={["top", "left", "right"]}>

      {/* ── Header ─────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: c.border }]}>
        <TouchableOpacity onPress={() => jumpWeek(-1)} hitSlop={HIT} style={styles.arrow}>
          <Ionicons name="chevron-back" size={20} color={c.foreground} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: c.foreground }]}>{monthLabel}</Text>
        <TouchableOpacity onPress={() => jumpWeek(1)} hitSlop={HIT} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={20} color={c.foreground} />
        </TouchableOpacity>
      </View>

      {/* ── Week Pager ─────────────────────────────────── */}
      <FlatList
        ref={listRef}
        data={ALL_WEEKS}
        renderItem={renderWeek}
        keyExtractor={(d) => toISO(d)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={getItemLayout}
        initialScrollIndex={INITIAL_IDX}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={16}
        decelerationRate="fast"
        style={styles.weekPager}
      />

      {/* ── Divider ────────────────────────────────────── */}
      <View style={[styles.divider, { backgroundColor: c.border }]} />

      {/* ── Appointment List ───────────────────────────── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.foreground} />
        }
      >
        {isOnLeave && (
          <View style={[styles.leaveBanner, { backgroundColor: "#F59E0B22" }]}>
            <Ionicons name="sunny-outline" size={16} color="#F59E0B" />
            <Text style={{ fontFamily: "Outfit_600SemiBold", color: "#F59E0B", fontSize: 13 }}>İzin günü</Text>
          </View>
        )}
        {isFetching && appts.length === 0 ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={c.mutedForeground} />
          </View>
        ) : sorted.length === 0 ? (
          <EmptyState c={c} />
        ) : (
          <View style={[styles.apptCard, { backgroundColor: c.card, borderColor: c.border }]}>
            {sorted.map((a, i) => (
              <ApptRow key={a.id} a={a} c={c} isLast={i === sorted.length - 1} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const HIT = { top: 12, bottom: 12, left: 16, right: 16 };

const styles = StyleSheet.create({
  container:    { flex: 1 },
  header:       {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 8, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  arrow:        { width: 40, height: 36, justifyContent: "center", alignItems: "center" },
  monthTitle:   { fontFamily: "Outfit_600SemiBold", fontSize: 15, letterSpacing: -0.2 },
  weekPager:    { flexGrow: 0 },
  weekStrip:    {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 10, paddingVertical: 10, gap: 4,
  },
  dayChip:      {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 8, borderRadius: 10,
  },
  dayLabel:     { fontFamily: "Outfit_500Medium", fontSize: 10, letterSpacing: 0.2 },
  dayNum:       { fontFamily: "Outfit_700Bold", fontSize: 16, marginTop: 1 },
  divider:      { height: StyleSheet.hairlineWidth, marginHorizontal: 0 },
  listContent:  { padding: 16, paddingBottom: 40, flexGrow: 1 },

  // Loading
  loadingWrap:  { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },

  // Empty state
  emptyWrap:    { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 56, gap: 8 },
  emptyIcon:    { width: 60, height: 60, borderRadius: 30, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle:   { fontFamily: "Outfit_600SemiBold", fontSize: 16 },
  emptySubtitle:{ fontFamily: "Outfit_400Regular", fontSize: 13 },

  // Appointment card container
  leaveBanner:  { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 12, marginBottom: 4 },
  apptCard:     { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },

  // Appointment row
  apptRow:      {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 14, gap: 12,
  },
  timeCol:      { alignItems: "center", width: 42 },
  timeText:     { fontFamily: "Outfit_700Bold", fontSize: 13, letterSpacing: -0.2 },
  durText:      { fontFamily: "Outfit_400Regular", fontSize: 11, marginTop: 1 },
  statusBar:    { width: 3, height: 40, borderRadius: 2 },
  apptDetails:  { flex: 1, gap: 2 },
  clientName:   { fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  serviceName:  { fontFamily: "Outfit_400Regular", fontSize: 12 },
  badge:        { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  badgeText:    { fontFamily: "Outfit_600SemiBold", fontSize: 10 },
});
