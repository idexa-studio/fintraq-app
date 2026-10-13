import { Button, Checklist, Emblem, Message, Screen } from '@/design';
import { LoggerService } from '@/shared/logging/logger';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Linking, Platform } from 'react-native';

/** Where to send someone when the configured store link cannot be opened. */
const STORE_FRONT = Platform.OS === 'ios' ? 'https://apps.apple.com' : 'https://play.google.com/store';

export type ForceUpdateScreenProps = {
  /** The app's page in this platform's store. */
  storeUrl: string;
  /** The version to update to, when it is known. */
  version?: string;
};

/**
 * Replaces the whole app when this version is too old to run safely: why, the reassurance that
 * nothing is lost, and the one thing to do. There is no way past it.
 */
export function ForceUpdateScreen({ storeUrl, version }: ForceUpdateScreenProps) {
  const { t } = useTranslation('shell');
  const open = async () => {
    try {
      await Linking.openURL((await Linking.canOpenURL(storeUrl)) ? storeUrl : STORE_FRONT);
    } catch (e) {
      // The button stays, so the user can try again.
      LoggerService.warn('FORCE_UPDATE', 'Could not open the store', e);
    }
  };
  return (
    <Screen centred footer={<Button label={t('update.action')} onPress={open} />}>
      <Message illustration={<Emblem icon="download-simple" color="green" />} title={version ? t('update.titleVersion', { version }) : t('update.title')} body={t('update.body')} />
      <Checklist items={[t('update.points.data'), t('update.points.quick')]} />
    </Screen>
  );
}
