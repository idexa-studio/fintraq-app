import { useTheme } from '@/src/providers/ThemeProvider';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
  DimensionValue,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaProvider } from 'react-native-safe-area-context';

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

// Spring options matching Bento MD3 feel
const SPRING_CONFIG = {
  tension: 65,
  friction: 11,
  useNativeDriver: true,
};

const TIMING_CONFIG = {
  duration: 220,
  useNativeDriver: true,
};

const BottomSheetContent = React.memo(function BottomSheetContent({
  children,
  resolvedHeight,
  resolvedMaxHeight,
  translateY,
  headerPanResponder,
  contentPanResponder,
  contextValue,
  colors,
}: {
  children: React.ReactNode;
  resolvedHeight: DimensionValue | undefined;
  resolvedMaxHeight: DimensionValue;
  translateY: Animated.Value;
  headerPanResponder: any;
  contentPanResponder: any;
  contextValue: any;
  colors: any;
}) {
  const insets = useSafeAreaInsets();

  const bottomPadding = useMemo(() => {
    if (insets.bottom > 0) {
      return insets.bottom + 12;
    }
    return Platform.OS === 'android' ? 36 : 20;
  }, [insets.bottom]);

  return (
    <Animated.View
      {...contentPanResponder.panHandlers}
      style={[
        styles.sheet,
        {
          backgroundColor: colors.surface,
          height: resolvedHeight,
          maxHeight: resolvedMaxHeight,
          transform: [{ translateY }],
          paddingBottom: bottomPadding,
        },
      ]}
    >
      {/* Header/Drag area */}
      <View {...headerPanResponder.panHandlers} style={styles.dragArea}>
        <View style={[styles.handle, { backgroundColor: colors.text + '24' }]} />
      </View>

      {/* Children content wrapper */}
      <BottomSheetContext.Provider value={contextValue}>
        <View style={styles.content}>{children}</View>
      </BottomSheetContext.Provider>
    </Animated.View>
  );
});

export const BentoBottomSheet = React.memo(function BentoBottomSheet({
  visible,
  onClose,
  children,
  snapPoints,
  enableDynamicSizing = false,
  enablePanDownToClose = true,
  enableBackdropDismiss = true,
}: BentoBottomSheetProps) {
  const { colors, overlay } = useTheme();

  // Internal state to hold the Modal visibility, allowing close animations to complete before unmounting.
  const [modalVisible, setModalVisible] = useState(visible);

  // Track the animation state to prevent loop restarts
  const animState = useRef<'closed' | 'opening' | 'open' | 'closing'>(visible ? 'open' : 'closed');

  // Animation values
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  // Track the scroll offset of any inner scrollable content
  const scrollOffset = useRef(0);

  // Event handler for scrolling content
  const handleScroll = useCallback((event: any) => {
    scrollOffset.current = event.nativeEvent?.contentOffset?.y ?? 0;
  }, []);

  const contextValue = useMemo(() => ({
    onScroll: handleScroll,
  }), [handleScroll]);

  // Open animation helper
  const animateOpen = useCallback(() => {
    if (animState.current === 'open' || animState.current === 'opening') return;
    animState.current = 'opening';
    setModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: TIMING_CONFIG.duration,
        useNativeDriver: TIMING_CONFIG.useNativeDriver,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: SPRING_CONFIG.tension,
        friction: SPRING_CONFIG.friction,
        useNativeDriver: SPRING_CONFIG.useNativeDriver,
      }),
    ]).start(() => {
      animState.current = 'open';
    });
  }, [translateY, backdropOpacity]);

  // Close animation helper
  const animateClose = useCallback(() => {
    if (animState.current === 'closed' || animState.current === 'closing') return;
    animState.current = 'closing';
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      animState.current = 'closed';
      setModalVisible(false);
      onClose();
    });
  }, [translateY, backdropOpacity, onClose]);

  // Sync the `visible` prop with animations
  useEffect(() => {
    if (visible) {
      animateOpen();
    } else {
      animateClose();
    }
  }, [visible, animateOpen, animateClose]);

  const handleBackdropPress = () => {
    if (enableBackdropDismiss) {
      animateClose();
    }
  };

  // Pan Responder for the drag handle area (ALWAYS responds to vertical drag)
  const headerPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => enablePanDownToClose,
      onMoveShouldSetPanResponder: () => enablePanDownToClose,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const remainingPercent = Math.max(0, 1 - gestureState.dy / 300);
          backdropOpacity.setValue(remainingPercent);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              tension: 60,
              friction: 9,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Pan Responder for the content area (intercepts only when swiping down and scrolled to the top)
  const contentPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!enablePanDownToClose) return false;
        
        // Intercept touch if dragging down (dy > 5) and the inner ScrollView is scrolled to the top (scrollOffset <= 0)
        const isDraggingDown = gestureState.dy > 5;
        const isAtTop = scrollOffset.current <= 0;
        return isDraggingDown && isAtTop;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
          const remainingPercent = Math.max(0, 1 - gestureState.dy / 300);
          backdropOpacity.setValue(remainingPercent);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.5) {
          animateClose();
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateY, {
              toValue: 0,
              tension: 60,
              friction: 9,
              useNativeDriver: true,
            }),
            Animated.timing(backdropOpacity, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
      onPanResponderTerminate: () => {
        // Snap back if gesture was cancelled/interrupted by system
        Animated.spring(translateY, {
          toValue: 0,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  // Resolve sheet max height based on snapPoints
  const resolvedMaxHeight = useMemo<DimensionValue>(() => {
    if (!snapPoints || snapPoints.length === 0) return '90%';
    const lastPoint = snapPoints[snapPoints.length - 1];
    return (typeof lastPoint === 'number' ? lastPoint : lastPoint) as DimensionValue;
  }, [snapPoints]);

  // Resolve sheet height based on snapPoints and dynamic sizing
  const resolvedHeight = useMemo<DimensionValue | undefined>(() => {
    if (enableDynamicSizing || !snapPoints || snapPoints.length === 0) return undefined;
    const lastPoint = snapPoints[snapPoints.length - 1];
    return (typeof lastPoint === 'number' ? lastPoint : lastPoint) as DimensionValue;
  }, [snapPoints, enableDynamicSizing]);

  const animatedBackdropStyle = {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: overlay.dim,
    opacity: backdropOpacity,
  };

  return (
    <Modal
      transparent
      visible={modalVisible}
      animationType="none"
      onRequestClose={enablePanDownToClose ? animateClose : undefined}
    >
      <SafeAreaProvider style={{ flex: 1 }}>
        <View style={styles.container}>
          {/* Backdrop */}
          <TouchableWithoutFeedback onPress={handleBackdropPress}>
            <Animated.View style={animatedBackdropStyle} />
          </TouchableWithoutFeedback>

          {/* Bottom Sheet Box */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardAvoid}
          >
            <BottomSheetContent
              resolvedHeight={resolvedHeight}
              resolvedMaxHeight={resolvedMaxHeight}
              translateY={translateY}
              headerPanResponder={headerPanResponder}
              contentPanResponder={contentPanResponder}
              contextValue={contextValue}
              colors={colors}
            >
              {children}
            </BottomSheetContent>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaProvider>
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
