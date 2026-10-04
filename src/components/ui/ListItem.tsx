import { BentoPressable } from './BentoPressable';
import { IconAvatar } from './IconAvatar';
import { Switch } from './Switch';
import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { IconSource } from './Icon';
import { Icon } from './Icon';
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

/** Leading tile size — ListGroup uses it to indent dividers under the text column. */
export const LIST_ITEM_LEADING_SIZE = 36;

export type ListItemProps = {
  title: string;
  subtitle?: string;
  /** Right-aligned secondary value, e.g. the current setting. */
  value?: string;
  icon?: IconSource;
  /** Tint for the leading icon tile. Defaults to text colour (or danger when destructive). */
  iconColor?: string;
  /** Custom leading element (PersonAvatar, flag…) — replaces `icon`. */
  leading?: React.ReactNode;
  /** Custom trailing element — replaces chevron / switch / check. */
  trailing?: React.ReactNode;
  onPress?: () => void;
  /** Secondary action (options menu). */
  onLongPress?: () => void;
  /** Renders a Switch; the whole row toggles it. */
  switchValue?: boolean;
  onSwitchChange?: (value: boolean) => void;
  /** Shows a check mark — for single-choice lists. */
  selected?: boolean;
  /** Defaults to true for pressable rows without a switch or selection state. */
  showChevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
};

export const ListItem = React.memo(function ListItem({
  title,
  subtitle,
  value,
  icon,
  iconColor,
  leading,
  trailing,
  onPress,
  onLongPress,
  switchValue,
  onSwitchChange,
  selected,
  showChevron,
  destructive = false,
  disabled = false,
}: ListItemProps) {
  const theme = useTheme();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const hasSwitch = switchValue !== undefined && onSwitchChange !== undefined;
  const handlePress = hasSwitch ? () => onSwitchChange(!switchValue) : onPress;
  const chevron = showChevron ?? (!!onPress && !hasSwitch && selected === undefined && trailing === undefined);
  const accent = destructive ? colors.danger : colors.text;

  const content = (
    <>
      {leading ?? (icon ? (
        <IconAvatar icon={icon} color={iconColor ?? accent} size={LIST_ITEM_LEADING_SIZE} />
      ) : null)}

      <View style={styles.body}>
        <Text variant="bodyStrong" color={accent} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text variant="caption" tone="muted" numberOfLines={2}>{subtitle}</Text> : null}
      </View>

      <View style={styles.trailing}>
        {value ? <Text variant="callout" tone={destructive ? 'danger' : 'muted'} numberOfLines={1}>{value}</Text> : null}
        {trailing}
        {trailing === undefined && (
          hasSwitch ? (
            <Switch value={switchValue} onValueChange={onSwitchChange} disabled={disabled} accessibilityLabel={title} />
          ) : selected ? (
            <Icon name="check-circle" size={22} color={colors.primaryInk} weight="fill" />
          ) : chevron ? (
            <Icon name="chevron-right" size={14} color={alpha(colors.textMuted, 'strong')} weight="bold" />
          ) : null
        )}
      </View>
    </>
  );

  if (!handlePress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <BentoPressable
      onPress={handlePress}
      onLongPress={onLongPress}
      delayLongPress={280}
      disabled={disabled}
      scaleOnPress={false}
      accessibilityRole={hasSwitch ? 'switch' : 'button'}
      accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      accessibilityState={{ disabled, checked: hasSwitch ? switchValue : undefined, selected }}
      style={[styles.row, disabled && styles.disabled]}
    >
      {content}
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      minHeight: layout.minTouchTarget + spacing('3'),
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      backgroundColor: colors.surface,
    },
    body: { flex: 1, gap: spacing('0.5') },
    trailing: { flexDirection: 'row', alignItems: 'center', gap: spacing('2'), flexShrink: 0, maxWidth: '45%' },
    disabled: { opacity: 0.45 },
  });
