import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  useColorScheme, RefreshControl, Alert, TextInput, Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { formatCurrency } from "@/utils/format";
import { appointmentsService } from "@/services/appointments";
import { useAuthStore } from "@/store/auth";
import type { Appointment } from "@/types/api";

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#F59E0B", CONFIRMED: "#10B981", COMPLETED: "#6B7280",
  CANCELLED: "#B91C1C", NOSHOW: "#B91C1C",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Onay Bekliyor", CONFIRMED: "Onaylandı", COMPLETED: "Tamamlandı",
  CANCELLED: "İptal", NOSHOW: "Gelmedi",
};

function PriceModal({
  visible, onClose, onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (price: number) => void;
}) {
  const [val, setVal] = useState("");
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#00000066" }}>
        <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 24, width: 280, gap: 16 }}>
          <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 16 }}>
            Ücret Gir
          </Text>
          <TextInput
            value={val}
            onChangeText={setVal}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={c.mutedForeground}
            style={{
              borderWidth: 1, borderColor: c.border, borderRadius: 10,
              paddingHorizontal: 12, paddingVertical: 10,
              fontFamily: Typography.fontFamily.regular, color: c.foreground, fontSize: 15,
            }}
          />
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: c.border, alignItems: "center" }}
            >
              <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.mutedForeground }}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const n = parseFloat(val.replace(",", "."));
                if (isNaN(n) || n < 0) { Alert.alert("Geçersiz ücret"); return; }
                onConfirm(n);
              }}
              style={{ flex: 1, paddingVertical: 12, borderRadius: 10, backgroundColor: c.primary, alignItems: "center" }}
            >
              <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.primaryForeground }}>Onayla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ApptCard({ a, c, onAction }: {
  a: Appointment;
  c: typeof Colors.light;
  onAction: (id: string, action: "confirm" | "complete" | "noshow" | "cancel") => void;
}) {
  const color = STATUS_COLOR[a.status] ?? "#6B7280";
  const label = STATUS_LABEL[a.status] ?? a.status;
  const isActive = a.status === "PENDING" || a.status === "CONFIRMED";

  return (
    <View style={{
      backgroundColor: c.card, borderRadius: 14, padding: 14,
      borderWidth: 1, borderColor: c.border, gap: 10,
    }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 15 }}>
            {a.client.name}
          </Text>
          <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 13 }}>
            {a.service.nameTr}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 14 }}>
            {a.time}
          </Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: color + "1F" }}>
            <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color }}>{label}</Text>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12 }}>
          {a.client.phone} · {a.duration} dk · {formatCurrency(a.price)}
        </Text>
      </View>

      {isActive && (
        <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
          {a.status === "PENDING" && (
            <TouchableOpacity
              onPress={() => onAction(a.id, "confirm")}
              style={{ flex: 1, backgroundColor: "#10B981", borderRadius: 8, paddingVertical: 9, alignItems: "center" }}
            >
              <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: "#fff", fontSize: 12 }}>Onayla</Text>
            </TouchableOpacity>
          )}
          {a.status === "CONFIRMED" && (
            <TouchableOpacity
              onPress={() => onAction(a.id, "complete")}
              style={{ flex: 1, backgroundColor: c.primary, borderRadius: 8, paddingVertical: 9, alignItems: "center" }}
            >
              <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.primaryForeground, fontSize: 12 }}>Tamamlandı</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => onAction(a.id, "noshow")}
            style={{ paddingHorizontal: 12, borderRadius: 8, paddingVertical: 9, borderWidth: 1, borderColor: c.border, alignItems: "center" }}
          >
            <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.mutedForeground, fontSize: 12 }}>Gelmedi</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onAction(a.id, "cancel")}
            style={{ paddingHorizontal: 12, borderRadius: 8, paddingVertical: 9, borderWidth: 1, borderColor: "#B91C1C22", alignItems: "center" }}
          >
            <Text style={{ fontFamily: Typography.fontFamily.medium, color: "#B91C1C", fontSize: 12 }}>İptal</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function BarberTodayScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const today = todayISO();

  const [priceTarget, setPriceTarget] = useState<string | null>(null);

  const { data: appts = [], isFetching, refetch } = useQuery({
    queryKey: ["barber-today", today],
    queryFn: () => appointmentsService.list({ date: today }),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: ({ id, status, price }: { id: string; status: string; price?: number }) =>
      appointmentsService.updateStatus(id, status, price !== undefined ? { finalPrice: price } : undefined),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["barber-today", today] }),
    onError: () => Alert.alert("Hata", "İşlem gerçekleştirilemedi. Tekrar dene."),
  });

  function handleAction(id: string, action: "confirm" | "complete" | "noshow" | "cancel") {
    if (action === "complete") {
      setPriceTarget(id);
      return;
    }
    const statusMap = { confirm: "CONFIRMED", noshow: "NOSHOW", cancel: "CANCELLED" } as const;
    mutation.mutate({ id, status: statusMap[action] });
  }

  const active  = appts.filter((a) => a.status === "PENDING" || a.status === "CONFIRMED").sort((a, b) => a.time.localeCompare(b.time));
  const done    = appts.filter((a) => a.status === "COMPLETED" || a.status === "NOSHOW" || a.status === "CANCELLED");
  const revenue = done.filter((a) => a.status === "COMPLETED").reduce((s, a) => s + (a.barberAmount ?? a.price), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right"]}>
      <PriceModal
        visible={!!priceTarget}
        onClose={() => setPriceTarget(null)}
        onConfirm={(price) => {
          if (priceTarget) mutation.mutate({ id: priceTarget, status: "COMPLETED", price });
          setPriceTarget(null);
        }}
      />

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.foreground} />}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View>
            <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 24, letterSpacing: -0.5 }}>
              Bugün
            </Text>
            <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 13 }}>
              {user?.barber?.nameTr ?? user?.displayName}
            </Text>
          </View>
          <Ionicons name="today-outline" size={24} color={c.mutedForeground} />
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {[
            { label: "Toplam", value: String(appts.length) },
            { label: "Aktif",  value: String(active.length) },
            { label: "Kazanç", value: formatCurrency(revenue) },
          ].map(({ label, value }) => (
            <View key={label} style={{
              flex: 1, backgroundColor: c.card, borderRadius: 12,
              padding: 12, borderWidth: 1, borderColor: c.border, alignItems: "center", gap: 4,
            }}>
              <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 18 }}>{value}</Text>
              <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 11 }}>{label}</Text>
            </View>
          ))}
        </View>

        {active.length === 0 && done.length === 0 && (
          <View style={{ alignItems: "center", marginTop: 40, gap: 8 }}>
            <Ionicons name="calendar-clear-outline" size={40} color={c.mutedForeground} />
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 15 }}>
              Bugün randevu yok
            </Text>
          </View>
        )}

        {active.length > 0 && (
          <>
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.mutedForeground, fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>
              Bekleyen · {active.length}
            </Text>
            {active.map((a) => <ApptCard key={a.id} a={a} c={c} onAction={handleAction} />)}
          </>
        )}

        {done.length > 0 && (
          <>
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.mutedForeground, fontSize: 11, textTransform: "uppercase", letterSpacing: 1, marginTop: 4 }}>
              Tamamlanan · {done.length}
            </Text>
            {done.map((a) => <ApptCard key={a.id} a={a} c={c} onAction={handleAction} />)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
