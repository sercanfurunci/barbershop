import { useState, useMemo } from "react";
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
  useColorScheme, Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";

const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
const TR_DAYS_SHORT = ["Pt","Sa","Ça","Pe","Cu","Ct","Pz"]; // Mon→Sun

const { height: SCREEN_H } = Dimensions.get("window");

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

interface Props {
  visible: boolean;
  value?: string | null;   // YYYY-MM-DD
  minDate?: string;
  maxDate?: string;
  title?: string;
  onSelect: (iso: string) => void;
  onClose: () => void;
}

export function DatePickerSheet({ visible, value, minDate, maxDate, title, onSelect, onClose }: Props) {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];

  const today = new Date();
  const todayISO = toISO(today);

  const [viewMonth, setViewMonth] = useState(() => {
    if (value) return new Date(value + "T12:00:00");
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  // Grid of days for the view month, padded to start on Monday
  const cells = useMemo(() => {
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    const lastDay  = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0);
    // 0=Sun → shift to 0=Mon
    const startPad = (firstDay.getDay() + 6) % 7;
    const result: (Date | null)[] = [];
    for (let i = 0; i < startPad; i++) result.push(null);
    for (let d = 1; d <= lastDay.getDate(); d++) {
      result.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), d));
    }
    // pad to full weeks
    while (result.length % 7 !== 0) result.push(null);
    return result;
  }, [viewMonth]);

  function isDisabled(d: Date) {
    const iso = toISO(d);
    if (minDate && iso < minDate) return true;
    if (maxDate && iso > maxDate) return true;
    return false;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.card }]}>

        {/* Header */}
        <View style={[styles.sheetHeader, { borderBottomColor: c.border }]}>
          <Text style={[styles.sheetTitle, { color: c.foreground }]}>{title ?? "Tarih Seç"}</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={22} color={c.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => setViewMonth((m) => addMonths(m, -1))} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
            <Ionicons name="chevron-back" size={20} color={c.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: c.foreground }]}>
            {TR_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
          </Text>
          <TouchableOpacity onPress={() => setViewMonth((m) => addMonths(m, 1))} hitSlop={{ top: 8, bottom: 8, left: 16, right: 16 }}>
            <Ionicons name="chevron-forward" size={20} color={c.foreground} />
          </TouchableOpacity>
        </View>

        {/* Day-of-week labels */}
        <View style={styles.weekRow}>
          {TR_DAYS_SHORT.map((d) => (
            <Text key={d} style={[styles.weekDayLabel, { color: c.mutedForeground }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={styles.grid}>
          {cells.map((d, i) => {
            if (!d) return <View key={`pad-${i}`} style={styles.cell} />;
            const iso = toISO(d);
            const isSelected = iso === value;
            const isToday    = iso === todayISO;
            const disabled   = isDisabled(d);
            return (
              <TouchableOpacity
                key={iso}
                style={[
                  styles.cell,
                  isSelected && { backgroundColor: c.primary, borderRadius: 999 },
                  !isSelected && isToday && { backgroundColor: c.primary + "20", borderRadius: 999 },
                ]}
                onPress={() => { if (!disabled) { onSelect(iso); onClose(); } }}
                activeOpacity={disabled ? 1 : 0.7}
              >
                <Text style={[
                  styles.cellText,
                  { color: isSelected ? c.primaryForeground : disabled ? c.mutedForeground + "66" : c.foreground },
                  isToday && !isSelected && { color: c.primary, fontFamily: "Outfit_700Bold" },
                ]}>
                  {d.getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop:    { flex: 1 },
  sheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingBottom: 32,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  sheetHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  sheetTitle:  { fontFamily: "Outfit_600SemiBold", fontSize: 16 },
  monthNav: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 14,
  },
  monthLabel:  { fontFamily: "Outfit_600SemiBold", fontSize: 15 },
  weekRow:     { flexDirection: "row", paddingHorizontal: 12, marginBottom: 4 },
  weekDayLabel: { flex: 1, textAlign: "center", fontFamily: "Outfit_500Medium", fontSize: 11 },
  grid:        { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12 },
  cell:        { width: `${100 / 7}%`, aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  cellText:    { fontFamily: "Outfit_500Medium", fontSize: 14 },
});
