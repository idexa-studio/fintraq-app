import * as Localization from 'expo-localization';
import i18n, { getIntlLocale } from '@/shared/i18n';

/** The Intl locale for the app's language, falling back to the device's. */
export const appLocale = (): string => {
  const deviceLocale = Localization.getLocales()?.[0]?.languageTag ?? 'en-US';
  return getIntlLocale(i18n.resolvedLanguage ?? i18n.language, deviceLocale);
};
