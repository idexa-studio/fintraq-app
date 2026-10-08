import { useStyles } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: React.ReactNode;
  /** A Header. */
  header?: React.ReactNode;
  /** Pinned under the content: the screen's buttons, stacked. */
  footer?: React.ReactNode;
  /** A TabBar. It handles its own bottom inset. */
  tabBar?: React.ReactNode;
  /** Content scrolls by default. Turn off for a single full-height message. */
  scroll?: boolean;
  /** Page margin around the content. Turn off when a child must reach the edges. */
  padded?: boolean;
};

/** Every screen starts here: page colour, safe areas, header, content, then footer or tab bar. */
export function Screen({ children, header, footer, tabBar, scroll = true, padded = true }: ScreenProps) {
  const styles = useStyles(createStyles);
  const content = padded ? styles.padded : null;
  return (
    <SafeAreaView style={styles.page} edges={tabBar ? ['top'] : ['top', 'bottom']}>
      {header}
      {scroll ? (
        <ScrollView style={styles.fill} contentContainerStyle={[styles.scrollContent, content]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {tabBar}
    </SafeAreaView>
  );
}

const createStyles = ({ colors, size, space }: Theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background },
    fill: { flex: 1 },
    padded: { paddingHorizontal: size.screenPadding },
    scrollContent: { paddingTop: space.sm, paddingBottom: space.xxl, gap: size.sectionGap },
    footer: { paddingHorizontal: size.screenPadding, paddingTop: space.lg, paddingBottom: space.lg, gap: space.lg },
  });
