import { Text } from '@/src/components/ui/Text';
import { Spinner } from '@/src/components/ui';
import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db, unlockDatabaseIfLocked } from '@/data/db/client';
import migrations from '@/drizzle/migrations';
import { runSeeds } from '@/data/db/seeds/runner';
import { LoggerService } from '@/shared/logging/logger';
import { useTranslation } from 'react-i18next';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { success, error } = useMigrations(db, migrations);
  const [seedsReady, setSeedsReady] = React.useState(false);

  useEffect(() => {
    if (!success) return;
    unlockDatabaseIfLocked();
    // Must resolve before children (incl. onboarding's own category seeding) render —
    // otherwise both can race to insert the same default categories (e.g. duplicate
    // 'Others' rows, since seedCategories() checked for it before this committed).
    runSeeds()
      .catch((err) => LoggerService.warn('DATABASE', 'Seed run failed', err))
      .finally(() => setSeedsReady(true));
  }, [success]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>{t('system.migrationError')}</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  if (!success || !seedsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Spinner size="lg" />
        <Text>{t('system.initializingDatabase')}</Text>
      </View>
    );
  }

  return <>{children}</>;
}
