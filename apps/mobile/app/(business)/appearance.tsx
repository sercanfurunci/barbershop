import { useState, useEffect } from "react";
import {
  View, Text, ScrollView, Switch, TouchableOpacity,
  useColorScheme, Alert, StyleSheet, ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { api } from "@/services/api";
import { useAuthStore } from "@/store/auth";
import { Colors } from "@/theme/colors";
import type { MobileSettings, CoverStyle } from "@/types/api";

// ─── Default settings ─────────────────────────────────────────────────────────

const DEFAULT: Required<MobileSettings> = {
  coverStyle: "auto",
  barberDisplay: {
    showPhotos: true, showRatings: true, showYearsExp: true,
    showSpecialties: true, showAvailability: true,
    hideInactive: true, showUnavailableDisabled: true,
  },
  serviceDisplay: {
    showPrices: true, showDuration: true,
    showCategories: true, highlightPopular: true,
  },
  sectionVisibility: {
    showReviews: true, showGallery: true, showTeam: true,
    showAddress: true, showInstagram: true, showWhatsapp: true,
    showGoogleRating: false, showInternalRating: true,
  },
};

function merge<T extends object>(defaults: T, overrides?: T | null): T {
  if (!overrides) return defaults;
  return { ...defaults, ...overrides };
}

// ─── UI helpers ───────────────────────────────────────────────────────────────

function Section({ title, children, c }: { title: string; children: React.ReactNode; c: typeof Colors.light }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionLabel, { color: c.mutedForeground }]}>{title}</Text>
      <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

function ToggleRow({ label, hint, value, onChange, last, c }: {
  label: string; hint?: string; value: boolean; onChange: (v: boolean) => void;
  last?: boolean; c: typeof Colors.light;
}) {
  return (
    <View style={[styles.row, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.rowLabel, { color: c.foreground }]}>{label}</Text>
        {hint && <Text style={[styles.rowHint, { color: c.mutedForeground }]}>{hint}</Text>}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: c.primary, false: "#6B7280" }} />
    </View>
  );
}

