import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSystemLanguage } from './config';
import bn from '@/src/i18n/locales/bn';
import de from '@/src/i18n/locales/de';
import en from '@/src/i18n/locales/en';
import es from '@/src/i18n/locales/es';
import fr from '@/src/i18n/locales/fr';
import hi from '@/src/i18n/locales/hi';
import id from '@/src/i18n/locales/id';
import ja from '@/src/i18n/locales/ja';
import kn from '@/src/i18n/locales/kn';
import mr from '@/src/i18n/locales/mr';
import pt from '@/src/i18n/locales/pt';
import ta from '@/src/i18n/locales/ta';
import te from '@/src/i18n/locales/te';

export * from './config';

const i18n = createInstance();
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      bn: { translation: bn },
      ta: { translation: ta },
      te: { translation: te },
      mr: { translation: mr },
      kn: { translation: kn },
      id: { translation: id },
      es: { translation: es },
      pt: { translation: pt },
      fr: { translation: fr },
      de: { translation: de },
      ja: { translation: ja },
    },
    lng: getSystemLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
