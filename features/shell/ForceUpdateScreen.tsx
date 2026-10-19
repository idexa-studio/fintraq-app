import { Button, Checklist, Emblem, Message, Screen } from '@/design';
import { openStore } from '@/features/shell/open-store';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type ForceUpdateScreenProps = {
  /** The version to update to, when it is known. */
  version?: string;
};

/**
 * Replaces the whole app when this version is too old to run safely: why, the reassurance that
 * nothing is lost, and the one thing to do. There is no way past it.
 */
export function ForceUpdateScreen({ version }: ForceUpdateScreenProps) {
  const { t } = useTranslation('shell');
  return (
    <Screen centred footer={<Button label={t('update.action')} onPress={() => void openStore()} />}>
      <Message illustration={<Emblem icon="download-simple" color="green" />} title={version ? t('update.titleVersion', { version }) : t('update.title')} body={t('update.body')} />
      <Checklist items={[t('update.points.data'), t('update.points.quick')]} />
    </Screen>
  );
}
