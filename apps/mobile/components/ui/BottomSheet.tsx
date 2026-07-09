import { useEffect } from "react";
import {
  Modal, View, Text, Pressable, StyleSheet, Dimensions,
} from "react-native";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, runOnJS,
} from "react-native-reanimated";
import {
  GestureDetector, Gesture, GestureHandlerRootView,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { Colors } from "@/theme/colors";
import { Typography } from "@/theme/typography";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;
const CLOSE_THRESHOLD = 80;
const CLOSE_VELOCITY = 500;

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  const scheme = (useColorScheme() ?? "light") as "light" | "dark";
  const c = Colors[scheme];
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(MAX_SHEET_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  const springConfig = { damping: 20, stiffness: 200 };

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, springConfig);
      backdropOpacity.value = withSpring(1, springConfig);
    } else {
      translateY.value = withSpring(MAX_SHEET_HEIGHT, springConfig);
      backdropOpacity.value = withSpring(0, springConfig);
    }
  }, [visible]);

  const close = () => {
    translateY.value = withSpring(MAX_SHEET_HEIGHT, springConfig, () => runOnJS(onClose)());
    backdropOpacity.value = withSpring(0, springConfig);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
        backdropOpacity.value = Math.max(0, 1 - e.translationY / MAX_SHEET_HEIGHT);
      }
    })
    .onEnd((e) => {
      if (e.translationY > CLOSE_THRESHOLD || e.velocityY > CLOSE_VELOCITY) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, springConfig);
        backdropOpacity.value = withSpring(1, springConfig);
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={close}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={styles.root}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        </Animated.View>

        {/* Sheet */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              sheetStyle,
              {
                backgroundColor: c.card,
                maxHeight: MAX_SHEET_HEIGHT,
                paddingBottom: insets.bottom + 16,
              },
            ]}
          >
            {/* Drag handle */}
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: c.border }]} />
            </View>

            {/* Optional title */}
            {title ? (
              <View style={[styles.titleRow, { borderBottomColor: c.border }]}>
                <Text style={[styles.titleText, { color: c.foreground, fontFamily: Typography.fontFamily.semiBold }]}>
                  {title}
                </Text>
              </View>
            ) : null}

            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleText: {
    fontSize: 17,
  },
});
