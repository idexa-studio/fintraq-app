import { ThemeColors, useTheme } from '@/src/providers/ThemeProvider';
import * as Haptics from 'expo-haptics';
import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Dimensions,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
  KeyboardAvoidingView,
  DimensionValue,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Reanimated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// Bottom sheet scroll context to track nested ScrollView/FlatList scroll offsets
export const BottomSheetContext = createContext<{
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
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

type BottomSheetContentHandle = { close: () => void };

// ─── Inner content (inside Modal, rendered per-open cycle) ───────────────────

const BottomSheetContent = forwardRef<BottomSheetContentHandle, {
  children: React.ReactNode;
  resolvedHeight: DimensionValue | undefined;
  resolvedMaxHeight: DimensionValue;
  onDismiss: () => void;
  onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  colors: ThemeColors;
  enablePanDownToClose: boolean;
}>(function BottomSheetContent({
  children,
  resolvedHeight,
  resolvedMaxHeight,
  onDismiss,
  colors,
  enablePanDownToClose,
}, ref) {
  const { radius } = useTheme();

  // Reanimated shared values — run on UI thread, no bridge round-trip
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  // Shared value so gesture worklet (UI thread) can read scroll position
  const scrollOffset = useSharedValue(0);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.value = event.nativeEvent.contentOffset.y;
  }, [scrollOffset]);

  const contextValue = useMemo(() => ({ onScroll: handleScroll }), [handleScroll]);

  // ── Open animation on mount ──────────────────────────────────────────────
  useEffect(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    translateY.value = withSpring(0, SPRING_CONFIG);
    backdropOpacity.value = withTiming(1, { duration: 200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Close helper (called from JS thread or via imperative ref) ───────────
  const animateClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 220 });
    backdropOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished) {
        runOnJS(onDismiss)();
      }
    });
  }, [translateY, backdropOpacity, onDismiss]);

  // Expose close() so BentoBottomSheet can trigger animated close when
  // visible goes false externally (e.g. picker item selected).
  useImperativeHandle(ref, () => ({ close: animateClose }), [animateClose]);

  // ── Pan gesture — RNGH, cooperates with Swipeable rows ───────────────────
  const startY = useSharedValue(0);

  const dragGesture = Gesture.Pan()
    .enabled(enablePanDownToClose)
    .activeOffsetY(4)
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

  const staticSheetStyle = useMemo(() => ({
    height: resolvedHeight,
    maxHeight: resolvedMaxHeight,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius('2xl'),
    borderTopRightRadius: radius('2xl'),
  }), [resolvedHeight, resolvedMaxHeight, colors.surface, radius]);

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    opacity: backdropOpacity.value,
  }));

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
        <Reanimated.View style={[styles.sheet, staticSheetStyle, animatedSheetStyle]}>
          {/* Only the handle area drags the sheet; content scrolls natively */}
          <GestureDetector gesture={dragGesture}>
            <View style={styles.dragArea} collapsable={false}>
              <View style={[styles.handle, { backgroundColor: colors.text + '24' }]} />
            </View>
          </GestureDetector>

          {/* Children */}
          <BottomSheetContext.Provider value={contextValue}>
            <SafeAreaView edges={['bottom']} style={styles.safeContent}>
              <View style={styles.content}>{children}</View>
            </SafeAreaView>
          </BottomSheetContext.Provider>
        </Reanimated.View>
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

  const [modalVisible, setModalVisible] = useState(visible);
  const [contentKey, setContentKey] = useState(0);

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Ref to BottomSheetContent so we can trigger animated close imperatively
  const contentRef = useRef<BottomSheetContentHandle>(null);

  useEffect(() => {
    if (visible) {
      setContentKey((k) => k + 1);
      setModalVisible(true);
    } else if (modalVisible) {
      // visible went false externally (picker item selected, etc.)
      // trigger animated close on the content
      contentRef.current?.close();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setModalVisible(false);
    onCloseRef.current();
  }, []);

  const { height: windowHeight } = useWindowDimensions();

  // Percent heights resolve against an auto-height parent (collapse to content),
  // so convert them to absolute pixels from the window height.
  const toPixels = useCallback(
    (value: string | number): DimensionValue => {
      if (typeof value === 'string' && value.endsWith('%')) {
        return Math.round((parseFloat(value) / 100) * windowHeight);
      }
      return value as DimensionValue;
    },
    [windowHeight],
  );

  const resolvedMaxHeight = useMemo<DimensionValue>(() => {
    if (!snapPoints || snapPoints.length === 0) return Math.round(windowHeight * 0.9);
    return toPixels(snapPoints[snapPoints.length - 1]);
  }, [snapPoints, toPixels, windowHeight]);

  const resolvedHeight = useMemo<DimensionValue | undefined>(() => {
    if (enableDynamicSizing || !snapPoints || snapPoints.length === 0) return undefined;
    return toPixels(snapPoints[snapPoints.length - 1]);
  }, [snapPoints, enableDynamicSizing, toPixels]);

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
          ref={contentRef}
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
    overflow: 'hidden',
    width: '100%',
    flexShrink: 1,
  },
  dragArea: {
    width: '100%',
    height: 40,
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
  safeContent: {
    flexShrink: 1,
    flexGrow: 1,
  },
});
