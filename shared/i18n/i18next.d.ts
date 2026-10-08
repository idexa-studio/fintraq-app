import 'i18next';
import type accounts from '@/shared/i18n/copy/accounts.en';
import type activity from '@/shared/i18n/copy/activity.en';
import type categories from '@/shared/i18n/copy/categories.en';
import type common from '@/shared/i18n/copy/common.en';
import type home from '@/shared/i18n/copy/home.en';
import type insights from '@/shared/i18n/copy/insights.en';
import type loans from '@/shared/i18n/copy/loans.en';
import type people from '@/shared/i18n/copy/people.en';
import type plan from '@/shared/i18n/copy/plan.en';
import type search from '@/shared/i18n/copy/search.en';
import type backup from '@/shared/i18n/copy/backup.en';
import type exportCopy from '@/shared/i18n/copy/export.en';
import type shell from '@/shared/i18n/copy/shell.en';
import type transactions from '@/shared/i18n/copy/transactions.en';
import type en from '@/shared/i18n/locales/en';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
      activity: typeof activity;
      accounts: typeof accounts;
      categories: typeof categories;
      people: typeof people;
      loans: typeof loans;
      plan: typeof plan;
      search: typeof search;
      backup: typeof backup;
      export: typeof exportCopy;
      insights: typeof insights;
      common: typeof common;
      shell: typeof shell;
      home: typeof home;
      transactions: typeof transactions;
    };
  }
}
