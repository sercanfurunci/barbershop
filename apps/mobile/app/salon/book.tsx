import { useState, useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  ActivityIndicator, useColorScheme, KeyboardAvoidingView, Platform, Alert, StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as Calendar from "expo-calendar";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { shopsService } from "@/services/shops";
import { queryKeys } from "@/utils/queryKeys";
import { formatCurrency } from "@/utils/format";
import { haptics } from "@/utils/haptics";
import type { PublicBarber, PublicService } from "@/types/api";

async function addToCalendar({
  shopName, service, barberName, date, time, address, phone,
}: {
  shopName: string;
  service: string;
  barberName: string;
  date: string;
  time: string;
  address?: string;
  phone?: string;
}) {
  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== "granted") {
    Alert.alert("İzin Gerekli", "Takvim erişimine izin verilmedi.");
    return;
  }

  const [h, m] = time.split(":").map(Number);
  const [y, mo, d] = date.split("-").map(Number);
  const startDate = new Date(y, mo - 1, d, h, m);
  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);

  const defaultCalendar = await Calendar.getDefaultCalendarAsync();

  await Calendar.createEventAsync(defaultCalendar.id, {
    title: `${shopName} — ${service}`,
    startDate,
    endDate,
    location: address,
    notes: `Berber: ${barberName}${phone ? `\nTelefon: ${phone}` : ""}`,
    alarms: [{ relativeOffset: -60 }, { relativeOffset: -30 }],
  });

  Alert.alert("Takvime Eklendi", "Randevunuz takviminize eklendi.");
}

type Step = "service" | "barber" | "datetime" | "contact" | "summary";
const STEPS: Step[] = ["service", "barber", "datetime", "contact", "summary"];
const STEP_LABEL: Record<Step, string> = {
  service: "Hizmet",
  barber: "Berber",
  datetime: "Tarih",
  contact: "İletişim",
  summary: "Özet",
};

// Use local date components — toISOString() returns UTC and causes off-by-one in UTC+3
function localISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(base: Date, n: number) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + n);
  return d;
}

const TR_MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
const TR_MONTHS_LONG = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
const TR_DAYS = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

