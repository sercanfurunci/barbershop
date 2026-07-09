import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  useColorScheme, Alert, StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Colors } from "@/theme/colors";
import { staffService } from "@/services/staff";
import { useAuthStore } from "@/store/auth";
import { queryKeys } from "@/utils/queryKeys";

function Field({ label, value, onChangeText, placeholder, secureTextEntry, autoCapitalize, keyboardType, hint, c }: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string; secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words";
  keyboardType?: "default" | "email-address";
  hint?: string;
  c: typeof Colors.light;
}) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: "Outfit_500Medium", fontSize: 13, color: c.mutedForeground }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground + "88"}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? "sentences"}
        keyboardType={keyboardType ?? "default"}
        style={[styles.input, { backgroundColor: c.card, borderColor: c.border, color: c.foreground }]}
      />
      {hint && <Text style={{ fontFamily: "Outfit_400Regular", fontSize: 11, color: c.mutedForeground }}>{hint}</Text>}
    </View>
  );
}

export default function StaffCreateScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const shopId = user?.shop?.id ?? "";

  const [nameTr,   setNameTr]   = useState("");
  const [slug,     setSlug]     = useState("");
  const [titleTr,  setTitleTr]  = useState("Berber");
  const [avatar,   setAvatar]   = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // Auto-generate slug from name
  function handleNameChange(val: string) {
    setNameTr(val);
    setSlug(
      val.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/ğ/g, "g").replace(/ş/g, "s").replace(/ı/g, "i")
        .replace(/ç/g, "c").replace(/ö/g, "o").replace(/ü/g, "u")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40)
    );
  }

  const mutation = useMutation({
    mutationFn: () => staffService.create({ slug, nameTr, titleTr, avatar: avatar || "https://api.dicebear.com/7.x/initials/png?seed=" + encodeURIComponent(nameTr), email, password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.staff.list(shopId) });
      Alert.alert("Tamam", "Berber oluşturuldu.", [{ text: "Geri Dön", onPress: () => router.back() }]);
    },
    onError: (e: { message?: string }) => {
      Alert.alert("Hata", e?.message ?? "Berber oluşturulamadı.");
    },
  });

  function submit() {
    if (!nameTr.trim() || !slug.trim() || !email.trim() || !password.trim()) {
      Alert.alert("Eksik Bilgi", "Ad, slug, e-posta ve şifre zorunlu.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Hata", "Şifre en az 8 karakter olmalı.");
      return;
    }
    mutation.mutate();
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]} edges={["left","right","bottom"]}>
      <Stack.Screen options={{ headerShown: true, title: "Berber Ekle", headerBackTitle: "Personel" }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardDismissMode="interactive">
          <Text style={[styles.subtitle, { color: c.mutedForeground }]}>
            Berber hesabı oluşturulacak. Giriş bilgileri berberle paylaşın.
          </Text>

          <Field label="Ad Soyad *" value={nameTr} onChangeText={handleNameChange} placeholder="Ahmet Yılmaz" c={c} />
          <Field
            label="Slug *" value={slug} onChangeText={setSlug} placeholder="ahmet-yilmaz"
            autoCapitalize="none"
            hint="Küçük harf, rakam ve tire. Örn: ahmet-yilmaz"
            c={c}
          />
          <Field label="Ünvan" value={titleTr} onChangeText={setTitleTr} placeholder="Berber" c={c} />
          <Field
            label="E-posta *" value={email} onChangeText={setEmail}
            placeholder="ahmet@salon.com" autoCapitalize="none" keyboardType="email-address" c={c}
          />
          <Field
            label="Şifre *" value={password} onChangeText={setPassword}
            placeholder="En az 8 karakter" secureTextEntry autoCapitalize="none" c={c}
          />
          <Field
            label="Profil Fotoğrafı URL" value={avatar} onChangeText={setAvatar}
            placeholder="https://..." autoCapitalize="none"
            hint="Boş bırakırsanız başlangıç harfleri kullanılır."
            c={c}
          />

          <TouchableOpacity
            onPress={submit}
            disabled={mutation.isPending}
            style={[styles.submitBtn, { backgroundColor: c.primary, opacity: mutation.isPending ? 0.6 : 1 }]}
          >
            <Text style={[styles.submitBtnText, { color: c.primaryForeground }]}>
              {mutation.isPending ? "Oluşturuluyor..." : "Berber Oluştur"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1 },
  scroll:        { padding: 20, gap: 18, paddingBottom: 48 },
  subtitle:      { fontFamily: "Outfit_400Regular", fontSize: 13, lineHeight: 20 },
  input: {
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: "Outfit_400Regular", fontSize: 15,
  },
  submitBtn:     { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  submitBtnText: { fontFamily: "Outfit_700Bold", fontSize: 15 },
});
