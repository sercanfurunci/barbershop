import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";

export default function AuthLayout() {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors[scheme].background },
      }}
    />
  );
}
