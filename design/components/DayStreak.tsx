import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type StreakDay = {
  label: string;
  state: 'done' | 'missed' | 'today' | 'ahead';
};

export type DayStreakProps = {
  days: StreakDay[];
  accessibilityLabel: string;
};

/** A week of circles: ticked when the day was logged, outlined in green for today. */
export function DayStreak({ days, accessibilityLabel }: DayStreakProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View accessible accessibilityLabel={accessibilityLabel} style={styles.row}>
      {days.map((day, i) => (
        <View key={`${day.label}-${i}`} style={styles.day}>
          <View
            style={[
              styles.circle,
              day.state === 'done' ? { backgroundColor: colors.action, borderColor: colors.action } : null,
              day.state === 'today' ? { borderColor: colors.selected, borderWidth: styles.today.borderWidth } : null,
              day.state === 'missed' || day.state === 'ahead' ? { borderColor: colors.divider } : null,
            ]}
          >
            {day.state === 'done' ? <Icon name="tick" size={styles.tick.width} color={colors.onAction} /> : null}
          </View>
          <Text variant={day.state === 'today' ? 'tabActive' : 'tab'} tone={day.state === 'ahead' ? 'muted' : 'default'}>{day.label}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = ({ size, space, border }: Theme) =>
  StyleSheet.create({
    row: { flexDirection: 'row', justifyContent: 'space-between' },
    day: { alignItems: 'center', gap: space.sm },
    circle: { width: size.buttonSmall, height: size.buttonSmall, borderRadius: size.buttonSmall / 2, borderWidth: border.thin, alignItems: 'center', justifyContent: 'center' },
    today: { borderWidth: border.thick },
    tick: { width: size.iconSmall },
  });
