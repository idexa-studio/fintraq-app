import { useTheme } from '@/design';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Button navigation is about 48dp tall; gesture navigation is a thin handle (24dp at most). */
const BUTTON_NAV_MIN_INSET = 32;

/**
 * A page-coloured strip behind Android's three-button navigation bar. The app draws edge to edge,
 * so without it scrolling content shows through the bar's translucent scrim as ghosted text under
 * the buttons. Gesture navigation is left alone: content running under a thin handle is the
 * intended edge-to-edge look. Mounted once, at the root.
 */
export const SystemNavBackdrop = React.memo(function SystemNavBackdrop() {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  if (Platform.OS !== 'android' || bottom < BUTTON_NAV_MIN_INSET) return null;
  return <View pointerEvents="none" style={[styles.strip, { height: bottom, backgroundColor: colors.background }]} />;
});

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
