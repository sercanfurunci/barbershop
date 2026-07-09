import { useRef, useState, useCallback } from "react";
import {
  Modal, View, Text, TouchableOpacity, Dimensions,
  FlatList, StatusBar, StyleSheet, Platform,
} from "react-native";
import { Image } from "expo-image";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withTiming, runOnJS, clamp,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { haptics } from "@/utils/haptics";

const { width: W, height: H } = Dimensions.get("window");
const CLOSE_THRESHOLD = 120;
const SPRING = { damping: 20, stiffness: 200 };

// ─── Single image pane ───────────────────────────────────────────────────────

function ImagePane({ uri, onClose }: { uri: string; onClose: () => void }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const opacity = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = clamp(savedScale.value * e.scale, 0.5, 4); })
    .onEnd(() => {
      if (scale.value < 1) {
        scale.value = withSpring(1, SPRING);
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
      }
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = savedTx.value + e.translationX / scale.value;
      if (scale.value <= 1) {
        // vertical drag to dismiss when not zoomed
        ty.value = savedTy.value + e.translationY;
        opacity.value = clamp(1 - Math.abs(ty.value) / (H / 2), 0.3, 1);
      } else {
        ty.value = savedTy.value + e.translationY / scale.value;
      }
    })
    .onEnd((e) => {
      if (scale.value <= 1 && Math.abs(ty.value) > CLOSE_THRESHOLD) {
        opacity.value = withTiming(0);
        ty.value = withTiming(ty.value > 0 ? H : -H);
        runOnJS(onClose)();
        return;
      }
      if (scale.value <= 1) {
        ty.value = withSpring(0, SPRING);
        tx.value = withSpring(0, SPRING);
        opacity.value = withTiming(1);
      }
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (scale.value > 1) {
        scale.value = withSpring(1, SPRING);
        tx.value = withSpring(0, SPRING);
        ty.value = withSpring(0, SPRING);
        savedScale.value = 1;
        savedTx.value = 0;
        savedTy.value = 0;
      } else {
        scale.value = withSpring(2.5, SPRING);
        savedScale.value = 2.5;
      }
      runOnJS(haptics.light)();
    });

  const composed = Gesture.Simultaneous(pinch, Gesture.Race(doubleTap, pan));

  const imgStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.pane, imgStyle]}>
        <Image
          source={{ uri }}
          style={{ width: W, height: H }}
          contentFit="contain"
          transition={200}
        />
      </Animated.View>
    </GestureDetector>
  );
}

// ─── Gallery viewer modal ─────────────────────────────────────────────────────

interface Props {
  images: string[];
  initialIndex?: number;
  visible: boolean;
  onClose: () => void;
}

export function GalleryViewer({ images, initialIndex = 0, visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const listRef = useRef<FlatList>(null);

  const handleClose = useCallback(() => {
    haptics.light();
    onClose();
  }, [onClose]);

  // initialScrollIndex only fires on first mount. When the modal re-opens
  // with a different index, we must imperatively scroll to the right image.
  const scrollToInitial = useCallback(() => {
    setIndex(initialIndex);
    // requestAnimationFrame gives FlatList time to lay out before scrolling
    requestAnimationFrame(() => {
      listRef.current?.scrollToIndex({ index: initialIndex, animated: false });
    });
  }, [initialIndex]);

  const onViewRef = useRef(({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
    if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
  });
  const viewConfig = useRef({ itemVisiblePercentThreshold: 51 });

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent transparent onShow={scrollToInitial}>
      <StatusBar hidden />
      <GestureHandlerRootView style={styles.root}>
        <View style={styles.root}>
          <FlatList
            ref={listRef}
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            initialScrollIndex={initialIndex}
            getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
            onViewableItemsChanged={onViewRef.current}
            viewabilityConfig={viewConfig.current}
            renderItem={({ item }) => <ImagePane uri={item} onClose={handleClose} />}
          />

          {/* Close button */}
          <TouchableOpacity
            onPress={handleClose}
            style={[styles.closeBtn, { top: insets.top + 12 }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Counter */}
          {images.length > 1 && (
            <View style={[styles.counter, { bottom: insets.bottom + 20 }]}>
              <Text style={styles.counterText}>{index + 1} / {images.length}</Text>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#000" },
  pane:        { width: W, height: H, justifyContent: "center", alignItems: "center" },
  closeBtn:    { position: "absolute", right: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  counter:     { position: "absolute", alignSelf: "center", backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  counterText: { color: "#fff", fontFamily: Platform.OS === "ios" ? "System" : "sans-serif", fontSize: 14 },
});
