import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  useColorScheme, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { api } from "@/services/api";
import { formatCurrency } from "@/utils/format";
import { haptics } from "@/utils/haptics";
import { SkeletonBox } from "@/components/ui/SkeletonLoader";

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const DAY_LABELS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

function minToHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function StarRow({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  const c = (useColorScheme() ?? "light") === "light" ? Colors.light : Colors.dark;
  const full = Math.round(rating);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= full ? "star" : "star-outline"} size={size} color="#F59E0B" />
      ))}
      {count != null ? (
        <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.medium, color: c.mutedForeground, marginLeft: 2 }}>
          ({count})
        </Text>
      ) : null}
    </View>
  );
}

export default function BarberProfileScreen() {
  const { slug, shopSlug } = useLocalSearchParams<{ slug: string; shopSlug: string }>();
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["barber", slug, shopSlug],
    queryFn: async () => {
      const res = await api.get(`/public/barbers/${slug}`, { params: { shopSlug } });
      return res.data as { barber: BarberDetail; reviews: BarberReview[] };
    },
    staleTime: 120_000,
  });

  const barber = data?.barber;
  const reviews = data?.reviews ?? [];
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const photo = barber?.profilePhoto ?? barber?.avatar;

  const goBook = () => {
    if (!barber?.shop?.slug) return;
    haptics.medium();
    router.push({
      pathname: "/salon/book",
      params: { shopSlug: barber.shop.slug, barberId: barber.id },
    });
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: barber?.nameTr ?? "Berber Profili",
          headerTitleStyle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 16, color: c.foreground },
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 16 }}>
              <Ionicons name="chevron-back" size={24} color={c.foreground} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["bottom"]}>
        {isLoading ? (
          <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 40, gap: 20 }} showsVerticalScrollIndicator={false}>
            <View style={{ alignItems: "center", gap: 12 }}>
              <SkeletonBox width={110} height={110} borderRadius={55} />
              <SkeletonBox width={160} height={20} borderRadius={6} />
              <SkeletonBox width={100} height={14} borderRadius={6} />
              <View style={{ flexDirection: "row", gap: 24 }}>
                <SkeletonBox width={60} height={40} borderRadius={8} />
                <SkeletonBox width={60} height={40} borderRadius={8} />
              </View>
            </View>
            <SkeletonBox width={"100%"} height={80} borderRadius={14} />
            <SkeletonBox width={"100%"} height={120} borderRadius={14} />
            <SkeletonBox width={"100%"} height={200} borderRadius={14} />
          </ScrollView>
        ) : isError || !barber ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={36} color={c.mutedForeground} />
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 16 }}>
              Berber bulunamadı
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingBottom: 120 }}
            showsVerticalScrollIndicator={false}
          >
            {/* ── Hero ── */}
            <View style={{ alignItems: "center", paddingTop: 32, paddingBottom: 24, paddingHorizontal: 20, gap: 12 }}>
              {photo ? (
                <Image
                  source={{ uri: photo }}
                  style={{ width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: c.border }}
                  resizeMode="cover"
                />
              ) : (
                <View style={{ width: 110, height: 110, borderRadius: 55, backgroundColor: c.secondary, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: c.border }}>
                  <Text style={{ fontSize: 42, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                    {barber.nameTr.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <View style={{ alignItems: "center", gap: 4 }}>
                <Text style={{ fontSize: 22, fontFamily: Typography.fontFamily.bold, color: c.foreground, letterSpacing: -0.3 }}>
                  {barber.nameTr}
                </Text>
                {barber.titleTr ? (
                  <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                    {barber.titleTr}
                  </Text>
                ) : null}
              </View>

              {/* Stats row */}
              <View style={{ flexDirection: "row", gap: 24, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
                {(barber.rating && barber.rating > 0) ? (
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                      <Text style={{ fontSize: 20, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                        {barber.rating.toFixed(1)}
                      </Text>
                      <Ionicons name="star" size={14} color="#F59E0B" />
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                      {barber.reviewCount ? `${barber.reviewCount} yorum` : "Değerlendirme"}
                    </Text>
                  </View>
                ) : null}
                {(barber.yearsExp && barber.yearsExp > 0) ? (
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 20, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                      {barber.yearsExp}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                      Yıl deneyim
                    </Text>
                  </View>
                ) : null}
                {(barber.completedAppointments && barber.completedAppointments > 0) ? (
                  <View style={{ alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 20, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                      {barber.completedAppointments > 999 ? `${Math.floor(barber.completedAppointments / 1000)}K+` : barber.completedAppointments}
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                      Tamamlandı
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Availability badge */}
              <View style={{
                paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999,
                backgroundColor: barber.available ? "#10B98118" : c.secondary,
              }}>
                <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: barber.available ? "#10B981" : c.mutedForeground }}>
                  {barber.available ? "Müsait" : "Şu an izinli"}
                </Text>
              </View>
            </View>

            <View style={{ paddingHorizontal: 20, gap: 28 }}>
              {/* Bio */}
              {barber.bioTr ? (
                <Section title="Hakkında" c={c}>
                  <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.foreground, lineHeight: 22 }}>
                    {barber.bioTr}
                  </Text>
                </Section>
              ) : null}

              {/* Specialties */}
              {barber.specialties && barber.specialties.length > 0 ? (
                <Section title="Uzmanlık Alanları" c={c}>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                    {barber.specialties.map((s) => (
                      <View key={s} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: c.secondary, borderWidth: 1, borderColor: c.border }}>
                        <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: c.foreground }}>
                          {s}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}

              {/* Services */}
              {barber.shop?.services && barber.shop.services.length > 0 ? (
                <Section title="Hizmetler" c={c}>
                  <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
                    {barber.shop.services.map((s, i) => (
                      <View
                        key={s.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingHorizontal: 16,
                          paddingVertical: 14,
                          borderBottomWidth: i < barber.shop!.services.length - 1 ? StyleSheet.hairlineWidth : 0,
                          borderBottomColor: c.border,
                        }}
                      >
                        <View style={{ flex: 1, gap: 2 }}>
                          <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 14 }}>
                            {s.nameTr}
                          </Text>
                          <Text style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12 }}>
                            {s.duration} dk
                          </Text>
                        </View>
                        <Text style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 15 }}>
                          {formatCurrency(s.price)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </Section>
              ) : null}

              {/* Working hours */}
              {barber.workingHours ? (
                <Section title="Çalışma Saatleri" c={c}>
                  <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
                    {DAY_KEYS.map((key, i) => {
                      const wh = barber.workingHours!;
                      const start = wh[`${key}Start` as keyof typeof wh] as number | null;
                      const end   = wh[`${key}End`   as keyof typeof wh] as number | null;
                      return (
                        <View
                          key={key}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "space-between",
                            paddingHorizontal: 16,
                            paddingVertical: 12,
                            borderBottomWidth: i < 6 ? StyleSheet.hairlineWidth : 0,
                            borderBottomColor: c.border,
                          }}
                        >
                          <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: c.foreground, width: 36 }}>
                            {DAY_LABELS[(i + 1) % 7]}
                          </Text>
                          {start != null && end != null ? (
                            <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.foreground }}>
                              {minToHHMM(start)} – {minToHHMM(end)}
                            </Text>
                          ) : (
                            <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                              Kapalı
                            </Text>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </Section>
              ) : null}

              {/* Reviews */}
              {reviews.length > 0 ? (
                <Section title={`Değerlendirmeler (${reviews.length})`} c={c}>
                  <View style={{ gap: 10 }}>
                    {visibleReviews.map((r) => (
                      <View
                        key={r.id}
                        style={{ backgroundColor: c.card, borderRadius: 14, borderWidth: 1, borderColor: c.border, padding: 14, gap: 8 }}
                      >
                        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                          <StarRow rating={r.barberRating} size={13} />
                          <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                            {fmtDate(r.createdAt)}
                          </Text>
                        </View>
                        {r.customer?.name ? (
                          <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>
                            {r.customer.name.split(" ")[0]}
                          </Text>
                        ) : null}
                        {r.comment ? (
                          <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.foreground, lineHeight: 19 }}>
                            {r.comment}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                    {reviews.length > 3 ? (
                      <TouchableOpacity
                        onPress={() => { haptics.light(); setShowAllReviews((v) => !v); }}
                        activeOpacity={0.7}
                        style={{ alignItems: "center", paddingVertical: 10 }}
                      >
                        <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>
                          {showAllReviews ? "Daha Az" : `Tümünü Gör (${reviews.length})`}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </Section>
              ) : null}
            </View>
          </ScrollView>
        )}

        {/* ── Book CTA ── */}
        {barber?.available && barber.shop ? (
          <View style={[styles.cta, { backgroundColor: c.card, borderTopColor: c.border }]}>
            <TouchableOpacity
              onPress={goBook}
              activeOpacity={0.9}
              style={{ backgroundColor: c.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center" }}
            >
              <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 16 }}>
                {barber.nameTr} ile Randevu Al
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </SafeAreaView>
    </>
  );
}

function Section({ title, c, children }: { title: string; c: typeof Colors.light; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.bold, color: c.mutedForeground, textTransform: "uppercase", letterSpacing: 0.8 }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

// Types for this screen only
interface BarberDetail {
  id: string;
  slug: string;
  nameTr: string;
  titleTr?: string | null;
  bioTr?: string | null;
  avatar?: string | null;
  profilePhoto?: string | null;
  specialties: string[];
  yearsExp: number;
  rating: number;
  reviewCount: number;
  completedAppointments?: number;
  available: boolean;
  shop?: { id: string; slug: string; name: string; services: { id: string; nameTr: string; price: number; duration: number }[] } | null;
  workingHours?: Record<string, number | null> | null;
}

interface BarberReview {
  id: string;
  barberRating: number;
  comment?: string | null;
  createdAt: string;
  customer?: { name: string } | null;
}

const styles = StyleSheet.create({
  cta: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
