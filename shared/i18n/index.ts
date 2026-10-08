import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSystemLanguage } from './config';
import accounts from '@/shared/i18n/copy/accounts.en';
import activity from '@/shared/i18n/copy/activity.en';
import categories from '@/shared/i18n/copy/categories.en';
import common from '@/shared/i18n/copy/common.en';
import home from '@/shared/i18n/copy/home.en';
import insights from '@/shared/i18n/copy/insights.en';
import loans from '@/shared/i18n/copy/loans.en';
import people from '@/shared/i18n/copy/people.en';
import plan from '@/shared/i18n/copy/plan.en';
import search from '@/shared/i18n/copy/search.en';
import backupCopy from '@/shared/i18n/copy/backup.en';
import exportCopy from '@/shared/i18n/copy/export.en';
import lock from '@/shared/i18n/copy/lock.en';
import settingsCopy from '@/shared/i18n/copy/settings.en';
import firstRun from '@/shared/i18n/copy/firstRun.en';
import notifications from '@/shared/i18n/copy/notifications.en';
import pro from '@/shared/i18n/copy/pro.en';
import shell from '@/shared/i18n/copy/shell.en';
import transactions from '@/shared/i18n/copy/transactions.en';
import bn from '@/shared/i18n/copy/bn.json';
import es from '@/shared/i18n/copy/es.json';
import fr from '@/shared/i18n/copy/fr.json';
import hi from '@/shared/i18n/copy/hi.json';
import pt from '@/shared/i18n/copy/pt.json';

export * from './config';

/** The languages translated so far. Add each here as its file is built. */
const TRANSLATED = { hi, bn, es, pt, fr };

const i18n = createInstance();
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v4',
    resources: {
      // The copy is written in English first, namespace by namespace. Each other language is one
      // file built from its translations by `scripts/i18n/build.js`, which also reports what a
      // language is missing. A string not translated yet falls back to English, never to a key.
      ...TRANSLATED,
      en: { common, shell, home, transactions, activity, accounts, categories, people, loans, plan, insights, search, backup: backupCopy, export: exportCopy, lock, settings: settingsCopy, firstRun, notifications, pro },
    },
    ns: ['common', 'shell', 'home', 'transactions', 'activity', 'accounts', 'categories', 'people', 'loans', 'plan', 'insights', 'search', 'backup', 'export', 'lock', 'settings', 'firstRun', 'notifications', 'pro'],
    defaultNS: 'common',
    lng: getSystemLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

export default i18n;
