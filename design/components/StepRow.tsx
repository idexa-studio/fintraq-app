import { Card } from '@/design/components/Card';
import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type StepState = 'done' | 'current' | 'upcoming';

export type StepRowProps = {
  label: string;
  icon: IconName;
  state: StepState;
  onPress?: () => void;
};

/** One step of a journey. Done carries a tick, the current one a green outline, later ones are pale. */
export function StepRow({ label, icon, state, onPress }: StepRowProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const upcoming = state === 'upcoming';
  return (
    <Card compact padded={false} selected={state === 'current'} muted={upcoming} onPress={upcoming ? undefined : onPress} accessibilityLabel={`${label}, ${state}`}>
      <View style={styles.row}>
        <Icon name={icon} color={upcoming ? colors.onDisabled : colors.text} />
        <Text variant="lead" tone={upcoming ? 'disabled' : 'default'} style={styles.label}>{label}</Text>
        {state === 'done' ? <CheckMark /> : null}
      </View>
    </Card>
  );
}

/** A white tick in a solid black circle: done, or a point to remember. */
export function CheckMark({ size }: { size?: number }) {
  const { colors, size: sizes } = useTheme();
  const diameter = size ?? sizes.icon;
  return (
    <View style={{ width: diameter, height: diameter, borderRadius: diameter / 2, backgroundColor: colors.action, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="tick" size={diameter * 0.62} color={colors.onAction} />
    </View>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    row: { minHeight: size.row, flexDirection: 'row', alignItems: 'center', gap: space.lg, paddingHorizontal: size.cardPadding + space.sm, paddingVertical: space.md },
    label: { flex: 1 },
  });
