import { useState } from "react";
import { View, Text, TextInput, ScrollView, TouchableOpacity, useColorScheme, ActivityIndicator, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { formatCurrency } from "@/utils/format";
import { useDebounce } from "@/hooks/useDebounce";

interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  visits: number;
  totalSpent: number;
  lastVisit: string | null;
  noShows: number;
  blocked: boolean;
}

export default function CustomersScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["clients", debouncedSearch],
    queryFn: async () => {
      const { data } = await api.get<{ clients: Client[]; total: number }>("/admin/clients", {
        params: { search: debouncedSearch, limit: 100 },
      });
      return data;
    },
    staleTime: 30_000,
  });

  const clients = data?.clients ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 12 }}>
        <Text style={{ fontSize: 24, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
          Müşteriler {data?.total != null ? `(${data.total})` : ""}
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="İsim veya telefon ara..."
          placeholderTextColor={c.mutedForeground}
          autoCorrect={false}
          style={{
            backgroundColor: c.input, borderWidth: 1, borderColor: c.border,
            borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
            fontSize: 16, fontFamily: Typography.fontFamily.regular, color: c.foreground,
          }}
        />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 8 }}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={c.foreground} />}
      >
        {isLoading && <ActivityIndicator color={c.foreground} style={{ marginTop: 40 }} />}
        {isError && (
          <View style={{ alignItems: "center", marginTop: 40, gap: 10 }}>
            <Text style={{ color: c.destructive, fontFamily: Typography.fontFamily.regular }}>Müşteriler yüklenemedi</Text>
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={{ color: c.primary, fontFamily: Typography.fontFamily.medium }}>Tekrar dene</Text>
            </TouchableOpacity>
          </View>
        )}
        {!isLoading && !isError && !clients.length && (
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular, fontSize: 15 }}>
              {search ? `"${search}" için müşteri bulunamadı` : "Henüz müşteri yok"}
            </Text>
          </View>
        )}
        {clients.map((client) => (
          <View
            key={client.id}
            style={{ backgroundColor: c.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: c.border }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 16 }}>
                  {client.name}
                  {client.blocked && <Text style={{ color: c.destructive }}> · Engelli</Text>}
                </Text>
                <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 13, marginTop: 2 }}>
                  {client.phone}
                </Text>
              </View>
              <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 14 }}>
                {formatCurrency(client.totalSpent)}
              </Text>
            </View>
            <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
              <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12 }}>
                {client.visits} ziyaret
              </Text>
              {client.noShows > 0 && (
                <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.destructive, fontSize: 12 }}>
                  {client.noShows} gelmedi
                </Text>
              )}
              {client.lastVisit && (
                <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12 }}>
                  Son: {new Date(client.lastVisit).toLocaleDateString("tr-TR")}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
