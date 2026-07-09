import { useState, useEffect } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { shopCoverUri } from "@/utils/shopImage";
import { api } from "@/services/api";
import type { PublicShop } from "@/types/api";

const TR_MONTHS_SHORT = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];

function fmtFirstAvail(date: string, time: string): string {
  const trNow = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const todayStr = trNow.toISOString().slice(0, 10);
  const tomorrowStr = new Date(Date.now() + 3 * 60 * 60 * 1000 + 86400000).toISOString().slice(0, 10);
  const d = new Date(date + "T12:00:00");
  const prefix = date === todayStr ? "Bugün" : date === tomorrowStr ? "Yarın" : `${d.getDate()} ${TR_MONTHS_SHORT[d.getMonth()]}`;
  return `${prefix} ${time}`;
}

function useFirstAvailable(shopId: string) {
  const [fa, setFa] = useState<{ date: string; time: string } | null>(null);
  useEffect(() => {
    api.get<{ date: string | null; time?: string }>("/shops/first-available", { params: { shopId } })
      .then(({ data }) => { if (data.date && data.time) setFa({ date: data.date, time: data.time }); })
      .catch(() => {});
  }, [shopId]);
  return fa;
}

interface ShopCardProps {
  shop: PublicShop;
  onPress: () => void;
  c: typeof Colors.light;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

interface PremiumProps extends ShopCardProps {
  width?: number;
}

export function PremiumShopCard({ shop, onPress, c, isFavorite, onToggleFavorite, width = 280 }: PremiumProps) {
  const cover = shopCoverUri(shop);
  const initial = shop.name.charAt(0).toUpperCase();
  const fa = useFirstAvailable(shop.id);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.premiumCard,
        {
          width,
          backgroundColor: c.card,
          borderColor: c.border,
          shadowColor: "#000",
        },
      ]}
    >
      <View style={styles.coverWrap}>
        {cover ? (
          <Image source={{ uri: cover }} style={styles.cover} resizeMode="cover" />
        ) : (
          <View style={[styles.cover, styles.placeholderCover, { backgroundColor: c.secondary }]}>
            {shop.logo ? (
              <Image source={{ uri: shop.logo }} style={{ width: 64, height: 64, borderRadius: 12 }} resizeMode="contain" />
            ) : (
              <Text style={{ fontSize: 56, fontFamily: Typography.fontFamily.bold, color: c.mutedForeground }}>
                {initial}
              </Text>
            )}
          </View>
        )}
        <TouchableOpacity
          onPress={onToggleFavorite}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.favBtn}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#B91C1C" : "#111111"}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.premiumBody}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}
        >
          {shop.name}
        </Text>
        {shop.city ? (
          <Text
            numberOfLines={1}
            style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 2 }}
          >
            {shop.city}
          </Text>
        ) : null}
        {shop.services && shop.services.length > 0 ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
            {shop.services.slice(0, 3).map((svc) => (
              <View key={svc.id} style={[styles.serviceTag, { backgroundColor: c.secondary }]}>
                <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.medium, color: c.mutedForeground }}>
                  {svc.nameTr}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        {fa && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" }} />
            <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.medium, color: "#10B981" }}>
              İlk müsait: {fmtFirstAvail(fa.date, fa.time)}
            </Text>
          </View>
        )}
        <View style={styles.premiumFooter}>
          {shop.avgRating != null && shop.avgRating > 0 ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: c.foreground }}>
                {shop.avgRating.toFixed(1)}
              </Text>
              <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                ({shop.totalReviews ?? 0})
              </Text>
            </View>
          ) : (
            <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
              {(shop.totalReviews ?? 0) === 0 ? "Yeni salon" : `${shop.totalReviews} değerlendirme`}
            </Text>
          )}
          <View style={[styles.bookPill, { backgroundColor: c.primary }]}>
            <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.semiBold, color: c.primaryForeground }}>
              Randevu Al
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function CompactShopCard({ shop, onPress, c, isFavorite, onToggleFavorite }: ShopCardProps) {
  const cover = shopCoverUri(shop);
  const initial = shop.name.charAt(0).toUpperCase();
  const fa = useFirstAvailable(shop.id);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        styles.compactCard,
        { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" },
      ]}
    >
      {cover ? (
        <Image source={{ uri: cover }} style={styles.compactThumb} resizeMode="cover" />
      ) : (
        <View style={[styles.compactThumb, styles.placeholderCover, { backgroundColor: c.secondary }]}>
          {shop.logo ? (
            <Image source={{ uri: shop.logo }} style={{ width: 44, height: 44, borderRadius: 8 }} resizeMode="contain" />
          ) : (
            <Text style={{ fontSize: 30, fontFamily: Typography.fontFamily.bold, color: c.mutedForeground }}>
              {initial}
            </Text>
          )}
        </View>
      )}
      <View style={{ flex: 1, gap: 3 }}>
        <Text
          numberOfLines={1}
          style={{ fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}
        >
          {shop.name}
        </Text>
        {shop.city ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="location-outline" size={12} color={c.mutedForeground} />
            <Text
              numberOfLines={1}
              style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}
            >
              {shop.city}
            </Text>
          </View>
        ) : null}
        {shop.avgRating != null && shop.avgRating > 0 ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.medium, color: c.foreground }}>
              {shop.avgRating.toFixed(1)}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
              · {shop.totalReviews ?? 0} değerlendirme
            </Text>
          </View>
        ) : null}
        {fa && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: "#10B981" }} />
            <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.medium, color: "#10B981" }}>
              {fmtFirstAvail(fa.date, fa.time)}
            </Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        onPress={onToggleFavorite}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        style={styles.compactFav}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={22}
          color={isFavorite ? "#B91C1C" : c.mutedForeground}
        />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  premiumCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  coverWrap: { position: "relative" },
  cover: { width: "100%", height: 140, borderTopLeftRadius: 14, borderTopRightRadius: 14 },
  placeholderCover: { justifyContent: "center", alignItems: "center" },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  premiumBody: { padding: 12, gap: 2 },
  premiumFooter: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  serviceTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  compactCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  compactThumb: { width: 80, height: 80, borderRadius: 10 },
  compactFav: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
  },
});
