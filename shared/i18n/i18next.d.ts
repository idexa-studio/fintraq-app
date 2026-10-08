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
import type lock from '@/shared/i18n/copy/lock.en';
import type settings from '@/shared/i18n/copy/settings.en';
import type firstRun from '@/shared/i18n/copy/firstRun.en';
import type notifications from '@/shared/i18n/copy/notifications.en';
import type pro from '@/shared/i18n/copy/pro.en';
import type shell from '@/shared/i18n/copy/shell.en';
import type transactions from '@/shared/i18n/copy/transactions.en';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: {
      activity: typeof activity;
      accounts: typeof accounts;
      categories: typeof categories;
      people: typeof people;
      loans: typeof loans;
      plan: typeof plan;
      search: typeof search;
      backup: typeof backup;
      export: typeof exportCopy;
      lock: typeof lock;
      settings: typeof settings;
      firstRun: typeof firstRun;
      notifications: typeof notifications;
      pro: typeof pro;
      insights: typeof insights;
      common: typeof common;
      shell: typeof shell;
      home: typeof home;
      transactions: typeof transactions;
    };
  }
}
