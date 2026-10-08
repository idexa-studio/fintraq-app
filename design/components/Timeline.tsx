import { Icon } from '@/design/components/Icon';
import { Text } from '@/design/components/Text';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type TimelineItem = {
  title: string;
  subtitle?: string;
  /** Right-aligned, e.g. an amount. */
  value?: string;
  state: 'done' | 'current' | 'upcoming';
};

export type TimelineProps = {
  items: TimelineItem[];
};

/** Events in order down a line: what has happened, where things stand, what is still to come. */
export function Timeline({ items }: TimelineProps) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  return (
    <View>
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <View key={`${item.title}-${i}`} style={styles.item} accessible accessibilityLabel={[item.title, item.subtitle, item.value, item.state].filter(Boolean).join(', ')}>
            <View style={styles.rail}>
              <View
                style={[
                  styles.dot,
                  item.state === 'done' ? { backgroundColor: colors.action, borderColor: colors.action } : null,
                  item.state === 'current' ? { borderColor: colors.selected, backgroundColor: colors.accent } : null,
                  item.state === 'upcoming' ? { borderColor: colors.divider } : null,
                ]}
              >
                {item.state === 'done' ? <Icon name="tick" size={styles.tick.width} color={colors.onAction} /> : null}
              </View>
              {last ? null : <View style={[styles.line, { backgroundColor: item.state === 'done' ? colors.action : colors.divider }]} />}
            </View>
            <View style={[styles.text, last ? null : styles.gap]}>
              <Text variant="bodyStrong" tone={item.state === 'upcoming' ? 'muted' : 'default'}>{item.title}</Text>
              {item.subtitle ? <Text variant="callout" tone="muted">{item.subtitle}</Text> : null}
            </View>
            {item.value ? <Text variant="amount" tone={item.state === 'upcoming' ? 'muted' : 'default'}>{item.value}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const createStyles = ({ size, space, border }: Theme) =>
  StyleSheet.create({
    item: { flexDirection: 'row', gap: space.md },
    rail: { alignItems: 'center', width: size.icon },
    dot: { width: size.icon, height: size.icon, borderRadius: size.icon / 2, borderWidth: border.thick, alignItems: 'center', justifyContent: 'center' },
    tick: { width: space.lg },
    line: { flex: 1, width: border.thick, marginVertical: space.xs },
    text: { flex: 1, gap: space.xxs, paddingTop: space.xxs },
    gap: { paddingBottom: space.xl },
  });
