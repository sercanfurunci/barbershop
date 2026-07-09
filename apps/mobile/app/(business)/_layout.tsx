import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { useAuthStore } from "@/store/auth";
import { haptics } from "@/utils/haptics";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
function icon(name: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function TabLayout() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const user = useAuthStore((s) => s.user);

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  return (
    <Tabs
      screenListeners={{ tabPress: () => haptics.select() }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Outfit_500Medium",
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen name="index"        options={{ title: "Ana Sayfa",  tabBarIcon: icon("home-outline") }} />
      <Tabs.Screen name="appointments" options={{ title: "Randevular", tabBarIcon: icon("calendar-outline") }} />
      <Tabs.Screen name="calendar"     options={{ title: "Takvim",    tabBarIcon: icon("grid-outline") }} />
      <Tabs.Screen
        name="staff"
        options={{
          title: "Personel",
          href: isAdmin ? undefined : null,
          tabBarIcon: icon("people-outline"),
        }}
      />
      <Tabs.Screen
        name="customers"
        options={{
          title: "Müşteriler",
          href: isAdmin ? undefined : null,
          tabBarIcon: icon("person-add-outline"),
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profil", tabBarIcon: icon("person-outline") }} />
      {/* Non-tab screens pushed within the business stack */}
      <Tabs.Screen name="staff-edit"   options={{ href: null }} />
      <Tabs.Screen name="staff-create" options={{ href: null }} />
      <Tabs.Screen name="appearance"   options={{ href: null }} />
    </Tabs>
  );
}
