import { View, Text, useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

interface Props { title: string; subtitle?: string; }

export function EmptyState({ title, subtitle }: Props) {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  return (
    <View style={{ alignItems: "center", marginTop: 60, paddingHorizontal: 32 }}>
      <Text style={{ fontSize: 16, fontFamily: Typography.fontFamily.semiBold, color: c.foreground, textAlign: "center" }}>{title}</Text>
      {subtitle && <Text style={{ fontSize: 14, fontFamily: Typography.fontFamily.regular, color: c.mutedForeground, marginTop: 6, textAlign: "center" }}>{subtitle}</Text>}
    </View>
  );
}
