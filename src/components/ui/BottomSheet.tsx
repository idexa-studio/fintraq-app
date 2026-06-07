import { useTheme } from '@/src/providers/ThemeProvider';
import * as Haptics from 'expo-haptics';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Modal,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  DimensionValue,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { runOnJS, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Bottom sheet scroll context to track nested ScrollView/FlatList scroll offsets
export const BottomSheetContext = createContext<{
  onScroll: (event: any) => void;
} | null>(null);

export const useBottomSheet = () => useContext(BottomSheetContext);

export type BentoBottomSheetProps = {
  visible: boolean;
  onClose: () => void;
  snapPoints?: (string | number)[];
  children: React.ReactNode;
  keyboardBehavior?: 'interactive' | 'extend' | 'fillParent';
  enableDynamicSizing?: boolean;
  enablePanDownToClose?: boolean;
  enableBackdropDismiss?: boolean;
};

const SPRING_CONFIG = {
  damping: 20,
  stiffness: 200,
  mass: 0.8,
  overshootClamping: false,
};

const CLOSE_THRESHOLD_Y = 120;
const CLOSE_THRESHOLD_VY = 800; // px/s in worklet context

// ─── Inner content (inside Modal, rendered per-open cycle) ───────────────────

const BottomSheetContent = React.memo(function BottomSheetContent({
  children,
  resolvedHeight,
  resolvedMaxHeight,
  onDismiss,
  onScroll,
  colors,
  enablePanDownToClose,
}: {
  children: React.ReactNode;
  resolvedHeight: DimensionValue | undefined;
  resolvedMaxHeight: DimensionValue;
  onDismiss: () => void;
  onScroll: (e: any) => void;
  colors: any;
  enablePanDownToClose: boolean;
}) {
  const insets = useSafeAreaInsets();

  const bottomPadding = useMemo(() => {
    if (insets.bottom > 0) return insets.bottom + 12;
    return Platform.OS === 'android' ? 36 : 20;
  }, [insets.bottom]);

  // Reanimated shared values — run on UI thread, no bridge round-trip
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // JS-thread scroll offset (via ref — no state, no re-renders)
  const scrollOffsetRef = useRef(0);

  const handleScroll = useCallback((event: any) => {
    scrollOffsetRef.current = event.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  const contextValue = useMemo(() => ({ onScroll: handleScroll }), [handleScroll]);

  // ── Open animation on mount ──────────────────────────────────────────────
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    translateY.value = withSpring(0, SPRING_CONFIG);
    backdropOpacity.value = withTiming(1, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close helper (called from JS thread) ─────────────────────────────────
  const animateClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 });
    backdropOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  }, [translateY, backdropOpacity, onDismiss]);

  // ── Pan gesture — RNGH, so it cooperates with Swipeable rows ─────────────
  const startY = useSharedValue(0);

  const dragGesture = Gesture.Pan()
    .enabled(enablePanDownToClose)
    .activeOffsetY(8) // start only on downward intent
    .failOffsetY(-8)  // fail if clearly scrolling up
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((e) => {
      const next = startY.value + e.translationY;
      if (next > 0) {
        translateY.value = next;
        const remainingPct = Math.max(0, 1 - next / 300);
        backdropOpacity.value = remainingPct;
      }
    })
    .onEnd((e) => {
      const shouldClose =
        e.translationY > CLOSE_THRESHOLD_Y ||
        e.velocityY > CLOSE_THRESHOLD_VY;

      if (shouldClose) {
        translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 });
        backdropOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
          if (finished) runOnJS(onDismiss)();
        });
      } else {
        translateY.value = withSpring(0, SPRING_CONFIG);
        backdropOpacity.value = withTiming(1, { duration: 150 });
      }
    });

  const animatedSheetStyle = useMemo(() => ({
    transform: [{ translateY: translateY as any }],
    height: resolvedHeight,
    maxHeight: resolvedMaxHeight,
    backgroundColor: colors.surface,
    paddingBottom: bottomPadding,
  }), [translateY, resolvedHeight, resolvedMaxHeight, colors.surface, bottomPadding]);

  const animatedBackdropStyle = useMemo(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    opacity: backdropOpacity as any,
  }), [backdropOpacity]);

  return (
    // GestureHandlerRootView inside the Modal window so RNGH gesture
    // recognizers are registered in the correct UIWindow on iOS.
    <GestureHandlerRootView style={styles.container}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={animateClose}>
        <Reanimated.View style={animatedBackdropStyle} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoid}
      >
        <GestureDetector gesture={dragGesture}>
          <Reanimated.View style={[styles.sheet, animatedSheetStyle]}>
            {/* Handle pill */}
            <View style={styles.dragArea}>
              <View style={[styles.handle, { backgroundColor: colors.text + '24' }]} />
            </View>

            {/* Children */}
            <BottomSheetContext.Provider value={contextValue}>
              <View style={styles.content}>{children}</View>
            </BottomSheetContext.Provider>
          </Reanimated.View>
        </GestureDetector>
      </KeyboardAvoidingView>
    </GestureHandlerRootView>
  );
});

// ─── Public component ────────────────────────────────────────────────────────

export const BentoBottomSheet = React.memo(function BentoBottomSheet({
  visible,
  onClose,
  children,
  snapPoints,
  enableDynamicSizing = false,
  enablePanDownToClose = true,
  enableBackdropDismiss = true,
}: BentoBottomSheetProps) {
  const { colors } = useTheme();

  // Modal-level visibility — we keep the Modal mounted until the close
  // animation finishes, then unmount the entire subtree via key reset.
  const [modalVisible, setModalVisible] = useState(visible);
  // Increment key to fully remount BottomSheetContent on each open cycle
  // so animation shared values reset cleanly.
  const [contentKey, setContentKey] = useState(0);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (visible) {
      // New open cycle — remount content with fresh animation state
      setContentKey((k) => k + 1);
      setModalVisible(true);
    }
    // When visible goes false, the BottomSheetContent's gesture/animation
    // handles closing and calls onDismiss which closes the Modal.
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setModalVisible(false);
    onCloseRef.current();
  }, []);

  const resolvedMaxHeight = useMemo<DimensionValue>(() => {
    if (!snapPoints || snapPoints.length === 0) return '90%';
    const last = snapPoints[snapPoints.length - 1];
    return last as DimensionValue;
  }, [snapPoints]);

  const resolvedHeight = useMemo<DimensionValue | undefined>(() => {
    if (enableDynamicSizing || !snapPoints || snapPoints.length === 0) return undefined;
    const last = snapPoints[snapPoints.length - 1];
    return last as DimensionValue;
  }, [snapPoints, enableDynamicSizing]);

  // When visible goes false externally (parent state changes before animation
  // finishes), we still want to run the close animation. So we pass `visible`
  // into content and let it drive itself.
  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={enablePanDownToClose ? handleDismiss : undefined}
    >
      {modalVisible && (
        <BottomSheetContent
          key={contentKey}
          resolvedHeight={resolvedHeight}
          resolvedMaxHeight={resolvedMaxHeight}
          onDismiss={handleDismiss}
          onScroll={() => {}}
          colors={colors}
          enablePanDownToClose={enablePanDownToClose}
        >
          {children}
        </BottomSheetContent>
      )}
    </Modal>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    width: '100%',
    flexShrink: 1,
  },
  dragArea: {
    width: '100%',
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
  },
  content: {
    flexShrink: 1,
    flexGrow: 1,
  },
});
