import {
  ArrowDataTransferHorizontalIcon,
  BarChartIcon,
  Calendar01Icon,
  CardExchange01Icon,
  ChartLineData01Icon,
  Cursor01Icon,
  FilterIcon,
  GridIcon,
  Group01Icon,
  LabelImportantIcon,
  MoreVerticalCircle01Icon,
  PlusSignIcon,
  ReceiptTextIcon,
  Search01Icon,
  SparklesIcon,
  Tag01Icon,
  UserAccountIcon,
  Wallet05Icon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import type en from '@/src/i18n/locales/en';

export type WalkthroughStepId = Exclude<keyof (typeof en)['walkthrough'], 'step' | 'skip' | 'getStarted' | 'next'>;

export type WalkthroughStep = {
  icon: IconSvgElement;
  id: WalkthroughStepId;
};

export const DASHBOARD_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: SparklesIcon,
    id: 'welcomeToFintraq',
  },
  {
    icon: Wallet05Icon,
    id: 'trackNetSavings',
  },
  {
    icon: GridIcon,
    id: 'accountsWallets',
  },
  {
    icon: ChartLineData01Icon,
    id: 'realTimeInsights',
  },
  {
    icon: PlusSignIcon,
    id: 'logFirstTransaction',
  },
];

export const TRANSACTION_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: BarChartIcon,
    id: 'enterAmount',
  },
  {
    icon: ArrowDataTransferHorizontalIcon,
    id: 'selectTransactionType',
  },
  {
    icon: Tag01Icon,
    id: 'chooseCategory',
  },
  {
    icon: Wallet05Icon,
    id: 'pickAccount',
  },
  {
    icon: Calendar01Icon,
    id: 'setDateSave',
  },
];

export const SEARCH_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: Search01Icon,
    id: 'globalSearch',
  },
  {
    icon: FilterIcon,
    id: 'targetedQueries',
  },
  {
    icon: Cursor01Icon,
    id: 'quickJump',
  },
];

export const ANALYTICS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: ChartLineData01Icon,
    id: 'summaryDeltas',
  },
  {
    icon: SparklesIcon,
    id: 'highlights',
  },
  {
    icon: Tag01Icon,
    id: 'categoryBreakdown',
  },
  {
    icon: Calendar01Icon,
    id: 'weeklyPatternForecast',
  },
];

export const CATEGORIES_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: LabelImportantIcon,
    id: 'budgetCategories',
  },
  {
    icon: Cursor01Icon,
    id: 'categoryOptions',
  },
  {
    icon: PlusSignIcon,
    id: 'customIconsColors',
  },
];

export const PERSONS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: Group01Icon,
    id: 'personTracking',
  },
  {
    icon: CardExchange01Icon,
    id: 'debtSettlements',
  },
  {
    icon: PlusSignIcon,
    id: 'addContacts',
  },
];

export const ACCOUNTS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: Wallet05Icon,
    id: 'accountsList',
  },
  {
    icon: MoreVerticalCircle01Icon,
    id: 'manageAccounts',
  },
  {
    icon: PlusSignIcon,
    id: 'createAccounts',
  },
];

export const TRANSACTIONS_LIST_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: ReceiptTextIcon,
    id: 'transactionLog',
  },
  {
    icon: FilterIcon,
    id: 'advancedFiltering',
  },
  {
    icon: UserAccountIcon,
    id: 'swipeActions',
  },
  {
    icon: PlusSignIcon,
    id: 'quickAdd',
  },
];
