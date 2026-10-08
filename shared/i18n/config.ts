import * as Localization from 'expo-localization';

/** Add every supported language here, with its canonical Intl locale and native name. */
export const languages = {
  en: { locale: 'en-US', nativeName: 'English' },
  hi: { locale: 'hi-IN', nativeName: 'हिन्दी' },
  bn: { locale: 'bn-BD', nativeName: 'বাংলা' },
  ta: { locale: 'ta-IN', nativeName: 'தமிழ்' },
  te: { locale: 'te-IN', nativeName: 'తెలుగు' },
  mr: { locale: 'mr-IN', nativeName: 'मराठी' },
  kn: { locale: 'kn-IN', nativeName: 'ಕನ್ನಡ' },
  id: { locale: 'id-ID', nativeName: 'Bahasa Indonesia' },
  es: { locale: 'es-ES', nativeName: 'Español' },
  pt: { locale: 'pt-BR', nativeName: 'Português' },
  fr: { locale: 'fr-FR', nativeName: 'Français' },
  de: { locale: 'de-DE', nativeName: 'Deutsch' },
  ja: { locale: 'ja-JP', nativeName: '日本語' },
} as const;

export type SupportedLanguage = keyof typeof languages;
export type AppLanguage = SupportedLanguage | 'system';
export const supportedLanguages = Object.keys(languages) as SupportedLanguage[];

const isSupported = (code: string | null | undefined): code is SupportedLanguage =>
  !!code && code in languages;

export const getSystemLanguage = (): SupportedLanguage => {
  const languageCode = Localization.getLocales()[0]?.languageCode;
  return isSupported(languageCode) ? languageCode : 'en';
};

export const resolveLanguage = (language: AppLanguage | string | undefined): SupportedLanguage => {
  if (language === 'system') return getSystemLanguage();
  return isSupported(language) ? language : 'en';
};

export const getIntlLocale = (language: string | undefined, fallback: string): string =>
  isSupported(language) ? languages[language].locale : fallback;
