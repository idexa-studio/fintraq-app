import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSystemLanguage } from './config';
import activity from '@/shared/i18n/copy/activity.en';
import common from '@/shared/i18n/copy/common.en';
import home from '@/shared/i18n/copy/home.en';
import shell from '@/shared/i18n/copy/shell.en';
import transactions from '@/shared/i18n/copy/transactions.en';
import bn from '@/shared/i18n/locales/bn';
import de from '@/shared/i18n/locales/de';
import en from '@/shared/i18n/locales/en';
import es from '@/shared/i18n/locales/es';
import fr from '@/shared/i18n/locales/fr';
import hi from '@/shared/i18n/locales/hi';
import id from '@/shared/i18n/locales/id';
import ja from '@/shared/i18n/locales/ja';
import kn from '@/shared/i18n/locales/kn';
import mr from '@/shared/i18n/locales/mr';
import pt from '@/shared/i18n/locales/pt';
import ta from '@/shared/i18n/locales/ta';
import te from '@/shared/i18n/locales/te';

export * from './config';

const i18n = createInstance();
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      // `translation` is the shipped app's copy. The other namespaces are the rebuilt screens' copy,
      // written in English first: a language without one falls back to English, never to a key.
      en: { translation: en, common, shell, home, transactions, activity },
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
    ns: ['translation', 'common', 'shell', 'home', 'transactions', 'activity'],
    defaultNS: 'translation',
    lng: getSystemLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
