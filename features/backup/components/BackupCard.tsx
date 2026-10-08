import { Card, CardActions, Text, useStyles } from '@/design';
import type { Theme } from '@/design';
import { BackupLink } from '@/features/backup/components/BackupLink';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export type BackupCardProps = {
  /** The state in words: "Backed up today at 2:14 PM", "No backup yet", or what is running. */
  title: string;
  /** Where the backup is, what to do when there is none, or where the run has got to. */
  detail: string;
  /** A backup exists, so there is something to restore. */
  hasBackup: boolean;
  /** A backup or restore under way, and how far it has got, 0 to 1. */
  working?: { operation: 'backup' | 'restore'; value: number };
  phoneLabel: string;
  driveLabel: string;
  backUpLabel: string;
  restoreLabel: string;
  onBackUp?: () => void;
  onRestore?: () => void;
};

/**
 * Where the backup stands and the two things to do about it, as one card:
 * the phone and the Drive with the line between them, the state in words,
 * then back up and restore side by side. Neither can be started while the
 * other is running.
 */
export function BackupCard({ title, detail, hasBackup, working, phoneLabel, driveLabel, backUpLabel, restoreLabel, onBackUp, onRestore }: BackupCardProps) {
  const styles = useStyles(createStyles);
  return (
    <Card padded={false}>
      <View style={styles.body}>
        <BackupLink
          state={working ? (working.operation === 'restore' ? 'fetching' : 'sending') : hasBackup ? 'joined' : 'apart'}
          value={working?.value}
          phoneLabel={phoneLabel}
          driveLabel={driveLabel}
          accessibilityLabel={title}
        />
        <View style={styles.text}>
          <Text variant="title" accessibilityRole="header">{title}</Text>
          <Text variant="callout" tone="muted">{detail}</Text>
        </View>
      </View>
      <CardActions
        actions={[
          { label: backUpLabel, disabled: !!working, onPress: onBackUp },
          { label: restoreLabel, disabled: !!working || !hasBackup, onPress: onRestore },
        ]}
      />
    </Card>
  );
}

const createStyles = ({ size, space }: Theme) =>
  StyleSheet.create({
    body: { padding: size.cardPadding, gap: space.xl },
    text: { gap: space.xs },
  });
