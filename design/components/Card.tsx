import { Divider } from '@/design/components/Divider';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

export type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  /** Standard padding. Turn off for cards built from full-width rows. */
  padded?: boolean;
  /** Outlined in green: the current or chosen one of several. */
  selected?: boolean;
  /** Paler and without emphasis: not reachable yet. */
  muted?: boolean;
  /** Tighter corners, for a stack of single-row cards. */
  compact?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

/** A white panel on the grey page. No shadow and no border: tone separates it. */
export function Card({ children, onPress, padded = true, selected = false, muted = false, compact = false, accessibilityLabel, style }: CardProps) {
  const { colors, radius } = useTheme();
  const styles = useStyles(createStyles);
  const cardStyle = [
    styles.card,
    { backgroundColor: muted ? colors.surfaceMuted : colors.surface, borderRadius: compact ? radius.sm : radius.md },
    padded ? styles.padded : null,
    style,
  ];
  // Drawn over the content, so selecting a card never moves what is inside it.
  const outline = selected ? <View pointerEvents="none" style={[styles.outline, { borderRadius: compact ? radius.sm : radius.md }]} /> : null;
  if (onPress) {
    return (
      <Touchable onPress={onPress} accessibilityLabel={accessibilityLabel} accessibilityState={{ selected }} style={cardStyle}>
        {children}
        {outline}
      </Touchable>
    );
  }
  return (
    <View accessibilityLabel={accessibilityLabel} style={cardStyle}>
      {children}
      {outline}
    </View>
  );
}

export type CardAction = {
  label: string;
  onPress?: () => void;
  /** Cannot be used now. The card itself says why. */
  disabled?: boolean;
};

export type CardActionsProps = {
  /** One or two; more belong in a menu. */
  actions: CardAction[];
};

/** The actions at the foot of a card, split by hairlines. Place last in an unpadded card. */
export function CardActions({ actions }: CardActionsProps) {
  const styles = useStyles(createStyles);
  return (
    <View>
      <Divider />
      <View style={styles.actions}>
        {actions.map((action, i) => (
          <React.Fragment key={action.label}>
            {i > 0 ? <Divider vertical /> : null}
            <Touchable onPress={action.onPress} disabled={action.disabled} accessibilityLabel={action.label} accessibilityState={{ disabled: !!action.disabled }} style={styles.action}>
              <Text variant="action" tone={action.disabled ? 'disabled' : 'default'} align="center" numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>{action.label}</Text>
            </Touchable>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

const createStyles = ({ colors, size, border, space }: Theme) =>
  StyleSheet.create({
    card: { overflow: 'hidden' },
    padded: { padding: size.cardPadding },
    outline: { ...StyleSheet.absoluteFillObject, borderWidth: border.thick, borderColor: colors.selected },
    actions: { flexDirection: 'row' },
    action: { flex: 1, minHeight: size.cardAction, paddingVertical: space.xs, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.sm },
  });
