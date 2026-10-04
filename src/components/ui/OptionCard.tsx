import { BentoPressable } from './BentoPressable';
import { Badge } from './Badge';
import { Icon, IconSource } from './Icon';
import { IconAvatar } from './IconAvatar';
import { Text } from './Text';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import React, { useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

type OptionCardProps = {
  icon: IconSource;
  title: string;
  description?: string;
  /** Short tag next to the title, e.g. "Recommended". */
  badge?: string;
  selected: boolean;
  onPress: () => void;
  /** Replaces the radio with a spinner while the option is being applied. */
  busy?: boolean;
  disabled?: boolean;
};

/**
 * A large, single-choice option — onboarding choices, backup mode, plan pickers.
 * The radio is always visible so an unselected card still reads as selectable.
 */
export const OptionCard = React.memo(function OptionCard({
  icon,
  title,
  description,
  badge,
  selected,
  onPress,
  busy = false,
  disabled = false,
}: OptionCardProps) {
  const theme = useTheme();
  const { colors, alpha } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <BentoPressable
      onPress={onPress}
      disabled={disabled}
      scaleOnPress
      accessibilityRole="radio"
      accessibilityState={{ checked: selected, disabled }}
      accessibilityLabel={description ? `${title}, ${description}` : title}
      style={[
        styles.card,
        { backgroundColor: selected ? alpha(colors.primary, 'subtle') : colors.surface },
        disabled && styles.disabled,
      ]}
    >
      <IconAvatar icon={icon} color={selected ? colors.primaryInk : colors.textMuted} size={44} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="bodyStrong" style={styles.title}>{title}</Text>
          {badge ? <Badge label={badge} /> : null}
        </View>
        {description ? <Text variant="callout" tone="muted">{description}</Text> : null}
      </View>
      <View style={styles.radioSlot}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.primaryInk} />
        ) : selected ? (
          <Icon name="check-circle" size={24} color={colors.primaryInk} weight="fill" />
        ) : (
          <View style={styles.radioOff} />
        )}
      </View>
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, radius, alpha }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3.5'),
      padding: spacing('4'),
      borderRadius: radius('xl'),
    },
    disabled: { opacity: 0.5 },
    body: { flex: 1, gap: spacing('1') },
    titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing('2') },
    title: { flexShrink: 1 },
    radioSlot: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
    radioOff: { width: 20, height: 20, borderRadius: radius('full'), backgroundColor: alpha(colors.text, 'subtle') },
  });
