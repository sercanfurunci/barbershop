import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Dimensions,
  StyleSheet,
  Modal,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useFocusEffect } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { shopsService } from "@/services/shops";
import { queryKeys } from "@/utils/queryKeys";
import { useFavoritesStore } from "@/store/favorites";
import { CompactShopCard, PremiumShopCard } from "@/components/ui/ShopCard";
import { PremiumShopCardSkeleton, ShopCardSkeleton } from "@/components/ui/SkeletonLoader";
import { shopCoverUri } from "@/utils/shopImage";
import { recentlyViewed, type RecentShop } from "@/utils/recentlyViewed";
import { haptics } from "@/utils/haptics";
import type { PublicShop } from "@/types/api";

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371, dLat = ((lat2 - lat1) * Math.PI) / 180, dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function featuredScore(shop: PublicShop, favIds: string[]): number {
  const rating = shop.avgRating ?? 0;
  const reviews = shop.totalReviews ?? 0;
  const hasCover = shopCoverUri(shop) != null ? 1.5 : 0;
  const isFav = favIds.includes(shop.id) ? 0.5 : 0;
  return rating * 2 + Math.log1p(reviews) * 1.5 + hasCover + isFav;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const FEATURED_CARD_WIDTH = SCREEN_WIDTH * 0.72;

export default function CustomerHome() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const { ids, isHydrated, hydrate, toggle } = useFavoritesStore();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [showLocModal, setShowLocModal] = useState(false);
  const locRequested = useRef(false);

  function requestGeolocation() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }

  useEffect(() => {
    if (locRequested.current) return;
    locRequested.current = true;
    AsyncStorage.getItem("loc_asked")
      .then((val) => {
        if (val === "1") {
          // Already asked — try silently
          requestGeolocation();
        } else {
          // First launch — show explanation modal
          setShowLocModal(true);
        }
      })
      .catch(() => {
        requestGeolocation();
      });
  }, []);

  const [recent, setRecent] = useState<RecentShop[]>([]);

  useEffect(() => {
    recentlyViewed.getRecent().then(setRecent);
  }, []);

  useFocusEffect(
    useCallback(() => {
      recentlyViewed.getRecent().then(setRecent);
    }, [])
  );

  const { data: shops, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: queryKeys.shops.filtered({}),
    queryFn: () => shopsService.list(),
    staleTime: 60_000,
    retry: 1,
  });

  const featured = useMemo(
    () => [...(shops ?? [])].sort((a, b) => featuredScore(b, ids) - featuredScore(a, ids)).slice(0, 5),
    [shops, ids]
  );
  const allSorted = useMemo(
    () =>
      [...(shops ?? [])].sort((a, b) => {
        const rDiff = (b.avgRating ?? 0) - (a.avgRating ?? 0);
        if (rDiff !== 0) return rDiff;
        const revDiff = (b.totalReviews ?? 0) - (a.totalReviews ?? 0);
        if (revDiff !== 0) return revDiff;
        return a.name.localeCompare(b.name, "tr");
      }),
    [shops]
  );
  const topRated = useMemo(
    () => allSorted.filter((s) => (s.avgRating ?? 0) > 0).slice(0, 8),
    [allSorted]
  );

  const nearby = useMemo(() => {
    if (!userLoc || !shops?.length) return [];
    return [...shops]
      .filter((s) => s.latitude != null && s.longitude != null)
      .sort((a, b) => haversineKm(userLoc.lat, userLoc.lng, a.latitude!, a.longitude!) - haversineKm(userLoc.lat, userLoc.lng, b.latitude!, b.longitude!))
      .slice(0, 8);
  }, [shops, userLoc]);

  const goDetail = (shop: PublicShop) =>
    router.push({ pathname: "/salon/[slug]", params: { slug: shop.slug } });

  const errorMsg = isError
    ? error instanceof Error
      ? error.message
      : "Sunucu bağlantısı kurulamadı"
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["top", "left", "right"]}>
      {/* Location permission explanation modal */}
      <Modal
        visible={showLocModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLocModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <Text style={{ fontSize: 40, textAlign: "center", marginBottom: 12 }}>📍</Text>
            <Text style={[styles.modalTitle, { color: c.foreground }]}>
              Konumuna ihtiyacımız var
            </Text>
            <Text style={[styles.modalBody, { color: c.mutedForeground }]}>
              Yakınımdaki salonları görmek için konumuna ihtiyacımız var. Konum bilgin yalnızca salon önerileri için kullanılır.
            </Text>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 20 }}>
              <TouchableOpacity
                onPress={async () => {
                  await AsyncStorage.setItem("loc_asked", "1");
                  setShowLocModal(false);
                  requestGeolocation();
                }}
                style={[styles.modalBtn, { backgroundColor: c.primary, flex: 2 }]}
              >
                <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 15 }}>
                  İzin Ver
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  await AsyncStorage.setItem("loc_asked", "1");
                  setShowLocModal(false);
                }}
                style={[styles.modalBtn, { backgroundColor: c.secondary, borderColor: c.border, borderWidth: 1, flex: 1 }]}
              >
                <Text style={{ color: c.foreground, fontFamily: Typography.fontFamily.medium, fontSize: 15 }}>
                  Şimdi Değil
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} tintColor={c.foreground} />
        }
      >
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 }}>
          <Text
            style={{
              fontSize: 28,
              fontFamily: Typography.fontFamily.bold,
              color: c.foreground,
              letterSpacing: -0.5,
            }}
          >
            Merhaba 👋
          </Text>
          <Text
            style={{
              fontSize: 15,
              fontFamily: Typography.fontFamily.regular,
              color: c.mutedForeground,
              marginTop: 4,
            }}
          >
            Bugün hangi salona gidiyorsun?
          </Text>

          <TouchableOpacity
            onPress={() => router.push("/(customer)/search")}
            activeOpacity={0.85}
            style={[
              styles.searchBar,
              { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" },
            ]}
          >
            <Ionicons name="search-outline" size={20} color={c.mutedForeground} />
            <Text
              style={{
                flex: 1,
                fontSize: 15,
                fontFamily: Typography.fontFamily.regular,
                color: c.mutedForeground,
              }}
            >
              Salon, şehir veya ilçe ara
            </Text>
          </TouchableOpacity>
        </View>

        {recent.length > 0 ? (
          <>
            <SectionHeader
              c={c}
              title="Son Görüntülenenler"
              action={
                <TouchableOpacity
                  onPress={async () => {
                    await recentlyViewed.clearRecent();
                    setRecent([]);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: c.mutedForeground,
                    }}
                  >
                    Temizle
                  </Text>
                </TouchableOpacity>
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 10 }}
            >
              {recent.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  onPress={() => {
                    haptics.light();
                    router.push({ pathname: "/salon/[slug]", params: { slug: shop.slug } });
                  }}
                  activeOpacity={0.85}
                  style={[
                    styles.recentCard,
                    { backgroundColor: c.card, borderColor: c.border },
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={{
                      fontSize: 13,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: c.foreground,
                    }}
                  >
                    {shop.name}
                  </Text>
                  {shop.city ? (
                    <Text
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        fontFamily: Typography.fontFamily.regular,
                        color: c.mutedForeground,
                        marginTop: 2,
                      }}
                    >
                      {shop.city}
                    </Text>
                  ) : null}
                  {shop.avgRating != null && shop.avgRating > 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 }}>
                      <Ionicons name="star" size={11} color="#F59E0B" />
                      <Text
                        style={{
                          fontSize: 11,
                          fontFamily: Typography.fontFamily.medium,
                          color: c.foreground,
                        }}
                      >
                        {shop.avgRating.toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        ) : null}

        {isError ? (
          <View style={{ alignItems: "center", marginTop: 40, paddingHorizontal: 32, gap: 12 }}>
            <Ionicons name="cloud-offline-outline" size={40} color={c.mutedForeground} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: Typography.fontFamily.semiBold,
                color: c.foreground,
                textAlign: "center",
              }}
            >
              Salonlar yüklenemedi
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: Typography.fontFamily.regular,
                color: c.mutedForeground,
                textAlign: "center",
              }}
            >
              {errorMsg}
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{
                backgroundColor: c.primary,
                borderRadius: 10,
                paddingHorizontal: 24,
                paddingVertical: 10,
                marginTop: 4,
              }}
            >
              <Text
                style={{
                  color: c.primaryForeground,
                  fontFamily: Typography.fontFamily.semiBold,
                  fontSize: 14,
                }}
              >
                Tekrar dene
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isLoading ? (
          <>
            <SectionHeader c={c} title="Öne Çıkan Salonlar" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            >
              {[0, 1, 2].map((i) => (
                <PremiumShopCardSkeleton key={i} c={c} width={FEATURED_CARD_WIDTH} />
              ))}
            </ScrollView>
            <SectionHeader c={c} title="Tüm Salonlar" />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {[0, 1, 2].map((i) => (
                <ShopCardSkeleton key={i} c={c} />
              ))}
            </View>
          </>
        ) : null}

        {!isLoading && !isError && !shops?.length ? (
          <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 32, gap: 8 }}>
            <Ionicons name="storefront-outline" size={40} color={c.mutedForeground} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: Typography.fontFamily.semiBold,
                color: c.foreground,
                textAlign: "center",
              }}
            >
              Henüz salon yok
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: Typography.fontFamily.regular,
                color: c.mutedForeground,
                textAlign: "center",
              }}
            >
              Yakında burada salonlar görünecek
            </Text>
          </View>
        ) : null}

        {!isLoading && !isError && featured.length > 0 ? (
          <>
            <SectionHeader c={c} title="Öne Çıkan Salonlar" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}
              decelerationRate="fast"
              snapToInterval={FEATURED_CARD_WIDTH + 12}
              snapToAlignment="start"
            >
              {featured.map((shop) => (
                <PremiumShopCard
                  key={shop.id}
                  shop={shop}
                  c={c}
                  onPress={() => goDetail(shop)}
                  isFavorite={ids.includes(shop.id)}
                  onToggleFavorite={() => toggle(shop.id)}
                  width={FEATURED_CARD_WIDTH}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {!isLoading && !isError && nearby.length > 0 ? (
          <>
            <SectionHeader c={c} title="Yakınımdaki Salonlar" />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}
              decelerationRate="fast"
              snapToInterval={FEATURED_CARD_WIDTH + 12}
              snapToAlignment="start"
            >
              {nearby.map((shop) => (
                <PremiumShopCard
                  key={shop.id}
                  shop={shop}
                  c={c}
                  onPress={() => goDetail(shop)}
                  isFavorite={ids.includes(shop.id)}
                  onToggleFavorite={() => toggle(shop.id)}
                  width={FEATURED_CARD_WIDTH}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        {!isLoading && !isError && topRated.length > 0 ? (
          <>
            <SectionHeader c={c} title="En Çok Değerlendirilen" />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {topRated.map((shop) => (
                <CompactShopCard
                  key={shop.id}
                  shop={shop}
                  c={c}
                  onPress={() => goDetail(shop)}
                  isFavorite={ids.includes(shop.id)}
                  onToggleFavorite={() => toggle(shop.id)}
                />
              ))}
            </View>
          </>
        ) : null}

        {!isLoading && !isError && allSorted.length > 0 ? (
          <>
            <SectionHeader c={c} title="Tüm Salonlar" />
            <View style={{ paddingHorizontal: 20, gap: 10 }}>
              {allSorted.map((shop) => (
                <CompactShopCard
                  key={shop.id}
                  shop={shop}
                  c={c}
                  onPress={() => goDetail(shop)}
                  isFavorite={ids.includes(shop.id)}
                  onToggleFavorite={() => toggle(shop.id)}
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ c, title, action }: { c: typeof Colors.light; title: string; action?: React.ReactNode }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginTop: 20,
        marginBottom: 12,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: Typography.fontFamily.semiBold,
          color: c.mutedForeground,
          textTransform: "uppercase",
          letterSpacing: 1,
        }}
      >
        {title}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    marginTop: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  recentCard: {
    width: 130,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    width: "100%",
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 8,
    fontFamily: Typography.fontFamily.bold,
  },
  modalBody: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    fontFamily: Typography.fontFamily.regular,
  },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
