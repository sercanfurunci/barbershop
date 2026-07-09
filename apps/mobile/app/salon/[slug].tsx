import { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Linking,
  Modal,
  Dimensions,
  Platform,
  useColorScheme,
  StyleSheet,
  Share,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { shopsService } from "@/services/shops";
import { queryKeys } from "@/utils/queryKeys";
import { formatCurrency } from "@/utils/format";
import { shopCoverUri, shopHeroMode } from "@/utils/shopImage";
import { useFavoritesStore } from "@/store/favorites";
import { GalleryViewer } from "@/components/ui/GalleryViewer";
import { haptics } from "@/utils/haptics";
import { recentlyViewed } from "@/utils/recentlyViewed";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const HERO_HEIGHT = 280;
const GALLERY_COLS = 3;
const GALLERY_GAP = 3;
const GALLERY_CELL = (SCREEN_WIDTH - 40 - GALLERY_GAP * (GALLERY_COLS - 1)) / GALLERY_COLS;
const MAX_GALLERY_VISIBLE = 6;

const TR_MONTHS_LONG = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

function fmtReviewDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

function Section({
  title,
  c,
  action,
  children,
}: {
  title: string;
  c: typeof Colors.light;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: Typography.fontFamily.bold,
            color: c.foreground,
            letterSpacing: 0.2,
          }}
        >
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

export default function SalonDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: shop, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.shops.bySlug(slug),
    queryFn: () => shopsService.bySlug(slug),
    staleTime: 60_000,
  });

  const { data: reviewData } = useQuery({
    queryKey: queryKeys.shops.reviews(slug),
    queryFn: () => shopsService.reviews(slug),
    staleTime: 120_000,
    enabled: !!shop,
  });

  const { ids, isHydrated, hydrate, toggle } = useFavoritesStore();
  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);
  const isFavorite = shop ? ids.includes(shop.id) : false;

  useEffect(() => {
    if (!shop?.id) return;
    recentlyViewed.recordView({
      id: shop.id,
      slug: shop.slug,
      name: shop.name,
      logo: shop.logo ?? null,
      coverImage: shop.coverImage ?? null,
      city: shop.city ?? null,
      avgRating: shop.avgRating ?? null,
    });
  }, [shop?.id]);

  const [galleryVisible, setGalleryVisible] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<Record<number, boolean>>({});

  const toggleFaq = useCallback((i: number) => {
    setExpandedFaq((prev) => ({ ...prev, [i]: !prev[i] }));
  }, []);

  const gallery = useMemo(() => shop?.gallery ?? [], [shop]);
  const reviews = reviewData ?? [];
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 5);

  // Hero: respects mobileSettings.coverStyle
  const heroUri   = shop ? shopCoverUri(shop) : null;
  const heroMode  = shop ? shopHeroMode(shop) : "auto";
  const ms        = shop?.mobileSettings;
  const sv        = ms?.sectionVisibility;
  const bd        = ms?.barberDisplay;
  const sdDisplay = ms?.serviceDisplay;

  const call = () => shop?.phone && Linking.openURL(`tel:${shop.phone}`);
  const whatsapp = () =>
    shop?.whatsappNumber &&
    Linking.openURL(`https://wa.me/${shop.whatsappNumber.replace(/\D/g, "")}`);
  const openMaps = () => {
    if (!shop?.address) return;
    const q = encodeURIComponent(`${shop.name} ${shop.address}`);
    Linking.openURL(`https://maps.apple.com/?q=${q}`);
  };
  const openInstagram = () =>
    shop?.instagramUrl && Linking.openURL(shop.instagramUrl);

  const openFacebook = () =>
    shop?.facebookUrl && Linking.openURL(shop.facebookUrl);

  const openTiktok = () =>
    shop?.tiktokUrl && Linking.openURL(shop.tiktokUrl);

  const openWebsite = () =>
    shop?.website && Linking.openURL(shop.website);

  const openDirections = () => {
    if (!shop) return;
    if (shop.latitude && shop.longitude) {
      const coord = `${shop.latitude},${shop.longitude}`;
      if (Platform.OS === "ios") {
        Linking.openURL(`maps://?q=${encodeURIComponent(shop.name)}&ll=${coord}`);
      } else {
        Linking.openURL(`geo:${coord}?q=${coord}(${encodeURIComponent(shop.name)})`);
      }
    } else if (shop.address) {
      const q = encodeURIComponent(`${shop.name} ${shop.address}`);
      if (Platform.OS === "ios") {
        Linking.openURL(`maps://?q=${q}`);
      } else {
        Linking.openURL(`https://maps.google.com/?q=${q}`);
      }
    }
  };

  const openGallery = (i: number) => {
    haptics.light();
    setGalleryIndex(i);
    setGalleryVisible(true);
  };



  const goBook = (serviceId?: string) => {
    if (!shop) return;
    router.push({
      pathname: "/salon/book",
      params: serviceId ? { shopSlug: shop.slug, serviceId } : { shopSlug: shop.slug },
    });
  };

  const goBackSafe = () => {
    if (router.canGoBack()) router.back();
    else router.replace("/(customer)");
  };

  const initial = shop?.name?.charAt(0).toUpperCase() ?? "";

  // Gallery grid: show max 6, last cell shows +X overlay
  const visibleGallery = gallery.slice(0, MAX_GALLERY_VISIBLE);
  const hiddenCount = gallery.length - MAX_GALLERY_VISIBLE;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {isLoading ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular }}>
            Yükleniyor...
          </Text>
        </SafeAreaView>
      ) : null}

      {isError && !isLoading ? (
        <SafeAreaView style={{ flex: 1, backgroundColor: c.background }}>
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 16, padding: 32 }}>
            <Ionicons name="cloud-offline-outline" size={48} color={c.mutedForeground} />
            <Text style={{ color: c.foreground, fontFamily: Typography.fontFamily.semiBold, fontSize: 17, textAlign: "center" }}>
              Salon yüklenemedi
            </Text>
            <TouchableOpacity
              onPress={() => refetch()}
              style={{ backgroundColor: c.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 }}
            >
              <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 15 }}>
                Tekrar dene
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goBackSafe}>
              <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular, fontSize: 14 }}>
                Geri dön
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      ) : null}

      {shop && !isError ? (
        <View style={{ flex: 1, backgroundColor: c.background }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

            {/* ── Hero ── */}
            {heroMode !== "no_hero" && <View style={[styles.hero, { height: HERO_HEIGHT }]}>
              {heroUri ? (
                <Image
                  source={{ uri: heroUri }}
                  style={{ width: "100%", height: HERO_HEIGHT }}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.heroPlaceholder, { backgroundColor: c.secondary }]}>
                  {shop.logo ? (
                    <Image source={{ uri: shop.logo }} style={{ width: 100, height: 100, borderRadius: 16 }} resizeMode="contain" />
                  ) : (
                    <Text style={{ fontSize: 80, fontFamily: Typography.fontFamily.bold, color: c.mutedForeground }}>
                      {initial}
                    </Text>
                  )}
                </View>
              )}
              <View style={styles.heroGradient} pointerEvents="none" />

              {/* Floating nav buttons */}
              <View style={[styles.heroNav, { top: insets.top + 10 }]}>
                <TouchableOpacity onPress={goBackSafe} activeOpacity={0.85} style={styles.heroBtn}>
                  <Ionicons name="chevron-back" size={22} color="#111" />
                </TouchableOpacity>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => {
                      haptics.light();
                      Share.share({ message: `${shop.name} — Makas'ta keşfet: https://makas.app/salon/${shop.slug}` });
                    }}
                    activeOpacity={0.85}
                    style={styles.heroBtn}
                  >
                    <Ionicons name="share-outline" size={20} color="#111" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { haptics.light(); toggle(shop.id); }} activeOpacity={0.85} style={styles.heroBtn}>
                    <Ionicons
                      name={isFavorite ? "heart" : "heart-outline"}
                      size={22}
                      color={isFavorite ? "#B91C1C" : "#111"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>}

            {/* ── Info card overlapping hero ── */}
            <View style={[styles.infoCard, { backgroundColor: c.background }]}>

              {/* Logo + name row */}
              <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 14 }}>
                {shop.logo ? (
                  <Image
                    source={{ uri: shop.logo }}
                    style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: c.secondary }}
                    resizeMode="contain"
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 22, fontFamily: Typography.fontFamily.bold, color: c.foreground, letterSpacing: -0.5 }}>
                    {shop.name}
                  </Text>
                  {shop.city ? (
                    <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 2 }}>
                      {shop.city}
                    </Text>
                  ) : null}
                </View>
              </View>

              {/* Rating + open badge */}
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                {(sv?.showInternalRating !== false) && shop.avgRating != null && shop.avgRating > 0 ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <Ionicons name="star" size={15} color="#F59E0B" />
                    <Text style={{ fontSize: 15, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                      {shop.avgRating.toFixed(1)}
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                      ({shop.totalReviews ?? 0} değerlendirme)
                    </Text>
                  </View>
                ) : null}
                <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#10B98118" }}>
                  <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: "#10B981" }}>
                    Açık
                  </Text>
                </View>
              </View>

              {/* Address */}
              {shop.address ? (
                <TouchableOpacity onPress={openMaps} activeOpacity={0.7} style={{ flexDirection: "row", alignItems: "flex-start", gap: 7, marginTop: 10 }}>
                  <Ionicons name="location-outline" size={15} color={c.mutedForeground} style={{ marginTop: 2 }} />
                  <Text style={{ flex: 1, fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, lineHeight: 19 }}>
                    {[shop.address, shop.city].filter(Boolean).join(", ")}
                  </Text>
                </TouchableOpacity>
              ) : null}

              {/* Description */}
              {shop.description ? (
                <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.foreground, marginTop: 12, lineHeight: 21 }}>
                  {shop.description}
                </Text>
              ) : null}
            </View>

            <View style={{ paddingHorizontal: 20, gap: 32, marginTop: 8 }}>

              {/* ── Gallery grid ── */}
              {(sv?.showGallery !== false) && gallery.length > 0 ? (
                <Section
                  title={`Galeri  ·  ${gallery.length} fotoğraf`}
                  c={c}
                  action={
                    gallery.length > MAX_GALLERY_VISIBLE ? (
                      <TouchableOpacity onPress={() => openGallery(0)} activeOpacity={0.7}>
                        <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>
                          Tümünü Gör
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                >
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: GALLERY_GAP }}>
                    {visibleGallery.map((url, i) => {
                      const isLast = i === MAX_GALLERY_VISIBLE - 1 && hiddenCount > 0;
                      return (
                        <TouchableOpacity
                          key={i}
                          onPress={() => openGallery(i)}
                          activeOpacity={0.85}
                          style={{ width: GALLERY_CELL, height: GALLERY_CELL, borderRadius: 10, overflow: "hidden" }}
                        >
                          <Image
                            source={{ uri: url }}
                            style={{ width: GALLERY_CELL, height: GALLERY_CELL }}
                            resizeMode="cover"
                          />
                          {isLast ? (
                            <View style={styles.galleryOverlay}>
                              <Text style={{ color: "#fff", fontFamily: Typography.fontFamily.bold, fontSize: 18 }}>
                                +{hiddenCount + 1}
                              </Text>
                            </View>
                          ) : null}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </Section>
              ) : null}

              {/* ── Services ── */}
              {shop.services && shop.services.length > 0 ? (
                <Section title="Hizmetler" c={c}>
                  <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
                    {shop.services.map((s, i) => (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          borderBottomWidth: i < shop.services!.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: c.border,
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 15 }}>
                            {s.nameTr}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 3 }}>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                              <Ionicons name="time-outline" size={12} color={c.mutedForeground} />
                              <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12 }}>
                                {s.duration} dk
                              </Text>
                            </View>
                            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 14 }}>
                              {formatCurrency(s.price)}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => { haptics.light(); goBook(s.id); }}
                          activeOpacity={0.85}
                          style={{ backgroundColor: c.primary, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 }}
                        >
                          <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 12 }}>
                            Randevu Al
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}

              {/* ── Team ── */}
              {(sv?.showTeam !== false) && shop.barbers && shop.barbers.length > 0 ? (
                <Section title="Ekip" c={c}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginHorizontal: -20 }}
                    contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
                  >
                    {shop.barbers.filter((b) => bd?.hideInactive !== true || b.available !== false).map((b) => {
                      const photo = (bd?.showPhotos !== false) ? (b.profilePhoto ?? b.avatar) : null;
                      const barberInitial = b.nameTr.charAt(0).toUpperCase();
                      const isAvailable = b.available !== false;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          onPress={() => { haptics.light(); router.push({ pathname: "/barber/[slug]", params: { slug: b.slug, shopSlug: shop.slug } }); }}
                          activeOpacity={0.85}
                          style={{
                            width: 120,
                            backgroundColor: c.card,
                            borderRadius: 16,
                            borderWidth: 1,
                            borderColor: c.border,
                            padding: 14,
                            alignItems: "center",
                            gap: 6,
                          }}
                        >
                          {photo ? (
                            <Image
                              source={{ uri: photo }}
                              style={{ width: 68, height: 68, borderRadius: 34 }}
                              resizeMode="cover"
                            />
                          ) : (
                            <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: c.secondary, justifyContent: "center", alignItems: "center" }}>
                              <Text style={{ fontSize: 26, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                                {barberInitial}
                              </Text>
                            </View>
                          )}
                          <Text numberOfLines={1} style={{ fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: c.foreground, textAlign: "center", marginTop: 2 }}>
                            {b.nameTr}
                          </Text>
                          {(b.rating != null && b.rating > 0) ? (
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                              <Ionicons name="star" size={11} color="#F59E0B" />
                              <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.medium, color: c.foreground }}>
                                {b.rating.toFixed(1)}
                              </Text>
                            </View>
                          ) : null}
                          {(b.yearsExp != null && b.yearsExp > 0) ? (
                            <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                              {b.yearsExp} yıl deneyim
                            </Text>
                          ) : null}
                          <View
                            style={{
                              paddingHorizontal: 8,
                              paddingVertical: 3,
                              borderRadius: 999,
                              backgroundColor: isAvailable ? "#10B98118" : c.secondary,
                            }}
                          >
                            <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.semiBold, color: isAvailable ? "#10B981" : c.mutedForeground }}>
                              {isAvailable ? "Müsait" : "İzinli"}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </Section>
              ) : null}

              {/* ── Reviews ── */}
              {(sv?.showReviews !== false) && reviews.length > 0 ? (
                <Section
                  title="Değerlendirmeler"
                  c={c}
                  action={
                    reviews.length > 5 ? (
                      <TouchableOpacity onPress={() => setShowAllReviews((v) => !v)}>
                        <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>
                          {showAllReviews ? "Daha Az" : "Tümünü Gör"}
                        </Text>
                      </TouchableOpacity>
                    ) : null
                  }
                >
                  {shop.avgRating != null && shop.avgRating > 0 ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 16, padding: 18, backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border }}>
                      <View style={{ alignItems: "center" }}>
                        <Text style={{ fontSize: 48, fontFamily: Typography.fontFamily.bold, color: c.foreground, lineHeight: 56 }}>
                          {shop.avgRating.toFixed(1)}
                        </Text>
                        <View style={{ flexDirection: "row", gap: 2, marginTop: 4 }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Ionicons
                              key={n}
                              name={n <= Math.round(shop.avgRating!) ? "star" : "star-outline"}
                              size={14}
                              color="#F59E0B"
                            />
                          ))}
                        </View>
                        <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 4 }}>
                          {shop.totalReviews ?? reviews.length} değerlendirme
                        </Text>
                      </View>
                      {/* Rating distribution bars */}
                      <View style={{ flex: 1, gap: 4 }}>
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = reviews.filter((r) => Math.round(r.shopRating) === star).length;
                          const pct = reviews.length > 0 ? count / reviews.length : 0;
                          return (
                            <View key={star} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                              <Text style={{ fontSize: 10, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, width: 8 }}>
                                {star}
                              </Text>
                              <View style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: c.secondary, overflow: "hidden" }}>
                                <View style={{ width: `${pct * 100}%`, height: 4, borderRadius: 2, backgroundColor: "#F59E0B" }} />
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : null}

                  <View style={{ gap: 10 }}>
                    {displayedReviews.map((r) => (
                      <View
                        key={r.id}
                        style={{ backgroundColor: c.card, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: c.border, gap: 6 }}
                      >
                        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <View style={{ gap: 2 }}>
                            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 14 }}>
                              {r.customerName ?? r.clientName}
                            </Text>
                            <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                              {fmtReviewDate(r.createdAt)}
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Ionicons
                                key={n}
                                name={n <= r.shopRating ? "star" : "star-outline"}
                                size={12}
                                color="#F59E0B"
                              />
                            ))}
                          </View>
                        </View>
                        {r.comment ? (
                          <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.foreground, fontSize: 13, lineHeight: 19, marginTop: 2 }}>
                            {r.comment}
                          </Text>
                        ) : null}
                        {r.barber ? (
                          <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                            {r.barber.nameTr}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}

              {/* ── Working hours ── */}
              {shop.workingHours && shop.workingHours.length > 0 ? (
                <Section title="Çalışma Saatleri" c={c}>
                  <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
                    {shop.workingHours.map((wh, i) => (
                      <View
                        key={wh.day}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: i < shop.workingHours!.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: c.border,
                        }}
                      >
                        <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.medium, color: c.foreground }}>
                          {wh.label}
                        </Text>
                        {wh.closed ? (
                          <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                            Kapalı
                          </Text>
                        ) : (
                          <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.foreground }}>
                            {wh.open} – {wh.close}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}

              {/* ── Contact ── */}
              <Section title="İletişim" c={c}>
                <View style={{ gap: 8 }}>
                  {shop.phone ? (
                    <ContactRow
                      c={c}
                      iconBg={c.secondary}
                      icon={<Ionicons name="call" size={18} color={c.foreground} />}
                      label="Telefon"
                      value={shop.phone}
                      onPress={call}
                    />
                  ) : null}
                  {(sv?.showWhatsapp !== false) && shop.whatsappNumber ? (
                    <ContactRow
                      c={c}
                      iconBg="#25D36618"
                      icon={<Ionicons name="logo-whatsapp" size={18} color="#25D366" />}
                      label="WhatsApp"
                      value="Mesaj gönder"
                      onPress={whatsapp}
                    />
                  ) : null}
                  {(sv?.showInstagram !== false) && shop.instagramUrl ? (
                    <ContactRow
                      c={c}
                      iconBg="#E1306C18"
                      icon={<Ionicons name="logo-instagram" size={18} color="#E1306C" />}
                      label="Instagram"
                      value="Profili gör"
                      onPress={openInstagram}
                    />
                  ) : null}
                  {shop.facebookUrl ? (
                    <ContactRow
                      c={c}
                      iconBg="#1877F218"
                      icon={<Ionicons name="logo-facebook" size={18} color="#1877F2" />}
                      label="Facebook"
                      value="Sayfayı gör"
                      onPress={openFacebook}
                    />
                  ) : null}
                  {shop.tiktokUrl ? (
                    <ContactRow
                      c={c}
                      iconBg="#010101"
                      icon={<Ionicons name="logo-tiktok" size={18} color="#fff" />}
                      label="TikTok"
                      value="Profili gör"
                      onPress={openTiktok}
                    />
                  ) : null}
                  {shop.website ? (
                    <ContactRow
                      c={c}
                      iconBg={c.secondary}
                      icon={<Ionicons name="globe-outline" size={18} color={c.foreground} />}
                      label="Web Sitesi"
                      value={shop.website.replace(/^https?:\/\//, "")}
                      onPress={openWebsite}
                    />
                  ) : null}
                  {shop.address || (shop.latitude && shop.longitude) ? (
                    <ContactRow
                      c={c}
                      iconBg={c.secondary}
                      icon={<Ionicons name="location" size={18} color={c.foreground} />}
                      label="Adres"
                      value={shop.address ?? `${shop.latitude}, ${shop.longitude}`}
                      onPress={openDirections}
                      footer="Yol Tarifi Al →"
                      onShare={() => {
                        haptics.light();
                        Share.share({ message: shop.address ?? `${shop.latitude}, ${shop.longitude}` });
                      }}
                    />
                  ) : null}
                </View>
              </Section>

              {/* ── FAQ ── */}
              {shop.faq && shop.faq.length > 0 ? (
                <Section title="Sık Sorulan Sorular" c={c}>
                  <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
                    {shop.faq.map((item, i) => (
                      <View
                        key={i}
                        style={{
                          borderBottomWidth: i < shop.faq!.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: c.border,
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => toggleFaq(i)}
                          activeOpacity={0.7}
                          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 }}
                        >
                          <Text style={{ flex: 1, fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: c.foreground, marginRight: 8 }}>
                            {item.q}
                          </Text>
                          <Ionicons
                            name={expandedFaq[i] ? "chevron-up" : "chevron-down"}
                            size={18}
                            color={c.mutedForeground}
                          />
                        </TouchableOpacity>
                        {expandedFaq[i] ? (
                          <View style={{ paddingHorizontal: 16, paddingBottom: 14 }}>
                            <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, lineHeight: 20 }}>
                              {item.a}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}
            </View>
          </ScrollView>

          {/* ── Sticky CTA ── */}
          {shop.services && shop.services.length > 0 ? (
            <View style={[styles.ctaBar, { backgroundColor: c.card, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
              <TouchableOpacity
                onPress={() => { haptics.medium(); goBook(); }}
                activeOpacity={0.9}
                style={{ backgroundColor: c.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
              >
                <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 16 }}>
                  Randevu Al
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* ── Full-screen gallery modal ── */}
          <GalleryViewer
            images={gallery}
            initialIndex={galleryIndex}
            visible={galleryVisible}
            onClose={() => setGalleryVisible(false)}
          />
        </View>
      ) : null}
    </>
  );
}

function ContactRow({
  c,
  icon,
  iconBg,
  label,
  value,
  onPress,
  footer,
  onShare,
}: {
  c: typeof Colors.light;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  onPress: () => void;
  footer?: string;
  onShare?: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={() => { haptics.select(); onPress(); }}
      activeOpacity={0.85}
      style={[styles.contactRow, { backgroundColor: c.card, borderColor: c.border }]}
    >
      <View style={[styles.contactIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.medium, color: c.mutedForeground }}>{label}</Text>
        <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: c.foreground, marginTop: 1 }} numberOfLines={2}>
          {value}
        </Text>
        {footer ? (
          <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: c.foreground, marginTop: 4 }}>
            {footer}
          </Text>
        ) : null}
      </View>
      {onShare ? (
        <TouchableOpacity onPress={onShare} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="share-social-outline" size={18} color={c.mutedForeground} />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={c.mutedForeground} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    position: "relative",
    backgroundColor: "#EFEAE2",
  },
  heroPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  heroGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 100,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  heroNav: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  heroBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 4,
  },
  infoCard: {
    marginTop: -22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 8,
  },
  galleryOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  ctaBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 12,
  },
});
