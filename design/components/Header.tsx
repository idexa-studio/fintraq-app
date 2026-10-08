import { Divider } from '@/design/components/Divider';
import { IconButton } from '@/design/components/IconButton';
import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

export type HeaderProps = {
  title?: string;
  /** Serif title on a white bar with a hairline below: the head of a sheet or a task. */
  task?: boolean;
  onBack?: () => void;
  onClose?: () => void;
  backLabel?: string;
  closeLabel?: string;
  /** Leave out the hairline under a task header, because something attached follows it (a TabStrip). */
  flush?: boolean;
  /**
   * The top of a tab: the title at the start of the line in the reference's
   * heading size (it sets nothing larger at the top of a page), with the
   * actions at the end. Pushed screens and tasks keep the small centred title.
   */
  large?: boolean;
  /** A quiet line above a large title, e.g. today's date. */
  eyebrow?: string;
  /** Replace the back button, or add actions on the right (IconButton). */
  left?: React.ReactNode;
  right?: React.ReactNode;
};

/** The bar at the top of a screen or sheet: centred title between icon actions. */
export function Header({ title, task = false, flush = false, large = false, eyebrow, onBack, onClose, backLabel = 'Back', closeLabel = 'Close', left, right }: HeaderProps) {
  const { colors, size } = useTheme();
  const styles = useStyles(createStyles);
  // Each side takes the width of the wider one, so the title is centred on the
  // screen however many actions sit either side of it.
  const [widths, setWidths] = useState({ left: 0, right: 0 });
  const side = { minWidth: Math.max(widths.left, widths.right) };
  if (large) {
    return (
      <View style={styles.large}>
        <View style={styles.largeText}>
          {eyebrow ? <Text variant="callout" tone="muted" numberOfLines={1}>{eyebrow}</Text> : null}
          <Text variant="title" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} accessibilityRole="header">{title}</Text>
        </View>
        <View style={styles.actions}>{right}</View>
      </View>
    );
  }
  return (
    <View style={task ? { backgroundColor: colors.surface } : null}>
      <View style={[styles.bar, { minHeight: task ? size.taskHeader : size.header }]}>
        <View style={[styles.side, styles.left, side]}>
          <View style={styles.actions} onLayout={(e) => { const left = e.nativeEvent.layout.width; setWidths((w) => (w.left === left ? w : { ...w, left })); }}>
            {left ?? (onBack ? <IconButton icon="arrow-left" onPress={onBack} accessibilityLabel={backLabel} /> : null)}
          </View>
        </View>
        {title ? (
          <Text variant={task ? 'title' : 'leadStrong'} align="center" numberOfLines={1} accessibilityRole="header" style={styles.title}>{title}</Text>
        ) : <View style={styles.title} />}
        <View style={[styles.side, styles.right, side]}>
          <View style={styles.actions} onLayout={(e) => { const right = e.nativeEvent.layout.width; setWidths((w) => (w.right === right ? w : { ...w, right })); }}>
            {right}
            {onClose ? <IconButton icon="x" onPress={onClose} accessibilityLabel={closeLabel} /> : null}
          </View>
        </View>
      </View>
      {task && !flush ? <Divider /> : null}
    </View>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: size.screenPadding - space.sm },
    side: { flexDirection: 'row', alignItems: 'center' },
    actions: { flexDirection: 'row', alignItems: 'center' },
    left: { justifyContent: 'flex-start' },
    right: { justifyContent: 'flex-end' },
    title: { flex: 1 },
    // The text starts on the page margin; the actions keep the inset of the small header.
    large: { flexDirection: 'row', alignItems: 'center', gap: space.md, minHeight: size.taskHeader, paddingLeft: size.screenPadding, paddingRight: size.screenPadding - space.sm, paddingVertical: space.sm },
    largeText: { flex: 1, gap: space.xxs },
  });
