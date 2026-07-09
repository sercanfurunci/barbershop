import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  useColorScheme, RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { formatCurrency } from "@/utils/format";
import { appointmentsService } from "@/services/appointments";
import type { Appointment } from "@/types/api";

const TR_MONTHS = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran",
  "Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

function toISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function BarberEarningsScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];

  const [offset, setOffset] = useState(0); // months back from today

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - offset, 1);
  const monthStart = toISO(target);
  const monthEnd = toISO(new Date(target.getFullYear(), target.getMonth() + 1, 0));

  // ponytail: fetching completed appts for the month — no dedicated earnings endpoint yet
  const { data: appts = [], isFetching, refetch } = useQuery({
    queryKey: ["barber-earnings", monthStart],
    queryFn: () => appointmentsService.list({ status: "COMPLETED", limit: 500 }),
    staleTime: 60_000,
  });

  const inMonth = appts.filter((a: Appointment) => a.date >= monthStart && a.date <= monthEnd);
  const total = inMonth.reduce((s, a) => s + (a.barberAmount ?? a.price), 0);
  const avgPerAppt = inMonth.length ? total / inMonth.length : 0;

  // Group by date descending
  const byDate = inMonth.reduce<Record<string, Appointment[]>>((acc, a) => {
    (acc[a.date] ??= []).push(a);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.foreground} />}
      >
        {/* Month navigator */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => setOffset((o) => o + 1)} hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={22} color={c.foreground} />
          </TouchableOpacity>
          <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 20 }}>
            {TR_MONTHS[target.getMonth()]} {target.getFullYear()}
          </Text>
          <TouchableOpacity
            onPress={() => setOffset((o) => Math.max(0, o - 1))}
            disabled={offset === 0}
            hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-forward" size={22} color={offset === 0 ? c.mutedForeground : c.foreground} />
          </TouchableOpacity>
        </View>

        {/* Summary cards */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Toplam Kazanç", value: formatCurrency(total) },
            { label: "Randevu",       value: String(inMonth.length) },
            { label: "Ortalama",      value: formatCurrency(avgPerAppt) },
          ].map(({ label, value }) => (
            <View key={label} style={{
              flex: 1, backgroundColor: c.card, borderRadius: 14,
              padding: 14, borderWidth: 1, borderColor: c.border, gap: 4,
            }}>
              <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 16 }}>{value}</Text>
              <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 11 }}>{label}</Text>
            </View>
          ))}
        </View>

        {inMonth.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40, gap: 8 }}>
            <Ionicons name="wallet-outline" size={40} color={c.mutedForeground} />
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.mutedForeground, fontSize: 14 }}>
              Bu ay tamamlanan randevu yok
            </Text>
          </View>
        )}

        {dates.map((date) => (
          <View key={date} style={{ gap: 8 }}>
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.mutedForeground, fontSize: 12 }}>
              {date}
            </Text>
            {byDate[date].map((a) => (
              <View key={a.id} style={{
                backgroundColor: c.card, borderRadius: 12, padding: 12,
                borderWidth: 1, borderColor: c.border,
                flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              }}>
                <View style={{ gap: 2 }}>
                  <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 14 }}>
                    {a.client.name}
                  </Text>
                  <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12 }}>
                    {a.time} · {a.service.nameTr}
                  </Text>
                </View>
                <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 15 }}>
                  {formatCurrency(a.barberAmount ?? a.price)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
