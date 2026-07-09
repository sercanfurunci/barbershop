import { useEffect, useRef } from "react";
import { Animated, View, ViewStyle, useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonBox({ width = "100%", height = 16, borderRadius = 8, style }: SkeletonBoxProps) {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: c.secondary,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function ShopCardSkeleton({ c }: { c: typeof Colors.light }) {
  return (
    <View
      style={{
        backgroundColor: c.card,
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: c.border,
        flexDirection: "row",
        gap: 12,
        alignItems: "center",
      }}
    >
      <SkeletonBox width={80} height={80} borderRadius={10} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox width={"70%"} height={16} borderRadius={6} />
        <SkeletonBox width={"45%"} height={12} borderRadius={6} />
        <SkeletonBox width={"55%"} height={12} borderRadius={6} />
      </View>
    </View>
  );
}

export function AppointmentCardSkeleton({ c }: { c: typeof Colors.light }) {
  return (
    <View style={{ backgroundColor: c.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: c.border, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
        <SkeletonBox width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width={"60%"} height={15} borderRadius={6} />
          <SkeletonBox width={"40%"} height={12} borderRadius={6} />
        </View>
        <SkeletonBox width={70} height={24} borderRadius={99} />
      </View>
      <View style={{ height: 1, backgroundColor: c.border }} />
      <View style={{ flexDirection: "row", gap: 20 }}>
        <SkeletonBox width={110} height={13} borderRadius={6} />
        <SkeletonBox width={50} height={13} borderRadius={6} />
      </View>
    </View>
  );
}

export function PremiumShopCardSkeleton({ c, width }: { c: typeof Colors.light; width: number }) {
  return (
    <View
      style={{
        width,
        backgroundColor: c.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: c.border,
        overflow: "hidden",
      }}
    >
      <SkeletonBox width={"100%"} height={140} borderRadius={0} />
      <View style={{ padding: 12, gap: 8 }}>
        <SkeletonBox width={"75%"} height={16} borderRadius={6} />
        <SkeletonBox width={"45%"} height={12} borderRadius={6} />
        <SkeletonBox width={"60%"} height={12} borderRadius={6} />
      </View>
    </View>
  );
}
