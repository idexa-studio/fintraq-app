import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Spinner } from '@/design/components/Spinner';
import { Text } from '@/design/components/Text';
import { Touchable } from '@/design/components/Touchable';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'link' | 'danger';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  /**
   * primary: solid, the way forward. secondary: outlined, the alternative.
   * text: bare bold label, a quiet way out. link: underlined, goes elsewhere.
   * danger: solid red, destroys something.
   */
  variant?: ButtonVariant;
  size?: 'md' | 'sm';
  icon?: IconName;
  /** Shown as unavailable and not pressable. */
  disabled?: boolean;
  /** Work is in progress: keeps its colour, swaps the label for a spinner, ignores presses. */
  loading?: boolean;
  /** Buttons fill the width by default, as in the reference. */
  fullWidth?: boolean;
  accessibilityHint?: string;
};

export function Button({ label, onPress, variant = 'primary', size = 'md', icon, disabled = false, loading = false, fullWidth = true, accessibilityHint }: ButtonProps) {
  const { colors, size: sizes } = useTheme();
  const styles = useStyles(createStyles);
  const solid = variant === 'primary' || variant === 'danger';
  const fill = disabled ? colors.disabled : variant === 'danger' ? colors.danger : colors.action;
  const content = disabled ? colors.onDisabled : variant === 'danger' ? (solid ? colors.onDanger : colors.danger) : solid ? colors.onAction : colors.text;

  return (
    <Touchable
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled, busy: loading }}
      hitSlop={size === 'sm' ? (sizes.minTouch - sizes.buttonSmall) / 2 : undefined}
      style={[
        styles.base,
        { minHeight: size === 'sm' ? sizes.buttonSmall : sizes.button },
        solid ? { backgroundColor: fill } : null,
        variant === 'secondary' ? [styles.outlined, { borderColor: disabled ? colors.disabled : colors.border }] : null,
        fullWidth ? styles.fullWidth : styles.hug,
      ]}
    >
      {loading ? (
        <Spinner size={sizes.icon} color={content} />
      ) : (
        <View style={styles.content}>
          {icon ? <Icon name={icon} size={sizes.iconSmall} color={content} /> : null}
          <Text variant={size === 'sm' ? 'calloutStrong' : 'action'} underline={variant === 'link'} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75} style={{ color: content, flexShrink: 1 }}>
            {label}
          </Text>
        </View>
      )}
    </Touchable>
  );
}

const createStyles = ({ radius, space, border }: Theme) =>
  StyleSheet.create({
    base: { borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg, paddingVertical: space.xs },
    outlined: { borderWidth: border.thin },
    fullWidth: { alignSelf: 'stretch' },
    hug: { alignSelf: 'flex-start' },
    content: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  });
