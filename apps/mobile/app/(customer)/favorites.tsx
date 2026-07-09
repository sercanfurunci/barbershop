import { useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  RefreshControl,
  Dimensions,
} from "react-native";
import { haptics } from "@/utils/haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { shopsService } from "@/services/shops";
import { queryKeys } from "@/utils/queryKeys";
import { useFavoritesStore } from "@/store/favorites";
import { PremiumShopCard } from "@/components/ui/ShopCard";
import { PremiumShopCardSkeleton } from "@/components/ui/SkeletonLoader";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FavoritesScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const { ids, isHydrated, hydrate, toggle } = useFavoritesStore();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  const { data: shops, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.shops.filtered({}),
    queryFn: () => shopsService.list(),
    staleTime: 60_000,
    enabled: isHydrated && ids.length > 0,
  });

  const favoriteShops = shops?.filter((s) => ids.includes(s.id)) ?? [];
  const cardWidth = SCREEN_WIDTH - 40;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right"]}>
      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontFamily: Typography.fontFamily.bold,
            color: c.foreground,
            letterSpacing: -0.5,
          }}
        >
          Favoriler
        </Text>
        {isHydrated && favoriteShops.length > 0 ? (
          <Text
            style={{
              fontSize: 14,
              fontFamily: Typography.fontFamily.medium,
              color: c.mutedForeground,
              marginBottom: 4,
            }}
          >
            {favoriteShops.length} salon
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && ids.length > 0}
            onRefresh={refetch}
            tintColor={c.foreground}
          />
        }
      >
        {!isHydrated || (ids.length > 0 && isLoading) ? (
          <View style={{ gap: 14 }}>
            {[0, 1].map((i) => (
              <PremiumShopCardSkeleton key={i} c={c} width={cardWidth} />
            ))}
          </View>
        ) : null}

        {isHydrated && ids.length === 0 ? (
          <View style={{ alignItems: "center", marginTop: 80, paddingHorizontal: 32, gap: 12 }}>
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: c.secondary,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Ionicons name="heart-outline" size={36} color={c.mutedForeground} />
            </View>
            <Text
              style={{
                fontSize: 17,
                fontFamily: Typography.fontFamily.semiBold,
                color: c.foreground,
                textAlign: "center",
              }}
            >
              Favori salon yok
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: Typography.fontFamily.regular,
                color: c.mutedForeground,
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              Salon detayından kalp ikonuna basarak{"\n"}favorilerine ekle
            </Text>
          </View>
        ) : null}

        {isHydrated && ids.length > 0 && isError ? (
          <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 32, gap: 8 }}>
            <Ionicons name="cloud-offline-outline" size={40} color={c.mutedForeground} />
            <Text
              style={{ fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}
            >
              Yüklenemedi
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: Typography.fontFamily.regular,
                color: c.mutedForeground,
                textAlign: "center",
              }}
            >
              Aşağı kaydırarak tekrar dene
            </Text>
          </View>
        ) : null}

        {favoriteShops.map((shop) => (
          <PremiumShopCard
            key={shop.id}
            shop={shop}
            c={c}
            onPress={() => {
              haptics.light();
              router.push({ pathname: "/salon/[slug]", params: { slug: shop.slug } });
            }}
            isFavorite
            onToggleFavorite={() => {
              haptics.warning();
              toggle(shop.id);
            }}
            width={cardWidth}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
