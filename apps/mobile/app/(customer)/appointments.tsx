import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  useColorScheme,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { shopsService } from "@/services/shops";
import { queryKeys } from "@/utils/queryKeys";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/utils/format";
import { AppointmentCardSkeleton } from "@/components/ui/SkeletonLoader";
import { haptics } from "@/utils/haptics";
import { api } from "@/services/api";
import type { PublicAppointment } from "@/types/api";

const STATUS_COLOR: Record<string, string> = {
  PENDING: "#F59E0B",
  CONFIRMED: "#10B981",
  COMPLETED: "#6B7280",
  CANCELLED: "#B91C1C",
  NOSHOW: "#B91C1C",
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: "Onay Bekliyor",
  CONFIRMED: "Onaylandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
  NOSHOW: "Gelmedi",
};

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const TR_DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// Local ISO date — avoids toISOString() UTC off-by-one in UTC+3 (Istanbul)
function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T12:00:00");
  return `${TR_DAYS[d.getDay()]}, ${d.getDate()} ${TR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function apptCountdown(date: string, time: string): string | null {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, m] = time.split(":").map(Number);
  const apptMs = new Date(y, mo - 1, d, h, m, 0).getTime();
  const diffMin = Math.round((apptMs - Date.now()) / 60000);
  if (diffMin <= 0) return null;
  if (diffMin < 60) return `${diffMin} dk içinde`;
  if (diffMin < 120) return "1 saat içinde";
  if (diffMin < 1440) return `${Math.floor(diffMin / 60)} saat içinde`;
  if (diffMin < 2880) return "Yarın";
  const days = Math.floor(diffMin / 1440);
  return days <= 14 ? `${days} gün içinde` : null;
}

function ApptCard({
  a,
  c,
  phone,
  onPress,
  onRebook,
  onCancelled,
}: {
  a: PublicAppointment;
  c: typeof Colors.light;
  phone: string;
  onPress: () => void;
  onRebook?: () => void;
  onCancelled?: () => void;
}) {
  const color = STATUS_COLOR[a.status] ?? "#6B7280";
  const label = STATUS_LABEL[a.status] ?? a.status;
  const showRebook = a.status === "COMPLETED" && onRebook;
  const showPrice = a.price > 0;
  const canCancel = ["PENDING", "CONFIRMED"].includes(a.status);

  const handleCancel = () => {
    haptics.warning();
    Alert.alert(
      "Randevuyu İptal Et",
      "Bu randevuyu iptal etmek istediğinizden emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "İptal Et",
          style: "destructive",
          onPress: async () => {
            try {
              await api.post("/public/appointments/cancel", { appointmentId: a.id, phone });
              haptics.success();
              onCancelled?.();
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : "İptal işlemi başarısız";
              Alert.alert("Hata", msg);
            }
          },
        },
      ]
    );
  };

  const barberPhoto = a.barber.profilePhoto ?? a.barber.avatar;
  const countdown = canCancel ? apptCountdown(a.date, a.time) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[styles.card, { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" }]}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        {/* Barber avatar */}
        {barberPhoto ? (
          <Image source={{ uri: barberPhoto }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: c.border }} resizeMode="cover" />
        ) : (
          <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.secondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: c.border }}>
            <Text style={{ fontSize: 18, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
              {a.barber.nameTr.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text numberOfLines={1} style={{ fontFamily: Typography.fontFamily.bold, color: c.foreground, fontSize: 15 }}>
            {a.shop.name}
          </Text>
          <Text numberOfLines={1} style={{ fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12 }}>
            {a.barber.nameTr} · {a.service.nameTr}
          </Text>
        </View>
        <View style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: color + "1F" }}>
          <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color }}>{label}</Text>
        </View>
      </View>

      {countdown && (
        <View style={{
          marginTop: 10,
          backgroundColor: "#10B98115",
          borderRadius: 8,
          paddingHorizontal: 10,
          paddingVertical: 6,
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
        }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" }} />
          <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: "#10B981", fontSize: 12 }}>
            {countdown}
          </Text>
        </View>
      )}

      <View
        style={{
          marginTop: 10,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: c.border,
          flexDirection: "row",
          alignItems: "center",
          gap: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="calendar-outline" size={14} color={c.mutedForeground} />
          <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.foreground, fontSize: 13 }}>
            {fmtDate(a.date)}
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Ionicons name="time-outline" size={14} color={c.mutedForeground} />
          <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.foreground, fontSize: 13 }}>
            {a.time}
          </Text>
        </View>
      </View>

      {(showPrice || showRebook || canCancel) && (
        <View
          style={{
            marginTop: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {showPrice ? (
            <Text style={{ fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 15 }}>
              {formatCurrency(a.price)}
            </Text>
          ) : (
            <View />
          )}
          <View style={{ flexDirection: "row", gap: 8 }}>
            {canCancel ? (
              <TouchableOpacity
                onPress={handleCancel}
                activeOpacity={0.85}
                style={{
                  borderColor: "#EF4444",
                  borderWidth: 1,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 999,
                }}
              >
                <Text style={{ color: "#EF4444", fontFamily: Typography.fontFamily.semiBold, fontSize: 12 }}>
                  İptal Et
                </Text>
              </TouchableOpacity>
            ) : null}
            {showRebook ? (
              <TouchableOpacity
                onPress={onRebook}
                activeOpacity={0.85}
                style={{
                  backgroundColor: c.primary,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 999,
                }}
              >
                <Text
                  style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 12 }}
                >
                  Tekrar Randevu Al
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

export default function CustomerAppointments() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const debouncedPhone = useDebounce(phone, 600);

  const cleanPhone = debouncedPhone.replace(/\D/g, "");
  const isValidPhone = cleanPhone.length >= 10;

  const { data: appointments, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.publicAppointments.byPhone(cleanPhone),
    queryFn: () => shopsService.myAppointments(cleanPhone),
    enabled: isValidPhone,
    staleTime: 30_000,
  });

  // Time determines section — status is irrelevant.
  // Upcoming = datetime is in the future (ascending).
  // Past     = datetime is in the past (descending).
  const todayISO = localISODate();
  const nowTime = new Date().toTimeString().slice(0, 5); // "HH:MM"

  function cmpAsc(a: PublicAppointment, b: PublicAppointment) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
  }

  function isFuture(a: PublicAppointment) {
    if (a.date > todayISO) return true;
    if (a.date === todayISO) return a.time >= nowTime;
    return false;
  }

  const upcoming = (appointments ?? []).filter(isFuture).sort(cmpAsc);
  const past     = (appointments ?? []).filter((a) => !isFuture(a)).sort((a, b) => -cmpAsc(a, b));

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
          Randevularım
        </Text>

        <View
          style={[
            styles.phoneRow,
            { backgroundColor: c.card, borderColor: c.border, shadowColor: "#000" },
          ]}
        >
          <Ionicons name="call-outline" size={20} color={c.mutedForeground} />
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Telefon numaran"
            placeholderTextColor={c.mutedForeground}
            keyboardType="phone-pad"
            style={{
              flex: 1,
              fontSize: 15,
              fontFamily: Typography.fontFamily.regular,
              color: c.foreground,
              paddingVertical: 0,
            }}
          />
          {phone.length > 0 ? (
            <TouchableOpacity
              onPress={() => setPhone("")}
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

        <TouchableOpacity
          onPress={() => refetch()}
          disabled={!isValidPhone}
          activeOpacity={0.85}
          style={{
            marginTop: 12,
            backgroundColor: isValidPhone ? c.primary : c.secondary,
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: isValidPhone ? c.primaryForeground : c.mutedForeground,
              fontFamily: Typography.fontFamily.semiBold,
              fontSize: 15,
            }}
          >
            Randevularımı Göster
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && isValidPhone}
            onRefresh={refetch}
            tintColor={c.foreground}
          />
        }
      >
        {!phone ? (
          <View style={{ alignItems: "center", marginTop: 48, paddingHorizontal: 32, gap: 16 }}>
            <View style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: c.secondary,
              justifyContent: "center", alignItems: "center",
            }}>
              <Ionicons name="phone-portrait-outline" size={40} color={c.mutedForeground} />
            </View>
            <Text style={{ fontSize: 18, fontFamily: Typography.fontFamily.bold, color: c.foreground, textAlign: "center" }}>
              Telefon numaran
            </Text>
            <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, textAlign: "center", lineHeight: 22 }}>
              Randevularını görüntülemek için kayıtlı telefon numaranı gir.
            </Text>
          </View>
        ) : null}

        {phone && !isValidPhone ? (
          <View style={{ alignItems: "center", marginTop: 40 }}>
            <Text
              style={{ fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}
            >
              Geçerli bir numara gir (en az 10 haneli)
            </Text>
          </View>
        ) : null}

        {isValidPhone && isLoading ? (
          <View style={{ gap: 10 }}>
            {[0, 1, 2].map((i) => (
              <AppointmentCardSkeleton key={i} c={c} />
            ))}
          </View>
        ) : null}

        {isValidPhone && isError ? (
          <View style={{ alignItems: "center", marginTop: 40, paddingHorizontal: 32, gap: 8 }}>
            <Ionicons name="alert-circle-outline" size={36} color={c.mutedForeground} />
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
              Bağlantını kontrol edip tekrar dene
            </Text>
          </View>
        ) : null}

        {isValidPhone && !isLoading && !isError && !appointments?.length ? (
          <View style={{ alignItems: "center", marginTop: 48, paddingHorizontal: 32, gap: 14 }}>
            <View style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: c.secondary,
              justifyContent: "center", alignItems: "center",
            }}>
              <Ionicons name="calendar-clear-outline" size={40} color={c.mutedForeground} />
            </View>
            <Text style={{ fontSize: 18, fontFamily: Typography.fontFamily.bold, color: c.foreground, textAlign: "center" }}>
              Randevu bulunamadı
            </Text>
            <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, textAlign: "center", lineHeight: 22 }}>
              Bu numarayla henüz randevu oluşturulmamış.
            </Text>
          </View>
        ) : null}

        {upcoming.length > 0 && (
          <>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                marginTop: 4,
                marginBottom: 4,
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
                Yaklaşan
              </Text>
              <View
                style={{
                  minWidth: 20,
                  paddingHorizontal: 6,
                  paddingVertical: 1,
                  borderRadius: 999,
                  backgroundColor: c.primary,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: Typography.fontFamily.semiBold,
                    color: c.primaryForeground,
                  }}
                >
                  {upcoming.length}
                </Text>
              </View>
            </View>
            {upcoming.map((a) => (
              <ApptCard
                key={a.id}
                a={a}
                c={c}
                phone={cleanPhone}
                onPress={() => router.push({ pathname: "/salon/[slug]", params: { slug: a.shop.slug } })}
                onCancelled={() => refetch()}
              />
            ))}
          </>
        )}

        {past.length > 0 && (
          <>
            <Text
              style={{
                fontSize: 11,
                fontFamily: Typography.fontFamily.semiBold,
                color: c.mutedForeground,
                textTransform: "uppercase",
                letterSpacing: 1,
                marginTop: upcoming.length > 0 ? 16 : 4,
                marginBottom: 4,
              }}
            >
              Geçmiş
            </Text>
            {past.map((a) => (
              <ApptCard
                key={a.id}
                a={a}
                c={c}
                phone={cleanPhone}
                onPress={() => router.push({ pathname: "/salon/[slug]", params: { slug: a.shop.slug } })}
                onRebook={() =>
                  router.push({ pathname: "/salon/book", params: { shopSlug: a.shop.slug, barberId: a.barber.id, serviceId: a.service.id } })
                }
              />
            ))}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  phoneRow: {
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
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
});
