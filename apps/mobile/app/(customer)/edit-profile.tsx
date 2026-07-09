import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  useColorScheme,
  StyleSheet,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";
import { customerService } from "@/services/customer";
import { useAuthStore } from "@/store/auth";
import { api } from "@/services/api";
import { haptics } from "@/utils/haptics";

const GENDER_OPTIONS = [
  { value: "UNSPECIFIED", label: "Belirtmek istemiyorum" },
  { value: "MALE", label: "Erkek" },
  { value: "FEMALE", label: "Kadın" },
  { value: "OTHER", label: "Diğer" },
];

export default function EditProfileScreen() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [birthday, setBirthday] = useState(
    (user as unknown as { birthday?: string | null })?.birthday ?? ""
  );
  const [gender, setGender] = useState(
    (user as unknown as { gender?: string | null })?.gender ?? "UNSPECIFIED"
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("İzin Gerekli", "Fotoğraf galerisine erişim izni verilmedi.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploading(true);
    try {
      // Get signed upload params
      const { data: sign } = await api.post("/uploads/sign", { kind: "customer-avatar" });

      // Upload to Cloudinary
      const formData = new FormData();
      const asset = result.assets[0];
      formData.append("file", { uri: asset.uri, type: "image/jpeg", name: "avatar.jpg" } as unknown as Blob);
      formData.append("api_key", sign.api_key);
      formData.append("timestamp", String(sign.timestamp));
      formData.append("signature", sign.signature);
      formData.append("public_id", sign.public_id);
      formData.append("eager", sign.eager);
      formData.append("overwrite", "true");

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloud_name}/image/upload`, {
        method: "POST",
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const url: string = uploadData.eager?.[0]?.secure_url ?? uploadData.secure_url;
      if (!url) throw new Error("URL alınamadı");

      setAvatarUrl(url);
      haptics.success();
    } catch (e) {
      Alert.alert("Hata", "Fotoğraf yüklenemedi.");
    } finally {
      setUploading(false);
    }
  };

  const onSave = async () => {
    if (!displayName.trim()) {
      setError("Ad soyad boş bırakılamaz.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const updated = await customerService.updateProfile({
        displayName: displayName.trim(),
        phone: phone.trim() || null,
        birthday: birthday.trim() || null,
        gender: gender || null,
        avatarUrl: avatarUrl || null,
      });
      // Merge updated profile data into auth store user
      setUser({ ...user!, displayName: updated.displayName } as typeof user);
      Alert.alert("Başarılı", "Profilin güncellendi.", [{ text: "Tamam", onPress: () => router.back() }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Profil güncellenemedi.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "Profili Düzenle",
          headerTitleStyle: { fontFamily: Typography.fontFamily.semiBold, fontSize: 17, color: c.foreground },
          headerStyle: { backgroundColor: c.background },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 16 }}
            >
              <Ionicons name="chevron-back" size={24} color={c.foreground} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: c.background }} edges={["bottom"]}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            contentContainerStyle={{ padding: 24, gap: 20 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Avatar picker */}
            <View style={{ alignItems: "center", marginBottom: 4 }}>
              <TouchableOpacity onPress={pickAvatar} activeOpacity={0.8} disabled={uploading}>
                <View style={[styles.avatarWrap, { backgroundColor: c.secondary, borderColor: c.border }]}>
                  {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <Text style={{ fontSize: 32, fontFamily: Typography.fontFamily.bold, color: c.foreground }}>
                      {displayName.trim() ? displayName.trim().charAt(0).toUpperCase() : "M"}
                    </Text>
                  )}
                  {uploading ? (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color="#fff" />
                    </View>
                  ) : (
                    <View style={[styles.avatarBadge, { backgroundColor: c.primary }]}>
                      <Ionicons name="camera" size={14} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
              <Text style={{ marginTop: 8, fontSize: 13, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground }}>
                Fotoğrafı Değiştir
              </Text>
            </View>

            {/* Ad soyad */}
            <InputField
              c={c}
              label="Ad Soyad"
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Ahmet Yılmaz"
              autoComplete="name"
              textContentType="name"
            />

            {/* Telefon */}
            <InputField
              c={c}
              label="Telefon"
              value={phone}
              onChangeText={setPhone}
              placeholder="0555 123 45 67"
              keyboardType="phone-pad"
              autoComplete="tel"
              textContentType="telephoneNumber"
            />

            {/* Doğum tarihi */}
            <InputField
              c={c}
              label="Doğum Tarihi"
              value={birthday}
              onChangeText={setBirthday}
              placeholder="GG/AA/YYYY"
              // TODO: Replace with a proper date picker (e.g., @react-native-community/datetimepicker)
            />

            {/* Cinsiyet */}
            <View>
              <Text style={[styles.label, { color: c.foreground }]}>Cinsiyet</Text>
              <View style={[styles.genderGroup, { backgroundColor: c.card, borderColor: c.border }]}>
                {GENDER_OPTIONS.map((opt, i) => (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => setGender(opt.value)}
                    activeOpacity={0.7}
                    style={[
                      styles.genderRow,
                      {
                        borderBottomWidth: i < GENDER_OPTIONS.length - 1 ? StyleSheet.hairlineWidth : 0,
                        borderBottomColor: c.border,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 15, fontFamily: Typography.fontFamily.regular, color: c.foreground }}>
                      {opt.label}
                    </Text>
                    {gender === opt.value ? (
                      <Ionicons name="checkmark" size={20} color={c.foreground} />
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={[styles.errorText, { color: c.destructive }]}>{error}</Text>
              </View>
            ) : null}

            {/* Save button */}
            <TouchableOpacity
              onPress={onSave}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.saveBtn, { backgroundColor: c.primary, opacity: loading ? 0.7 : 1 }]}
            >
              {loading ? (
                <ActivityIndicator color={c.primaryForeground} />
              ) : (
                <Text style={[styles.saveBtnLabel, { color: c.primaryForeground }]}>
                  Kaydet
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

function InputField({
  c,
  label,
  ...props
}: { c: typeof Colors.light; label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View>
      <Text style={[styles.label, { color: c.foreground }]}>{label}</Text>
      <TextInput
        style={[styles.input, { borderColor: c.border, color: c.foreground, backgroundColor: c.input }]}
        placeholderTextColor={c.mutedForeground}
        autoCorrect={false}
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    fontFamily: Typography.fontFamily.medium,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: Typography.fontFamily.regular,
  },
  genderGroup: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  genderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    padding: 12,
  },
  errorText: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.regular,
  },
  saveBtn: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnLabel: {
    fontSize: 16,
    fontFamily: Typography.fontFamily.semiBold,
  },
  avatarWrap: {
    width: 88, height: 88, borderRadius: 44,
    borderWidth: 1, justifyContent: "center", alignItems: "center", overflow: "hidden",
  },
  avatarImg: { width: 88, height: 88, borderRadius: 44 },
  avatarOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center",
  },
  avatarBadge: {
    position: "absolute", bottom: 4, right: 4,
    width: 24, height: 24, borderRadius: 12,
    justifyContent: "center", alignItems: "center",
  },
});
