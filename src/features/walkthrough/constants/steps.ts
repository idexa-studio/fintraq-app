import type { IconSource } from '@/src/components/ui';
import {
  ChartBarIcon,
  DotsThreeVerticalIcon,
  HandSwipeLeftIcon,
  HandTapIcon,
  HandCoinsIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SlidersHorizontalIcon,
  WalletIcon,
} from '@/src/components/ui/icons';
import type en from '@/src/i18n/locales/en';

export type WalkthroughStepId = Exclude<keyof (typeof en)['walkthrough'], 'step' | 'skip' | 'getStarted' | 'next' | 'gotIt'>;

export type WalkthroughStep = {
  icon: IconSource;
  id: WalkthroughStepId;
};

// One or two tips per screen, only for things that aren't visible at a glance
// (gestures, hidden menus). Anything self-explanatory is not taught.

export const DASHBOARD_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { icon: WalletIcon, id: 'accountsWallets' },
  { icon: PlusIcon, id: 'logFirstTransaction' },
];

// The add-transaction form explains itself; a tip over a half-filled form only gets in the way.
export const TRANSACTION_WALKTHROUGH_STEPS: WalkthroughStep[] = [];

export const SEARCH_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { icon: MagnifyingGlassIcon, id: 'targetedQueries' },
];

export const ANALYTICS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { icon: ChartBarIcon, id: 'summaryDeltas' },
];

export const CATEGORIES_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { icon: HandTapIcon, id: 'categoryOptions' },
];

export const PERSONS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { icon: HandCoinsIcon, id: 'debtSettlements' },
];

export const ACCOUNTS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { icon: DotsThreeVerticalIcon, id: 'manageAccounts' },
];

export const TRANSACTIONS_LIST_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  { icon: HandSwipeLeftIcon, id: 'swipeActions' },
  { icon: SlidersHorizontalIcon, id: 'advancedFiltering' },
];