const COVER_STYLES: { value: CoverStyle; label: string; hint: string }[] = [
  { value: "auto",         label: "Otomatik",     hint: "Kapak → Galeri → Logo gradient" },
  { value: "custom",       label: "Özel Kapak",   hint: "Yüklenen kapak fotoğrafı" },
  { value: "gallery_hero", label: "Galeri Hero",  hint: "Öne çıkan galeri görseli" },
  { value: "logo_hero",    label: "Logo Hero",    hint: "Logo + premium gradient" },
  { value: "no_hero",      label: "Hero Yok",     hint: "Salon bilgisiyle başla" },
];

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AppearanceScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const shopId = user?.shop?.id;

  const { data: shopData, isLoading } = useQuery({
    queryKey: ["mobile-settings", shopId],
    queryFn: async () => {
      const { data } = await api.get("/admin/shop/mobile-settings");
      return data as { mobileSettings: MobileSettings | null; featuredImage: string | null; gallery: string[]; coverImage: string | null };
    },
    enabled: !!shopId,
    staleTime: 30_000,
  });

  const [settings, setSettings] = useState<Required<MobileSettings>>(DEFAULT);
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (shopData) {
      setSettings(merge(DEFAULT, shopData.mobileSettings as Required<MobileSettings>));
      setFeaturedImage(shopData.featuredImage ?? null);
      setDirty(false);
    }
  }, [shopData]);

  function update<K extends keyof Required<MobileSettings>>(
    section: K, key: string, value: boolean | string
  ) {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...(prev[section] as object), [key]: value },
    }));
    setDirty(true);
  }

  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch("/admin/shop/mobile-settings", { mobileSettings: settings, featuredImage });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["mobile-settings", shopId] });
      setDirty(false);
      Alert.alert("Tamam", "Ayarlar kaydedildi.");
    },
    onError: () => Alert.alert("Hata", "Ayarlar kaydedilemedi."),
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
        <Stack.Screen options={{ headerShown: true, title: "Mobil Görünüm", headerBackTitle: "Profil" }} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator color={c.foreground} />
        </View>
      </SafeAreaView>
    );
  }

  const bd = settings.barberDisplay;
  const sd = settings.serviceDisplay;
  const sv = settings.sectionVisibility;
  const gallery = shopData?.gallery ?? [];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={["left","right","bottom"]}>
      <Stack.Screen
        options={{
          headerShown: true, title: "Mobil Görünüm", headerBackTitle: "Profil",
          headerRight: () => dirty ? (
            <TouchableOpacity onPress={() => mutation.mutate()} disabled={mutation.isPending} style={{ marginRight: 4 }}>
              <Text style={{ fontFamily: "Outfit_600SemiBold", color: c.primary, fontSize: 15 }}>
                {mutation.isPending ? "..." : "Kaydet"}
              </Text>
            </TouchableOpacity>
          ) : null,
        }}
      />

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Cover style */}
        <Section title="KAPAK STİLİ" c={c}>
          {COVER_STYLES.map(({ value, label, hint }, i) => (
            <TouchableOpacity
              key={value}
              onPress={() => { setSettings((s) => ({ ...s, coverStyle: value })); setDirty(true); }}
              style={[styles.row, i < COVER_STYLES.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }]}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.rowLabel, { color: c.foreground }]}>{label}</Text>
                <Text style={[styles.rowHint, { color: c.mutedForeground }]}>{hint}</Text>
              </View>
              {settings.coverStyle === value && (
                <Ionicons name="checkmark-circle" size={20} color={c.primary} />
              )}
            </TouchableOpacity>
          ))}
        </Section>

        {/* Featured gallery image */}
        {gallery.length > 0 && (
          <Section title="ÖNE ÇIKAN GÖRSEL" c={c}>
            <View style={[styles.row, { flexWrap: "wrap", gap: 10 }]}>
              {[null, ...gallery].map((url, i) => {
                const isSelected = url === featuredImage;
                return (
                  <TouchableOpacity
                    key={url ?? "auto"}
                    onPress={() => { setFeaturedImage(url); setDirty(true); }}
                    style={[styles.galleryThumb, {
                      backgroundColor: c.secondary,
                      borderColor: isSelected ? c.primary : c.border,
                      borderWidth: isSelected ? 2 : StyleSheet.hairlineWidth,
                    }]}
                  >
                    {url === null ? (
                      <Text style={{ fontFamily: "Outfit_500Medium", fontSize: 10, color: c.mutedForeground, textAlign: "center" }}>
                        Otomatik
                      </Text>
                    ) : (
                      <Text style={{ fontFamily: "Outfit_500Medium", fontSize: 10, color: c.mutedForeground }}>{i}</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.rowHint, { color: c.mutedForeground, padding: 14, paddingTop: 0 }]}>
              Seçilen görsel salon kartlarında ve hero alanında kullanılır.
            </Text>
          </Section>
        )}

        {/* Barber display */}
        <Section title="BERBER GÖRÜNÜMÜ" c={c}>
          <ToggleRow label="Profil fotoğrafları" value={bd.showPhotos!} onChange={(v) => update("barberDisplay","showPhotos",v)} c={c} />
          <ToggleRow label="Puanlar" value={bd.showRatings!} onChange={(v) => update("barberDisplay","showRatings",v)} c={c} />
          <ToggleRow label="Deneyim yılı" value={bd.showYearsExp!} onChange={(v) => update("barberDisplay","showYearsExp",v)} c={c} />
          <ToggleRow label="Uzmanlıklar" value={bd.showSpecialties!} onChange={(v) => update("barberDisplay","showSpecialties",v)} c={c} />
          <ToggleRow label="Müsaitlik durumu" value={bd.showAvailability!} onChange={(v) => update("barberDisplay","showAvailability",v)} c={c} />
          <ToggleRow label="Pasif berberleri gizle" value={bd.hideInactive!} onChange={(v) => update("barberDisplay","hideInactive",v)} c={c} />
          <ToggleRow label="Müsait olmayanları soluk göster" value={bd.showUnavailableDisabled!} onChange={(v) => update("barberDisplay","showUnavailableDisabled",v)} last c={c} />
        </Section>

        {/* Service display */}
        <Section title="HİZMET GÖRÜNÜMÜ" c={c}>
          <ToggleRow label="Fiyatları göster" value={sd.showPrices!} onChange={(v) => update("serviceDisplay","showPrices",v)} c={c} />
          <ToggleRow label="Süreyi göster" value={sd.showDuration!} onChange={(v) => update("serviceDisplay","showDuration",v)} c={c} />
          <ToggleRow label="Kategorileri göster" value={sd.showCategories!} onChange={(v) => update("serviceDisplay","showCategories",v)} c={c} />
          <ToggleRow label="Popüler hizmetleri öne çıkar" value={sd.highlightPopular!} onChange={(v) => update("serviceDisplay","highlightPopular",v)} last c={c} />
        </Section>

        {/* Section visibility */}
        <Section title="SALON SAYFASI BÖLÜMLERİ" c={c}>
          <ToggleRow label="Değerlendirmeler" value={sv.showReviews!} onChange={(v) => update("sectionVisibility","showReviews",v)} c={c} />
          <ToggleRow label="Galeri" value={sv.showGallery!} onChange={(v) => update("sectionVisibility","showGallery",v)} c={c} />
          <ToggleRow label="Ekibimiz" value={sv.showTeam!} onChange={(v) => update("sectionVisibility","showTeam",v)} c={c} />
          <ToggleRow label="Adres" value={sv.showAddress!} onChange={(v) => update("sectionVisibility","showAddress",v)} c={c} />
          <ToggleRow label="Instagram" value={sv.showInstagram!} onChange={(v) => update("sectionVisibility","showInstagram",v)} c={c} />
          <ToggleRow label="WhatsApp" value={sv.showWhatsapp!} onChange={(v) => update("sectionVisibility","showWhatsapp",v)} c={c} />
          <ToggleRow label="Google puanı" value={sv.showGoogleRating!} onChange={(v) => update("sectionVisibility","showGoogleRating",v)} c={c} />
          <ToggleRow label="Salon içi puanı" value={sv.showInternalRating!} onChange={(v) => update("sectionVisibility","showInternalRating",v)} last c={c} />
        </Section>

        {dirty && (
          <TouchableOpacity
            onPress={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={[styles.saveBtn, { backgroundColor: c.primary }]}
          >
            <Text style={[styles.saveBtnText, { color: c.primaryForeground }]}>
              {mutation.isPending ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:   { flex: 1 },
  scroll:      { padding: 20, gap: 20, paddingBottom: 48 },
  section:     { gap: 8 },
  sectionLabel: { fontFamily: "Outfit_600SemiBold", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, paddingHorizontal: 4 },
  card:        { borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  row:         { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  rowLabel:    { fontFamily: "Outfit_600SemiBold", fontSize: 14 },
  rowHint:     { fontFamily: "Outfit_400Regular", fontSize: 12 },
  galleryThumb: { width: 60, height: 60, borderRadius: 8, justifyContent: "center", alignItems: "center" },
  saveBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontFamily: "Outfit_700Bold", fontSize: 15 },
});
