import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, RefreshControl, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { appointmentsService } from "@/services/appointments";
import { APPOINTMENT_STATUS_COLORS, APPOINTMENT_STATUS_LABELS } from "@/utils/constants";
import type { Appointment } from "@/types/api";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(base: Date, n: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

function groupByDate(appointments: Appointment[]): Record<string, Appointment[]> {
  const map: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    if (!map[a.date]) map[a.date] = [];
    map[a.date].push(a);
  }
  return map;
}

export default function CalendarScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const today = new Date();

  // Show current week: today-1 to today+6
  const dates = Array.from({ length: 7 }, (_, i) => addDays(today, i - 1));
  const [selectedDate, setSelectedDate] = useState(isoDate(today));

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["appointments", { date: selectedDate }],
    queryFn: () => appointmentsService.list({ date: selectedDate }),
    staleTime: 30_000,
  });

  const appointments = data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>Takvim</Text>
      </View>

      {/* Day selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12, paddingTop: 4 }}
      >
        {dates.map((d) => {
          const iso = isoDate(d);
          const isSelected = iso === selectedDate;
          const isToday = iso === isoDate(today);
          return (
            <TouchableOpacity
              key={iso}
              onPress={() => setSelectedDate(iso)}
              style={{
                alignItems: "center", paddingHorizontal: 14, paddingVertical: 10,
                borderRadius: 12, minWidth: 52,
                backgroundColor: isSelected ? c.primary : c.secondary,
                borderWidth: isToday && !isSelected ? 1 : 0,
                borderColor: c.primary,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: isSelected ? c.primaryForeground : c.mutedForeground }}>
                {d.toLocaleDateString("tr-TR", { weekday: "short" }).toUpperCase()}
              </Text>
              <Text style={{ fontSize: 18, fontFamily: Typography.fontFamily.bold, color: isSelected ? c.primaryForeground : c.foreground, marginTop: 2 }}>
                {d.getDate()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Appointment list */}
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.foreground} />}
      >
        {isLoading && <ActivityIndicator color={c.foreground} style={{ marginTop: 40 }} />}
        {isError && (
          <View style={{ alignItems: "center", marginTop: 40, gap: 10 }}>
            <Text style={{ color: c.destructive, fontFamily: Typography.fontFamily.regular }}>Yüklenemedi</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={{ color: c.primary, fontFamily: Typography.fontFamily.medium }}>Tekrar dene</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading && !isError && !appointments.length && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular, fontSize: 15 }}>
              Bu günde randevu yok
            </Text>
          </View>
        )}
        {appointments
          .slice()
          .sort((a, b) => a.time.localeCompare(b.time))
          .map((appt) => (
            <View
              key={appt.id}
              style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, flexDirection: "row", gap: 12 }}
            >
              {/* Time column */}
              <View style={{ alignItems: "center", width: 44 }}>
                <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 15 }}>{appt.time}</Text>
                <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 11, marginTop: 2 }}>
                  {appt.duration}dk
                </Text>
              </View>
              {/* Divider */}
              <View style={{ width: 2, borderRadius: 2, backgroundColor: APPOINTMENT_STATUS_COLORS[appt.status] + "60" }} />
              {/* Info */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 15 }}>{appt.client.name}</Text>
                <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 13, marginTop: 1 }}>
                  {appt.service.nameTr} · {appt.barber.nameTr}
                </Text>
              </View>
              {/* Status badge */}
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: APPOINTMENT_STATUS_COLORS[appt.status] + "20", alignSelf: "flex-start" }}>
                <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.medium, color: APPOINTMENT_STATUS_COLORS[appt.status] }}>
                  {APPOINTMENT_STATUS_LABELS[appt.status] ?? appt.status}
                </Text>
              </View>
            </View>
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}
