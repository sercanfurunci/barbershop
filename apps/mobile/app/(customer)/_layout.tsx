import { Tabs } from "expo-router";
import { Platform, useColorScheme } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/theme/colors";
import { haptics } from "@/utils/haptics";

export default function CustomerTabLayout() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 8 : 10);

  return (
    <Tabs
      screenListeners={{ tabPress: () => haptics.select() }}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: c.card,
          borderTopColor: c.border,
          borderTopWidth: 0.5,
          height: 64 + bottomPad,
          paddingTop: 8,
          paddingBottom: bottomPad,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarActiveTintColor: c.tabIconSelected,
        tabBarInactiveTintColor: c.tabIconDefault,
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "Outfit_500Medium",
          marginTop: 2,
        },
        tabBarItemStyle: { paddingVertical: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarLabel: "Ana Sayfa",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Ara",
          tabBarLabel: "Ara",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: "Randevularım",
          tabBarLabel: "Randevularım",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoriler",
          tabBarLabel: "Favoriler",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "heart" : "heart-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={size ?? 22} color={color} />
          ),
        }}
      />
      {/* Non-tab screens — hidden from tab bar */}
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
    </Tabs>
  );
}
