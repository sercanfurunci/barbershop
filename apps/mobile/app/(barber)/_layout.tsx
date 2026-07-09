import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "@/theme/colors";
import { haptics } from "@/utils/haptics";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function icon(name: IoniconsName) {
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} size={size} color={color} />
  );
}

export default function BarberLayout() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];

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
        tabBarLabelStyle: { fontSize: 11, fontFamily: "Outfit_500Medium", marginBottom: 4 },
      }}
    >
      <Tabs.Screen name="index"    options={{ title: "Bugün",   tabBarIcon: icon("today-outline") }} />
      <Tabs.Screen name="calendar" options={{ title: "Takvim",  tabBarIcon: icon("calendar-outline") }} />
      <Tabs.Screen name="earnings" options={{ title: "Kazanç",  tabBarIcon: icon("wallet-outline") }} />
      <Tabs.Screen name="profile"  options={{ title: "Profil",  tabBarIcon: icon("person-outline") }} />
    </Tabs>
  );
}
