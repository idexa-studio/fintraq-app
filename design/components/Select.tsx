import { Chip } from '@/design/components/Chip';
import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, View, useWindowDimensions } from 'react-native';

export type SelectOption<K extends string = string> = {
  key: K;
  /** Shown on the chip and in the list, e.g. "USD". */
  label: string;
  /** Extra words in the list only, e.g. "US dollar". */
  detail?: string;
};

export type SelectProps<K extends string = string> = {
  options: SelectOption<K>[];
  value: K;
  onChange?: (key: K) => void;
  /** What is being chosen, for screen readers, e.g. "Currency". */
  accessibilityLabel: string;
  /** Draws the chip in black whatever the scheme, for use on the green wave card. */
  onBrand?: boolean;
};

type Anchor = { x: number; y: number; width: number; height: number };

/** Width of the list, and how many rows show before it scrolls. */
const LIST_WIDTH = 240;
const MAX_ROWS = 6;

/**
 * A small dropdown: a chip showing the current choice that opens a list right
 * under itself. For a handful of short options (a currency, a period) where a
 * full sheet would be too much. Longer lists belong in a Sheet with an OptionList.
 */
export function Select<K extends string>({ options, value, onChange, accessibilityLabel, onBrand = false }: SelectProps<K>) {
  const { space, size } = useTheme();
  const styles = useStyles(createStyles);
  const window = useWindowDimensions();
  const anchorRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const current = options.find((o) => o.key === value);

  // Android measures from below the status bar, but the list is drawn in a window that starts above it.
  const statusBar = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
  const open = () => anchorRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y: y + statusBar, width, height }));
  const close = () => setAnchor(null);

  const listHeight = Math.min(options.length, MAX_ROWS) * size.minTouch;
  // Opens below the chip, or above it when there is no room below.
  const below = anchor ? anchor.y + anchor.height + space.xs + listHeight < window.height - space.xl : true;

  return (
    <>
      <View ref={anchorRef} collapsable={false}>
        <Chip menu onBrand={onBrand} label={current?.label ?? ''} onPress={open} accessibilityLabel={`${accessibilityLabel}: ${current?.label ?? ''}`} />
      </View>
      <Modal visible={!!anchor} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" accessibilityRole="button" />
        {anchor ? (
          <View
            accessibilityRole="menu"
            style={[
              styles.list,
              { right: Math.max(space.sm, window.width - (anchor.x + anchor.width)), maxHeight: listHeight + 2 },
              below ? { top: anchor.y + anchor.height + space.xs } : { bottom: window.height - anchor.y + space.xs },
            ]}
          >
            <ScrollView bounces={false}>
              {options.map((option) => {
                const selected = option.key === value;
                return (
                  <Touchable
                    key={option.key}
                    onPress={() => { close(); onChange?.(option.key); }}
                    accessibilityRole="menuitem"
                    accessibilityLabel={option.detail ? `${option.label}, ${option.detail}` : option.label}
                    accessibilityState={{ selected }}
                    style={styles.option}
                  >
                    <Text variant={selected ? 'bodyStrong' : 'body'}>{option.label}</Text>
                    {option.detail ? <Text variant="callout" tone="muted" numberOfLines={1} style={styles.detail}>{option.detail}</Text> : <View style={styles.detail} />}
                    {selected ? <Icon name="tick" size={size.iconSmall} /> : <View style={{ width: size.iconSmall }} />}
                  </Touchable>
                );
              })}
            </ScrollView>
          </View>
        ) : null}
      </Modal>
    </>
  );
}

const createStyles = ({ colors, radius, size, space, border }: Theme) =>
  StyleSheet.create({
    // No shadow anywhere in the system: the list is set off by its outline.
    list: { position: 'absolute', width: LIST_WIDTH, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: border.thin, borderColor: colors.border, overflow: 'hidden' },
    option: { minHeight: size.minTouch, flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.lg },
    detail: { flex: 1 },
  });
