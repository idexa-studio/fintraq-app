import { db, unlockDatabaseIfLocked } from '@/data/db/client';
import { runSeeds } from '@/data/db/seeds/runner';
import { Emblem, Message, Screen, Spinner, Text, ThemeProvider, useTheme } from '@/design';
import migrations from '@/drizzle/migrations';
import { LoggerService } from '@/shared/logging/logger';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, useColorScheme } from 'react-native';

/**
 * Holds the app back until the database is ready: migrations applied, then
 * data fixes run. Nothing below it may touch the database before that.
 */
export function DatabaseGate({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [seedsReady, setSeedsReady] = useState(false);
  // The saved theme is not readable yet at this point of start-up, so these two screens follow the phone.
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    if (!success) return;
    unlockDatabaseIfLocked();
    // Must finish before anything below renders: first-run setup seeds categories too,
    // and the two would otherwise race to insert the same defaults.
    runSeeds()
      .catch((err) => LoggerService.warn('DATABASE', 'Seed run failed', err))
      .finally(() => setSeedsReady(true));
  }, [success]);

  if (error) return <ThemeProvider scheme={scheme}><Failed /></ThemeProvider>;
  if (!success || !seedsReady) return <ThemeProvider scheme={scheme}><Preparing /></ThemeProvider>;
  return <>{children}</>;
}

function Preparing() {
  const { t } = useTranslation('shell');
  const { space } = useTheme();
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <Spinner accessibilityLabel={t('start.preparing')} />
        <Text variant="callout" tone="muted">{t('start.preparing')}</Text>
      </View>
    </Screen>
  );
}

/** What went wrong is in the log; the screen says what it means for the user and what to do. */
function Failed() {
  const { t } = useTranslation('shell');
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Message illustration={<Emblem icon="warning" color="orange" />} title={t('start.failedTitle')} body={t('start.failedBody')} />
      </View>
    </Screen>
  );
}
