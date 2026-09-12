import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db, unlockDatabaseIfLocked } from '../db/client';
import migrations from '../../drizzle/migrations';
import { runSeeds } from '../db/seeds/runner';
import { LoggerService } from '../services/logger.service';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const { success, error } = useMigrations(db, migrations);
  const [seedsReady, setSeedsReady] = React.useState(false);

  useEffect(() => {
    if (!success) return;
    unlockDatabaseIfLocked();
    // Must resolve before children (incl. onboarding's own category seeding) render —
    // otherwise both can race to insert the same default categories (e.g. duplicate
    // 'Uncategorized' rows, since seedCategories() checked for it before this committed).
    runSeeds()
      .catch((err) => LoggerService.warn('DATABASE', 'Seed run failed', err))
      .finally(() => setSeedsReady(true));
  }, [success]);

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Error loading database migrations</Text>
        <Text>{error.message}</Text>
      </View>
    );
  }

  if (!success || !seedsReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Initializing database...</Text>
      </View>
    );
  }

  return <>{children}</>;
}
