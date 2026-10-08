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
  /** Replace the back button, or add actions on the right (IconButton). */
  left?: React.ReactNode;
  right?: React.ReactNode;
};

/** The bar at the top of a screen or sheet: centred title between icon actions. */
export function Header({ title, task = false, onBack, onClose, backLabel = 'Back', closeLabel = 'Close', left, right }: HeaderProps) {
  const { colors, size } = useTheme();
  const styles = useStyles(createStyles);
  // Each side takes the width of the wider one, so the title is centred on the
  // screen however many actions sit either side of it.
  const [widths, setWidths] = useState({ left: 0, right: 0 });
  const side = { minWidth: Math.max(widths.left, widths.right) };
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
      {task ? <Divider /> : null}
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
  });