// Returns "Bugün" | "Yarın" | "Pzt" etc. for the date card top label
function dateLabel(d: Date, today: Date): string {
  const diff = Math.round((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
  if (diff === 0) return "Bugün";
  if (diff === 1) return "Yarın";
  return TR_DAYS[d.getDay()];
}

function fmtDate(iso: string) {
  // Parse with noon to avoid any DST edge
  const d = new Date(iso + "T12:00:00");
  return `${TR_DAYS[d.getDay()]}, ${d.getDate()} ${TR_MONTHS_LONG[d.getMonth()]}`;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Onay Bekliyor", CONFIRMED: "Onaylandı", COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi", NOSHOW: "Gelmedi",
};

export default function BookScreen() {
  const { shopSlug, serviceId: preServiceId, barberId: preBarberId } = useLocalSearchParams<{ shopSlug: string; serviceId?: string; barberId?: string }>();
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = useState<Step>("service");
  const [selectedService, setSelectedService] = useState<PublicService | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<PublicBarber | null>(null);
  // Use local date — not toISOString() which is UTC
  const [selectedDate, setSelectedDate] = useState<string>(() => localISODate(new Date()));
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  // Stable across renders — recomputed only when component mounts
  const { today, dates } = useMemo(() => {
    const t = new Date();
    return {
      today: t,
      dates: Array.from({ length: 30 }, (_, i) => addDays(t, i)),
    };
  }, []);

  const { data: shop, isLoading: shopLoading } = useQuery({
    queryKey: queryKeys.shops.bySlug(shopSlug),
    queryFn: () => shopsService.bySlug(shopSlug),
    staleTime: 60_000,
  });

  // Auto-select service/barber when pre-selected via param
  const services = shop?.services ?? [];
  const barberPreselected = !!preBarberId;

  if (preBarberId && !selectedBarber && shop?.barbers) {
    const found = shop.barbers.find((b) => b.id === preBarberId);
    if (found) setSelectedBarber(found);
  }
  if (preServiceId && !selectedService) {
    const found = services.find((s) => s.id === preServiceId);
    if (found) {
      setSelectedService(found);
      setStep(barberPreselected ? "datetime" : "barber");
    }
  }

  const { data: avail, isLoading: availLoading } = useQuery({
    queryKey: queryKeys.availability.day({
      shopId: shop?.id ?? "",
      barberId: selectedBarber?.id ?? "",
      serviceId: selectedService?.id ?? "",
      date: selectedDate,
    }),
    queryFn: () => shopsService.availability({
      shopId: shop!.id,
      barberId: selectedBarber!.id,
      serviceId: selectedService!.id,
      date: selectedDate,
    }),
    enabled: step === "datetime" && !!shop && !!selectedBarber && !!selectedService,
    staleTime: 30_000,
  });

  const { mutate: book, isPending } = useMutation({
    mutationFn: () => shopsService.book({
      shopId: shop!.id,
      serviceId: selectedService!.id,
      barberId: selectedBarber!.id,
      date: selectedDate,
      time: selectedTime!,
      name: name.trim(),
      phone: phone.trim(),
      notes: notes.trim() || undefined,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: queryKeys.publicAppointments.byPhone(phone.trim()) });
      haptics.success();
      const label = STATUS_LABEL[data.status] ?? data.status;
      Alert.alert(
        "Randevu Alındı! ✓",
        `${fmtDate(selectedDate)} saat ${selectedTime} için randevunuz oluşturuldu.\n\nDurum: ${label}`,
        [
          {
            text: "Takvime Ekle",
            onPress: async () => {
              await addToCalendar({
                shopName: shop?.name ?? "",
                service: selectedService?.nameTr ?? "",
                barberName: selectedBarber?.nameTr ?? "",
                date: selectedDate,
                time: selectedTime!,
                address: shop?.address ?? undefined,
                phone: shop?.phone ?? undefined,
              });
              router.back();
            },
          },
          { text: "Tamam", onPress: () => router.back() },
        ]
      );
    },
    onError: (e: unknown) => {
      haptics.error();
      // api.ts interceptor builds a clean Error(message) — read .message directly
      const msg = (e instanceof Error ? e.message : null) ?? "Sunucuya bağlanılamadı";
      Alert.alert("Hata", msg);
    },
  });

  const back = () => {
    if (step === "service")  { router.back(); return; }
    if (step === "barber")   { setStep("service"); return; }
    if (step === "datetime") { setStep(barberPreselected ? "service" : "barber"); return; }
    if (step === "contact")  { setStep("datetime"); return; }
    if (step === "summary")  { setStep("contact"); return; }
  };

  const currentStepIdx = STEPS.indexOf(step);
  const availableBarbers = (shop?.barbers ?? []).filter((b) => b.available !== false);

  if (shopLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background, justifyContent: "center", alignItems: "center" }}>
        <Stack.Screen options={{
          headerShown: true,
          headerTitle: "Randevu Al",
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.foreground,
          headerShadowVisible: false,
          gestureEnabled: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: c.primary, fontFamily: Typography.fontFamily.medium, fontSize: 16 }}>Geri</Text>
            </TouchableOpacity>
          ),
        }} />
        <ActivityIndicator color={c.foreground} />
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: shop?.name ?? "Randevu Al",
          gestureEnabled: false,
          headerLeft: () => (
            <TouchableOpacity onPress={back} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="chevron-back" size={24} color={c.foreground} />
            </TouchableOpacity>
          ),
          headerStyle: { backgroundColor: c.background },
          headerTintColor: c.foreground,
          headerTitleStyle: { fontFamily: Typography.fontFamily.semiBold, color: c.foreground, fontSize: 15 },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["bottom"]}>

        {/* ── Step stepper ── */}
        <View style={styles.stepper}>
          {STEPS.map((s, i) => {
            const isDone = i < currentStepIdx;
            const isActive = i === currentStepIdx;
            return (
              <View key={s} style={{ flexDirection: "row", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
                <View style={[
                  styles.stepCircle,
                  {
                    backgroundColor: isDone || isActive ? c.primary : c.card,
                    borderColor: isDone || isActive ? c.primary : c.border,
                  },
                ]}>
                  {isDone ? (
                    <Ionicons name="checkmark" size={12} color={c.primaryForeground} />
                  ) : (
                    <Text style={{
                      fontSize: 11,
                      fontFamily: Typography.fontFamily.semiBold,
                      color: isActive ? c.primaryForeground : c.mutedForeground,
                    }}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                {i < STEPS.length - 1 && (
                  <View style={[styles.stepLine, { backgroundColor: isDone ? c.primary : c.border }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Step label */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
          <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: c.mutedForeground, letterSpacing: 0.8, textTransform: "uppercase" }}>
            {STEP_LABEL[step]}
          </Text>
        </View>

        {/* ── STEP: Service ── */}
        {step === "service" && (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            <Text style={{ fontSize: 19, fontFamily: Typography.fontFamily.bold, color: c.foreground, marginBottom: 4 }}>
              Hangi hizmeti almak istiyorsunuz?
            </Text>
            {(!shop?.services || shop.services.length === 0) && (
              <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular }}>Hizmet bulunamadı</Text>
            )}
            {shop?.services?.map((s) => {
              const isSel = selectedService?.id === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => { haptics.select(); setSelectedService(s); setStep(barberPreselected ? "datetime" : "barber"); }}
                  activeOpacity={0.8}
                  style={[
                    styles.serviceCard,
                    {
                      backgroundColor: isSel ? c.primary : c.card,
                      borderColor: isSel ? c.primary : c.border,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Typography.fontFamily.semiBold, fontSize: 16, color: isSel ? c.primaryForeground : c.foreground }}>
                      {s.nameTr}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <Ionicons name="time-outline" size={13} color={isSel ? c.primaryForeground + "aa" : c.mutedForeground} />
                        <Text style={{ fontFamily: Typography.fontFamily.regular, fontSize: 13, color: isSel ? c.primaryForeground + "aa" : c.mutedForeground }}>
                          {s.duration} dk
                        </Text>
                      </View>
                    </View>
                  </View>
                  <Text style={{ fontFamily: Typography.fontFamily.bold, fontSize: 17, color: isSel ? c.primaryForeground : c.foreground }}>
                    {formatCurrency(s.price)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── STEP: Barber ── */}
        {step === "barber" && (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 10 }}>
            <Text style={{ fontSize: 19, fontFamily: Typography.fontFamily.bold, color: c.foreground, marginBottom: 4 }}>
              Berber seçin
            </Text>
            {availableBarbers.length === 0 && (
              <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular }}>Müsait berber yok</Text>
            )}
            {availableBarbers.map((b) => {
              const isSel = selectedBarber?.id === b.id;
              const photo = b.profilePhoto ?? b.avatar;
              return (
                <TouchableOpacity
                  key={b.id}
                  onPress={() => { haptics.select(); setSelectedBarber(b); setSelectedTime(null); setStep("datetime"); }}
                  activeOpacity={0.8}
                  style={[
                    styles.barberCard,
                    {
                      backgroundColor: isSel ? c.primary : c.card,
                      borderColor: isSel ? c.primary : c.border,
                    },
                  ]}
                >
                  {photo ? (
                    <Image source={{ uri: photo }} style={{ width: 52, height: 52, borderRadius: 26 }} resizeMode="cover" />
                  ) : (
                    <View style={{
                      width: 52, height: 52, borderRadius: 26,
                      backgroundColor: isSel ? "rgba(255,255,255,0.2)" : c.secondary,
                      justifyContent: "center", alignItems: "center",
                    }}>
                      <Text style={{ fontFamily: Typography.fontFamily.bold, fontSize: 20, color: isSel ? c.primaryForeground : c.foreground }}>
                        {b.nameTr.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: Typography.fontFamily.semiBold, fontSize: 16, color: isSel ? c.primaryForeground : c.foreground }}>
                      {b.nameTr}
                    </Text>
                    {(b.rating != null && b.rating > 0) ? (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
                        <Ionicons name="star" size={12} color={isSel ? "#F59E0B" : "#F59E0B"} />
                        <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.medium, color: isSel ? c.primaryForeground : c.foreground }}>
                          {b.rating.toFixed(1)}
                        </Text>
                        {(b.reviewCount ?? 0) > 0 ? (
                          <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: isSel ? c.primaryForeground + "aa" : c.mutedForeground }}>
                            ({b.reviewCount} değerlendirme)
                          </Text>
                        ) : null}
                      </View>
                    ) : null}
                    {(b.yearsExp != null && b.yearsExp > 0) ? (
                      <Text style={{ fontSize: 12, fontFamily: Typography.fontFamily.regular, color: isSel ? c.primaryForeground + "aa" : c.mutedForeground, marginTop: 2 }}>
                        {b.yearsExp} yıl deneyim
                      </Text>
                    ) : null}
                    {b.specialties && b.specialties.length > 0 ? (
                      <Text numberOfLines={1} style={{ fontSize: 11, fontFamily: Typography.fontFamily.regular, color: isSel ? c.primaryForeground + "88" : c.mutedForeground, marginTop: 2 }}>
                        {b.specialties.join(" · ")}
                      </Text>
                    ) : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={isSel ? c.primaryForeground : c.mutedForeground} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ── STEP: Date & Time ── */}
        {step === "datetime" && (
          <View style={{ flex: 1 }}>
            {/* Date strip — fixed height prevents layout jump on first render */}
            <View style={styles.dateStrip}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, gap: 6, alignItems: "center" }}
              >
                {dates.map((d) => {
                  const iso = localISODate(d);
                  const isSel = iso === selectedDate;
                  const label = dateLabel(d, today);
                  return (
                    <TouchableOpacity
                      key={iso}
                      onPress={() => { haptics.select(); setSelectedDate(iso); setSelectedTime(null); }}
                      activeOpacity={0.75}
                      style={[
                        styles.dateCard,
                        {
                          backgroundColor: isSel ? c.primary : c.card,
                          borderColor: isSel ? c.primary : c.border,
                        },
                      ]}
                    >
                      <Text style={{ fontSize: 11, fontFamily: Typography.fontFamily.semiBold, color: isSel ? c.primaryForeground : c.mutedForeground }}>
                        {label}
                      </Text>
                      <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: isSel ? c.primaryForeground : c.foreground, marginTop: 1 }}>
                        {d.getDate()} {TR_MONTHS[d.getMonth()]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Time slots */}
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}>
              <Text style={{ fontSize: 15, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }}>
                {fmtDate(selectedDate)} — müsait saatler
              </Text>
              {availLoading && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <View
                      key={i}
                      style={{
                        width: 72, height: 42, borderRadius: 10,
                        backgroundColor: c.secondary, opacity: 0.6,
                      }}
                    />
                  ))}
                </View>
              )}
              {!availLoading && avail?.holiday && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 12, backgroundColor: "#FEE2E2", borderRadius: 10 }}>
                  <Ionicons name="alert-circle" size={16} color="#B91C1C" />
                  <Text style={{ color: "#B91C1C", fontFamily: Typography.fontFamily.regular, fontSize: 13 }}>
                    Bu gün tatil: {avail.holiday}
                  </Text>
                </View>
              )}
              {!availLoading && !avail?.holiday && (avail?.slots?.length ?? 0) === 0 && (
                <Text style={{ color: c.mutedForeground, fontFamily: Typography.fontFamily.regular, fontSize: 14 }}>
                  Bu gün için müsait saat yok
                </Text>
              )}
              {(avail?.slots?.length ?? 0) > 0 && (
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {avail!.slots.map((slot) => {
                    const isSel = selectedTime === slot;
                    return (
                      <TouchableOpacity
                        key={slot}
                        onPress={() => { haptics.select(); setSelectedTime(slot); }}
                        activeOpacity={0.75}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 10,
                          borderRadius: 10,
                          backgroundColor: isSel ? c.primary : c.card,
                          borderWidth: 1,
                          borderColor: isSel ? c.primary : c.border,
                          minWidth: 72,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ fontFamily: Typography.fontFamily.semiBold, fontSize: 15, color: isSel ? c.primaryForeground : c.foreground }}>
                          {slot}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
              {selectedTime && (
                <TouchableOpacity
                  onPress={() => { haptics.light(); setStep("contact"); }}
                  style={{ backgroundColor: c.primary, borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4 }}
                >
                  <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 16 }}>
                    {selectedTime} — Devam Et
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* ── STEP: Contact ── */}
        {step === "contact" && (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <Text style={{ fontSize: 19, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
              İletişim bilgileri
            </Text>
            {/* Ad */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.foreground, fontSize: 14 }}>
                Ad Soyad <Text style={{ color: c.destructive }}>*</Text>
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Örn: Ahmet Yılmaz"
                placeholderTextColor={c.mutedForeground}
                autoCapitalize="words"
                style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
              />
            </View>
            {/* Telefon */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.foreground, fontSize: 14 }}>
                Telefon <Text style={{ color: c.destructive }}>*</Text>
              </Text>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="5XX XXX XX XX"
                placeholderTextColor={c.mutedForeground}
                keyboardType="phone-pad"
                style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground }]}
              />
            </View>
            {/* Not */}
            <View style={{ gap: 6 }}>
              <Text style={{ fontFamily: Typography.fontFamily.medium, color: c.foreground, fontSize: 14 }}>
                Not (isteğe bağlı)
              </Text>
              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder="Özel bir isteğiniz var mı?"
                placeholderTextColor={c.mutedForeground}
                multiline
                numberOfLines={3}
                style={[styles.input, { backgroundColor: c.input, borderColor: c.border, color: c.foreground, minHeight: 80, textAlignVertical: "top" }]}
              />
            </View>
            <TouchableOpacity
              onPress={() => {
                if (!name.trim() || !phone.trim()) { haptics.warning(); return; }
                haptics.light();
                setStep("summary");
              }}
              disabled={!name.trim() || !phone.trim()}
              style={{
                backgroundColor: !name.trim() || !phone.trim() ? c.border : c.primary,
                borderRadius: 14, paddingVertical: 15, alignItems: "center",
              }}
            >
              <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 16 }}>
                Özete Git
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ── STEP: Summary ── */}
        {step === "summary" && (
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
            <Text style={{ fontSize: 19, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
              Randevu Özeti
            </Text>

            <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
              <SummaryRow c={c} icon="storefront-outline" label="Salon" value={shop?.name ?? ""} divider />
              <SummaryRow c={c} icon="cut-outline" label="Hizmet" value={`${selectedService?.nameTr ?? ""} · ${selectedService?.duration ?? 0} dk`} divider />
              <SummaryRow c={c} icon="person-outline" label="Berber" value={selectedBarber?.nameTr ?? ""} divider />
              <SummaryRow c={c} icon="calendar-outline" label="Tarih" value={fmtDate(selectedDate)} divider />
              <SummaryRow c={c} icon="time-outline" label="Saat" value={selectedTime ?? ""} divider />
              <SummaryRow c={c} icon="wallet-outline" label="Ücret" value={formatCurrency(selectedService?.price ?? 0)} />
            </View>

            <View style={{ backgroundColor: c.card, borderRadius: 16, borderWidth: 1, borderColor: c.border, overflow: "hidden" }}>
              <SummaryRow c={c} icon="person-circle-outline" label="Ad Soyad" value={name} divider />
              <SummaryRow c={c} icon="call-outline" label="Telefon" value={phone} />
            </View>

            <TouchableOpacity
              onPress={() => { haptics.light(); book(); }}
              disabled={isPending}
              style={{
                backgroundColor: isPending ? c.border : c.primary,
                borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4,
              }}
            >
              {isPending ? (
                <ActivityIndicator color={c.primaryForeground} />
              ) : (
                <Text style={{ color: c.primaryForeground, fontFamily: Typography.fontFamily.semiBold, fontSize: 16 }}>
                  Randevuyu Onayla
                </Text>
              )}
            </TouchableOpacity>

            <Text style={{ textAlign: "center", fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, fontSize: 12, lineHeight: 18 }}>
              Randevunuz oluşturulduktan sonra salon sizi onaylayacaktır.
            </Text>
          </ScrollView>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function SummaryRow({
  c, icon, label, value, divider,
}: {
  c: typeof Colors.light;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  divider?: boolean;
}) {
  return (
    <View style={{
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 13,
      borderBottomWidth: divider ? StyleSheet.hairlineWidth : 0,
      borderBottomColor: c.border,
    }}>
      <Ionicons name={icon} size={18} color={c.mutedForeground} />
      <Text style={{ fontSize: 13, fontFamily: Typography.fontFamily.medium, color: c.mutedForeground, width: 70 }}>
        {label}
      </Text>
      <Text style={{ flex: 1, fontSize: 14, fontFamily: Typography.fontFamily.semiBold, color: c.foreground }} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  stepCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  stepLine: {
    flex: 1,
    height: 1.5,
    marginHorizontal: 4,
  },
  // Fixed-height wrapper prevents layout jump when entering the datetime step
  dateStrip: {
    height: 72,
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "transparent",
  },
  dateCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 64,
    borderWidth: 1,
    gap: 2,
  },
  serviceCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  barberCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    fontFamily: "Outfit_400Regular",
  },
});
