import { SheetFrame } from '@/design/components/SheetFrame';
import { useKeyboardOverlap } from '@/design/components/useKeyboardOverlap';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import { BACKDROP } from '@/design/tokens/colors';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ScreenProps = {
  children: React.ReactNode;
  /** A Header. */
  header?: React.ReactNode;
  /** Pinned under the content: the screen's buttons, stacked. */
  footer?: React.ReactNode;
  /** A TabBar. It handles its own bottom inset. */
  tabBar?: React.ReactNode;
  /** The screen is one of the app's tabs: the tab bar below it already clears the bottom inset. */
  tabbed?: boolean;
  /**
   * The content sits in the middle of the space when it fits, and scrolls when it does not:
   * for a message with a picture, which must not be cut off on a short screen.
   */
  centred?: boolean;
  /** Content scrolls by default. Turn off for a single full-height message. */
  scroll?: boolean;
  /** Page margin around the content. Turn off when a child must reach the edges. */
  padded?: boolean;
  /**
   * The screen is a task that rises over the one it was started from: it
   * stops short of the top with rounded corners. On iOS the system stacks it
   * over the screen behind; on Android it is a sheet under a black top
   * edge. Present its route with `SHEET_ROUTE`.
   */
  sheet?: boolean;
  /** The screen has text fields: content and footer move up to stay above the keyboard. */
  keyboardAware?: boolean;
  /** Scrolling puts the keyboard away: for a screen whose results appear under the keyboard as you type. */
  scrollHidesKeyboard?: boolean;
};

/**
 * The screen's sections, one by one. A fragment is opened up, so sections
 * grouped under one condition are still spaced like the rest instead of
 * arriving as a single block with nothing between them.
 */
function sectionsOf(children: React.ReactNode): React.ReactNode[] {
  return React.Children.toArray(children).flatMap((child) =>
    React.isValidElement<{ children?: React.ReactNode }>(child) && child.type === React.Fragment ? sectionsOf(child.props.children) : [child],
  );
}

/**
 * One section of a screen. It arrives a moment after the one above it, rising a little as it
 * fades in. A section that draws nothing (a picker or a dialog that is not open) is taken out of
 * the column, so it does not leave its share of the gap between sections behind as empty space.
 */
function Section({ index, children }: { index: number; children: React.ReactNode }) {
  const styles = useStyles(createStyles);
  const { motion } = useTheme();
  const [empty, setEmpty] = useState(false);
  return (
    <Animated.View
      entering={FadeInDown.duration(motion.enter).delay(Math.min(index, 8) * motion.stagger)}
      style={empty ? styles.emptySection : null}
      onLayout={(e) => setEmpty(e.nativeEvent.layout.height === 0)}
    >
      {children}
    </Animated.View>
  );
}

/** Every screen starts here: page colour, safe areas, header, content, then footer or tab bar. */
export function Screen({ children, header, footer, tabBar, tabbed = false, sheet = false, scroll = true, centred = false, padded = true, keyboardAware = false, scrollHidesKeyboard = false }: ScreenProps) {
  const styles = useStyles(createStyles);
  const keyboard = useKeyboardOverlap(keyboardAware);
  // The insets are read up front and applied as padding. A safe-area view asks for them only
  // after it is first drawn, so a tab opened for the first time showed its header under the
  // status bar for a moment before dropping into place.
  const insets = useSafeAreaInsets();

  // A keyboard left open by the screen beneath (a search field, say) would sit over a task's
  // buttons. A field that wants the keyboard asks for it once the task has arrived.
  useEffect(() => {
    if (sheet) Keyboard.dismiss();
  }, [sheet]);
  // A sheet starts below the top edge; a tab's bar already clears the bottom.
  const clearsTop = !sheet;
  const clearsBottom = sheet || !(tabBar || tabbed);
  const content = padded ? styles.padded : null;
  const arriving = sectionsOf(children).map((child, i) => <Section key={i} index={i}>{child}</Section>);

  const page = (
    <View style={[styles.page, { paddingTop: clearsTop ? insets.top : 0, paddingBottom: (clearsBottom ? insets.bottom : 0) + keyboard }]}>
      {header}
      {scroll ? (
        <ScrollView style={styles.fill} contentContainerStyle={[styles.scrollContent, content, centred ? styles.centred : null]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" keyboardDismissMode={scrollHidesKeyboard ? 'on-drag' : 'none'}>
          {arriving}
        </ScrollView>
      ) : (
        <View style={[styles.fill, content]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
      {tabBar}
    </View>
  );

  // iOS presents the sheet itself, stacked over the screen behind. Android gets a sheet under a black top edge.
  if (!sheet || Platform.OS === 'ios') return page;
  return (
    <View style={styles.behind}>
      <StatusBar style="light" />
      <SheetFrame>{page}</SheetFrame>
    </View>
  );
}

const createStyles = ({ colors, size, space }: Theme) =>
  StyleSheet.create({
    page: { flex: 1, backgroundColor: colors.background },
    // Sheet presentation: the dimmed strip above, then the sheet with rounded top corners.
    behind: { flex: 1, backgroundColor: BACKDROP },
    fill: { flex: 1 },
    padded: { paddingHorizontal: size.screenPadding },
    scrollContent: { paddingTop: space.sm, paddingBottom: space.xxl, gap: size.sectionGap },
    centred: { flexGrow: 1, justifyContent: 'center' },
    // Out of the column, full width, so it is measured again if it starts to draw something.
    emptySection: { position: 'absolute', left: 0, right: 0 },
    footer: { paddingHorizontal: size.screenPadding, paddingTop: space.lg, paddingBottom: space.lg, gap: space.lg },
  });
