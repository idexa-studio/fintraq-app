import { Icon, IconCircle, ProgressBar, Text, useStyles, useTheme } from '@/design';
import type { Theme } from '@/design';
import React from 'react';
import { StyleSheet, View } from 'react-native';

/** How many dots stand for a link that has not been made yet. */
const DOTS = 9;

export type BackupLinkProps = {
  /**
   * apart: nothing is in the Drive yet. joined: a backup is there.
   * sending: a backup is on its way up. fetching: a restore is on its way down.
   */
  state: 'apart' | 'joined' | 'sending' | 'fetching';
  /** How far the transfer has got, 0 to 1. */
  value?: number;
  phoneLabel: string;
  driveLabel: string;
  /** What the picture says, for a screen reader. */
  accessibilityLabel: string;
};

/**
 * Backup as a picture: this phone on one side, the Drive on the other, and
 * the line between them. Dotted while nothing is there, solid once a backup
 * is, and filling in the direction the data travels while one runs: towards
 * the Drive for a backup, back towards the phone for a restore.
 */
export function BackupLink({ state, value = 0, phoneLabel, driveLabel, accessibilityLabel }: BackupLinkProps) {
  const { colors, size } = useTheme();
  const styles = useStyles(createStyles);
  const mark = size.iconCircleLarge;
  const there = state !== 'apart';
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.link}>
      <View style={styles.line}>
        <IconCircle icon="smartphone" color="lilac" size={mark} />
        <View style={styles.wire}>
          {state === 'apart' ? (
            <View style={styles.dots}>
              {Array.from({ length: DOTS }, (_, i) => <View key={i} style={styles.dot} />)}
            </View>
          ) : (
            // A restore travels from the Drive to the phone, so its bar fills from the other end.
            <View style={state === 'fetching' ? styles.towardsPhone : null}>
              <ProgressBar value={state === 'joined' ? 1 : value} accessibilityLabel={accessibilityLabel} />
            </View>
          )}
        </View>
        {there ? (
          <IconCircle icon={state === 'joined' ? 'cloud-check' : 'cloud'} color="green" size={mark} />
        ) : (
          <View style={[styles.empty, { width: mark, height: mark, borderRadius: mark / 2 }]}>
            <Icon name="cloud" color={colors.textMuted} />
          </View>
        )}
      </View>
      <View style={styles.labels}>
        <Text variant="caption" tone="muted">{phoneLabel}</Text>
        <Text variant="caption" tone="muted">{driveLabel}</Text>
      </View>
    </View>
  );
}

const createStyles = ({ colors, border, space }: Theme) =>
  StyleSheet.create({
    link: { gap: space.sm },
    line: { flexDirection: 'row', alignItems: 'center', gap: space.md },
    wire: { flex: 1 },
    dots: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    dot: { width: space.xs, height: space.xs, borderRadius: space.xs / 2, backgroundColor: colors.border },
    towardsPhone: { transform: [{ scaleX: -1 }] },
    empty: { alignItems: 'center', justifyContent: 'center', borderWidth: border.thin, borderColor: colors.border },
    labels: { flexDirection: 'row', justifyContent: 'space-between' },
  });
