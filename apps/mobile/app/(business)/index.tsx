import { View, Text, ScrollView, TouchableOpacity, useColorScheme, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { formatCurrency } from "@/utils/format";
import type { Appointment } from "@/types/api";

function StatCard({ label, value, scheme }: { label: string; value: string; scheme: "light" | "dark" }) {
  const c = Colors[scheme];
  return (
    <View style={{
      flex: 1,
      backgroundColor: c.card,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: c.border,
    }}>
      <Text style={{ fontSize: 22, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
        {value}
      </Text>
      <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 2 }}>
        {label}
      </Text>
    </View>
  );
}

export default function DashboardScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const today = new Date().toISOString().slice(0, 10);

  const { data: stats, isError: statsError, refetch: refetchStats, isFetching: statsFetching } = useQuery({
    queryKey: ["stats", user?.shop?.id],
    queryFn: async () => {
      const { data } = await api.get("/admin/stats");
      return data as {
        thisMonthRevenue: number;
        thisMonthAppointments: number;
        totalClients: number;
        avgRating: number;
      };
    },
    enabled: !!user?.shop?.id && (user.role === "ADMIN" || user.role === "SUPER_ADMIN"),
  });

  const { data: todayAppts, isError: apptsError, refetch: refetchAppts, isFetching: apptsFetching } = useQuery({
    queryKey: ["appointments", { date: today }],
    queryFn: async () => {
      const { data } = await api.get<Appointment[]>("/appointments", { params: { date: today } });
      return data;
    },
    staleTime: 30_000,
  });

  const refreshing = statsFetching || apptsFetching;
  const onRefresh = () => { refetchStats(); refetchAppts(); };

  const greeting = user?.displayName ? `Hoş geldin, ${user.displayName.split(" ")[0]}` : "Hoş geldin";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.foreground} />}
      >
        {/* Header */}
        <View>
          <Text style={{ fontSize: 24, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
            {greeting}
          </Text>
          {user?.shop?.name && (
            <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 2 }}>
              {user.shop.name}
            </Text>
          )}
        </View>

        {/* Stats */}
        {statsError && (
          <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border, alignItems: "center" }}>
            <Text style={{ color: c.destructive, fontFamily: Typography.fontFamily.regular, fontSize: 14 }}>İstatistikler yüklenemedi</Text>
            <TouchableOpacity onPress={() => refetchStats()} style={{ marginTop: 8 }}>
              <Text style={{ color: c.primary, fontFamily: Typography.fontFamily.medium, fontSize: 13 }}>Tekrar dene</Text>
            </TouchableOpacity>
          </View>
        )}
        {stats && (
          <View>
            <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: c.mutedForeground, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Bu Ay
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <StatCard label="Ciro" value={formatCurrency(stats.thisMonthRevenue)} scheme={scheme} />
              <StatCard label="Randevu" value={String(stats.thisMonthAppointments)} scheme={scheme} />
            </View>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
              <StatCard label="Müşteri" value={String(stats.totalClients)} scheme={scheme} />
              <StatCard label="Puan" value={`${stats.avgRating}/5`} scheme={scheme} />
            </View>
          </View>
        )}

        {/* Today */}
        <View>
          <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: c.mutedForeground, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>
            Bugünkü Randevular
          </Text>
          {apptsError ? (
            <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.destructive, fontFamily: Typography.fontFamily.regular }}>Randevular yüklenemedi</Text>
              <TouchableOpacity onPress={() => refetchAppts()} style={{ marginTop: 8 }}>
                <Text style={{ color: c.primary, fontFamily: Typography.fontFamily.medium, fontSize: 13 }}>Tekrar dene</Text>
              </TouchableOpacity>
            </View>
          ) : !todayAppts?.length ? (
            <View style={{ backgroundColor: c.card, borderRadius: 12, padding: 20, alignItems: "center", borderWidth: 1, borderColor: c.border }}>
              <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular }}>
                Bugün randevu yok
              </Text>
            </View>
          ) : (
            <View style={{ gap: 8 }}>
              {todayAppts.slice(0, 5).map((a) => (
                <View
                  key={a.id}
                  style={{
                    backgroundColor: c.card,
                    borderRadius: 12,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: c.border,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 15 }}>
                      {a.client.name}
                    </Text>
                    <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 13, marginTop: 2 }}>
                      {a.service.nameTr} · {a.barber.nameTr}
                    </Text>
                  </View>
                  <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 15 }}>
                    {a.time}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
