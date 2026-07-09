import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { shopsService } from "@/services/shops";
import { queryKeys } from "@/utils/queryKeys";
import { useFavoritesStore } from "@/store/favorites";
import { useDebounce } from "@/hooks/useDebounce";
import { haptics } from "@/utils/haptics";
import { CompactShopCard } from "@/components/ui/ShopCard";
import { ShopCardSkeleton } from "@/components/ui/SkeletonLoader";
import type { PublicShop } from "@/types/api";

const CITIES = ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya"];

export default function SearchScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 400);
  const { ids, isHydrated, hydrate, toggle } = useFavoritesStore();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  const searching = debouncedQuery.length >= 2 || selectedCity !== null;

  const { data: searchResults, isLoading: isSearchLoading, isError: isSearchError, error: searchError } = useQuery({
    queryKey: queryKeys.shops.filtered({ search: debouncedQuery, city: selectedCity }),
    queryFn: () => shopsService.list({ search: debouncedQuery, city: selectedCity ?? undefined }),
    enabled: searching,
    staleTime: 60_000,
    retry: 1,
  });

  const { data: allShops, isLoading: isBrowseLoading } = useQuery({
    queryKey: queryKeys.shops.filtered({}),
    queryFn: () => shopsService.list(),
    enabled: !searching,
    staleTime: 60_000,
    retry: 1,
  });

  const shops: PublicShop[] | undefined = searching ? searchResults : allShops;
  const isLoading = searching ? isSearchLoading : isBrowseLoading;

  const goDetail = (shop: PublicShop) =>
    router.push({ pathname: "/salon/[slug]", params: { slug: shop.slug } });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right"]}>
      <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 }}>
        <Text
          style={{
            fontSize: 28,
            fontFamily: Typography.fontFamily.bold,
            color: c.foreground,
            letterSpacing: -0.5,
            marginBottom: 14,
          }}
        >
          Ara
        </Text>

        <View
          style={[
            styles.searchBar,
            { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" },
          ]}
        >
          <Ionicons name="search-outline" size={20} color={c.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Salon, şehir veya ilçe"
            placeholderTextColor={c.mutedForeground}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: Typography.fontFamily.regular,
              color: c.foreground,
              paddingVertical: 0,
            }}
          />
          {query.length > 0 ? (
            <TouchableOpacity
              onPress={() => setQuery("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: c.secondary,
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <Ionicons name="close" size={14} color={c.mutedForeground} />
              </View>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* City filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, gap: 8 }}
        style={{ flexGrow: 0 }}
        keyboardShouldPersistTaps="handled"
      >
        {CITIES.map((city) => {
          const active = selectedCity === city;
          return (
            <TouchableOpacity
              key={city}
              onPress={() => {
                haptics.select();
                setSelectedCity(active ? null : city);
              }}
              activeOpacity={0.75}
              style={[
                styles.cityChip,
                {
                  backgroundColor: active ? c.primary : c.card,
                  borderColor: active ? c.primary : c.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.cityChipText,
                  { color: active ? c.primaryForeground : c.foreground },
                ]}
              >
                {city}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 10 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {query.length === 1 ? (
          <View style={styles.centerHint}>
            <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
              En az 2 karakter gir
            </Text>
          </View>
        ) : null}

        {isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2, 3].map((i) => (
              <ShopCardSkeleton key={i} c={c} />
            ))}
          </View>
        ) : null}

        {searching && isSearchError ? (
          <View style={styles.emptyBlock}>
            <Ionicons name="alert-circle-outline" size={36} color={c.mutedForeground} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: Typography.fontFamily.semiBold,
                color: c.foreground,
                marginTop: 8,
              }}
            >
              Arama başarısız
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: Typography.fontFamily.regular,
                color: c.mutedForeground,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              {searchError instanceof Error ? searchError.message : "Bağlantını kontrol et"}
            </Text>
          </View>
        ) : null}

        {!isLoading && searching && !isSearchError && shops?.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ionicons name="search-outline" size={36} color={c.mutedForeground} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: Typography.fontFamily.semiBold,
                color: c.foreground,
                marginTop: 8,
              }}
            >
              Sonuç bulunamadı
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: Typography.fontFamily.regular,
                color: c.mutedForeground,
                marginTop: 4,
                textAlign: "center",
              }}
            >
              "{query}" için salon bulunamadı
            </Text>
          </View>
        ) : null}

        {!isLoading && !searching && shops && shops.length > 0 ? (
          <Text
            style={{
              fontSize: 11,
              fontFamily: Typography.fontFamily.semiBold,
              color: c.mutedForeground,
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 4,
            }}
          >
            Tüm Salonlar
          </Text>
        ) : null}

        {!isLoading &&
          shops?.map((shop) => (
            <CompactShopCard
              key={shop.id}
              shop={shop}
              c={c}
              onPress={() => goDetail(shop)}
              isFavorite={ids.includes(shop.id)}
              onToggleFavorite={() => toggle(shop.id)}
            />
          ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  centerHint: {
    alignItems: "center",
    marginTop: 40,
  },
  emptyBlock: {
    alignItems: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  cityChip: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  cityChipText: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
  },
});
