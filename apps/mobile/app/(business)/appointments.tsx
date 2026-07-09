import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, useColorScheme, RefreshControl, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppointments } from "@/hooks/useAppointments";
import { appointmentsService } from "@/services/appointments";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { formatDate, formatCurrency } from "@/utils/format";
import { APPOINTMENT_STATUS_LABELS, APPOINTMENT_STATUS_COLORS } from "@/utils/constants";
import type { Appointment } from "@/types/api";

type QuickAction = { label: string; status: string; color?: string };

const QUICK_ACTIONS: Record<string, QuickAction[]> = {
  PENDING:   [{ label: "Onayla", status: "CONFIRMED" }, { label: "İptal", status: "CANCELLED", color: "#EF4444" }],
  CONFIRMED: [{ label: "Tamamlandı", status: "COMPLETED" }, { label: "Gelmedi", status: "NOSHOW", color: "#F59E0B" }, { label: "İptal", status: "CANCELLED", color: "#EF4444" }],
  COMPLETED: [],
  CANCELLED: [],
  NOSHOW:    [{ label: "Onayla", status: "CONFIRMED" }],
};

function ApptCard({
  a, c,
  onStatus,
}: {
  a: Appointment;
  c: typeof Colors.light;
  onStatus: (id: string, status: string, extra?: { finalPrice?: number }) => void;
}) {
  const color = APPOINTMENT_STATUS_COLORS[a.status] ?? "#6B7280";
  const actions = QUICK_ACTIONS[a.status] ?? [];

  const tap = (action: QuickAction) => {
    if (action.status === "COMPLETED") {
      Alert.alert(
        "Tamamlandı",
        `Ücret: ${formatCurrency(a.price)}\nBu fiyatla tamamlansın mı?`,
        [
          { text: "İptal", style: "cancel" },
          { text: "Onayla", onPress: () => onStatus(a.id, "COMPLETED", { finalPrice: a.price }) },
        ]
      );
      return;
    }
    if (action.status === "CANCELLED") {
      Alert.alert(
        "İptal Et",
        `"${a.client.name}" randevusu iptal edilsin mi?`,
        [
          { text: "Geri", style: "cancel" },
          { text: "İptal Et", style: "destructive", onPress: () => onStatus(a.id, "CANCELLED") },
        ]
      );
      return;
    }
    onStatus(a.id, action.status);
  };

  return (
    <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 16 }}>{a.client.name}</Text>
          <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 13, marginTop: 2 }}>
            {a.service.nameTr} · {a.barber.nameTr}
          </Text>
          <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 13, marginTop: 1 }}>
            {formatDate(a.date)} · {a.time}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 6 }}>
          <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>
            {formatCurrency(a.grossAmount ?? a.price)}
          </Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: color + "20" }}>
            <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.medium, color }}>
              {APPOINTMENT_STATUS_LABELS[a.status] ?? a.status}
            </Text>
          </View>
        </View>
      </View>

      {actions.length > 0 && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.status}
              onPress={() => tap(action)}
              style={{
                flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center",
                backgroundColor: (action.color ?? c.primary) + "15",
                borderWidth: 1, borderColor: action.color ?? c.primary,
              }}
            >
              <Text style={{ fontFamily: Typography.fontFamily.medium, fontSize: 13, color: action.color ?? c.primary }}>
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

export default function AppointmentsScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch, isFetching } = useAppointments(
    selectedDate ? { date: selectedDate } : undefined
  );

  const today = new Date().toISOString().slice(0, 10);
  const dates = [-1, 0, 1, 2, 3].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toISOString().slice(0, 10);
  });

  const { mutate: changeStatus } = useMutation({
    mutationFn: ({ id, status, extra }: { id: string; status: string; extra?: { finalPrice?: number } }) =>
      appointmentsService.updateStatus(id, status, extra),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["appointments"] }),
    onError: (e: unknown) => {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Bir hata oluştu";
      Alert.alert("Hata", msg);
    },
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
        <Text style={{ fontSize: 24, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>Randevular</Text>
      </View>

      {/* Date pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, paddingBottom: 12 }}>
        <TouchableOpacity
          onPress={() => setSelectedDate(undefined)}
          style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: !selectedDate ? c.primary : c.secondary }}
        >
          <Text style={{ fontFamily: Typography.fontFamily.medium, color: !selectedDate ? c.primaryForeground : c.secondaryForeground, fontSize: 13 }}>Tümü</Text>
        </TouchableOpacity>
        {dates.map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => setSelectedDate(d === selectedDate ? undefined : d)}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: d === selectedDate ? c.primary : c.secondary }}
          >
            <Text style={{ fontFamily: Typography.fontFamily.medium, color: d === selectedDate ? c.primaryForeground : c.secondaryForeground, fontSize: 13 }}>
              {d === today ? "Bugün" : new Date(d + "T12:00:00").toLocaleDateString("tr-TR", { weekday: "short", day: "numeric" })}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 10 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.foreground} />}
      >
        {isLoading && <ActivityIndicator color={c.foreground} style={{ marginTop: 40 }} />}
        {isError && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: c.destructive, fontFamily: Typography.fontFamily.regular, fontSize: 15 }}>Randevular yüklenemedi</Text>
            <TouchableOpacity onPress={() => refetch()} style={{ marginTop: 12 }}>
              <Text style={{ color: c.primary, fontFamily: Typography.fontFamily.medium, fontSize: 14 }}>Tekrar dene</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading && !isError && !data?.length && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular, fontSize: 15 }}>Randevu bulunamadı</Text>
          </View>
        )}
        {data?.map((a) => (
          <ApptCard
            key={a.id}
            a={a}
            c={c}
            onStatus={(id, status, extra) => changeStatus({ id, status, extra })}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
