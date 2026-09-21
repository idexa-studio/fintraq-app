import * as Localization from 'expo-localization';

/** Add every supported language here, with its canonical Intl locale. */
export const languages = {
  en: { locale: 'en-US' },
  hi: { locale: 'hi-IN' },
} as const;

export type SupportedLanguage = keyof typeof languages;
export type AppLanguage = SupportedLanguage | 'system';
export const supportedLanguages = Object.keys(languages) as SupportedLanguage[];

export const getSystemLanguage = (): SupportedLanguage => {
  const languageCode = Localization.getLocales()[0]?.languageCode;
  return languageCode === 'hi' ? 'hi' : 'en';
};

export const resolveLanguage = (language: AppLanguage | string | undefined): SupportedLanguage => {
  if (language === 'system') return getSystemLanguage();
  return language === 'hi' ? 'hi' : 'en';
};

export const getIntlLocale = (language: string | undefined, fallback: string): string =>
  language && language in languages
    ? languages[language as SupportedLanguage].locale
    : fallback;
