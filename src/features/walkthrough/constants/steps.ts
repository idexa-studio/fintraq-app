import { MaterialCommunityIcons } from '@expo/vector-icons';

export type WalkthroughStep = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  desc: string;
};

export const DASHBOARD_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'hand-wave-outline',
    title: 'Welcome to Keeep!',
    desc: "Let's take a quick tour of your new premium financial dashboard.",
  },
  {
    icon: 'wallet-outline',
    title: 'Track Net Savings',
    desc: 'The top card displays your total net position (Income minus Expenses). Swipe it to view different currencies.',
  },
  {
    icon: 'card-bulleted-settings-outline',
    title: 'Accounts & Wallets',
    desc: 'Manage your cash, bank accounts, and credit cards. Tap them to view individual logs.',
  },
  {
    icon: 'chart-timeline-variant',
    title: 'Real-time Insights',
    desc: 'Below you will find dynamic spending pattern insights, top expense category chips, and streaks.',
  },
  {
    icon: 'plus',
    title: 'Log First Transaction',
    desc: "When you are ready, tap the green '+' action button at the bottom right to record a transaction!",
  },
];

export const TRANSACTION_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'numeric',
    title: 'Enter Amount',
    desc: 'Start by typing the transaction amount using the numeric input. Decimal values are fully supported.',
  },
  {
    icon: 'swap-horizontal',
    title: 'Select Transaction Type',
    desc: 'Choose Expense (money spent), Income (money earned), or Transfer (moving funds between accounts).',
  },
  {
    icon: 'tag-outline',
    title: 'Choose Category',
    desc: 'Select a category to structure your transaction. Custom categories can be configured in Settings.',
  },
  {
    icon: 'wallet-outline',
    title: 'Pick Account',
    desc: 'Choose which account or wallet this transaction is associated with.',
  },
  {
    icon: 'calendar-edit',
    title: 'Set Date & Save',
    desc: 'Adjust the date and time, add optional notes or link a contact, then tap Save to record it!',
  },
];

export const SEARCH_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'magnify',
    title: 'Global Search',
    desc: 'Search instantly across all transactions, accounts, categories, and people.',
  },
  {
    icon: 'filter-variant',
    title: 'Targeted Queries',
    desc: 'Type names, companies, emails, notes, or amounts. The query searches matching criteria automatically.',
  },
  {
    icon: 'cursor-default-click-outline',
    title: 'Quick Jump',
    desc: 'Tap a result row to open the editing page or drill down directly into its transactions.',
  },
];

export const ANALYTICS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'chart-box-outline',
    title: 'Interactive Analytics',
    desc: 'View your total balance trajectory, income/expense breakdown, and daily cashburn.',
  },
  {
    icon: 'calendar-range',
    title: 'Time Range Filtering',
    desc: 'Select custom periods (7 days, 30 days, 90 days, or a whole year) to track seasonal patterns.',
  },
  {
    icon: 'wallet-outline',
    title: 'Portfolio Distribution',
    desc: 'View percentage distributions of assets across cash, bank, or credit accounts.',
  },
  {
    icon: 'calendar-clock',
    title: 'Weekday Patterns',
    desc: 'Analyze the weekday frequency heatmap to see which days you spend the most.',
  },
];

export const CATEGORIES_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'tag-multiple-outline',
    title: 'Budget Categories',
    desc: 'Manage income, expense, and transfer category labels in one place.',
  },
  {
    icon: 'gesture-tap-hold',
    title: 'Category Options',
    desc: 'Hold down on a card to edit its properties or safely remove it.',
  },
  {
    icon: 'plus-circle-outline',
    title: 'Custom Icons & Colors',
    desc: "Press the '+' button to define custom category codes with unique color schemes.",
  },
];

export const PERSONS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'account-group-outline',
    title: 'Person Tracking',
    desc: 'Log and trace financial transactions linked to specific friends, family, or business partners.',
  },
  {
    icon: 'swap-horizontal',
    title: 'Debt & Settlements',
    desc: 'Record loans, splitting, and shared expenses to keep clear calculations of who owes whom.',
  },
  {
    icon: 'plus',
    title: 'Add Contacts',
    desc: 'Tap the plus button to register new contacts with optional companies or emails.',
  },
];

export const ACCOUNTS_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'wallet-outline',
    title: 'Accounts List',
    desc: 'View all your credit cards, cash wallets, and bank accounts in one place.',
  },
  {
    icon: 'dots-vertical',
    title: 'Manage Accounts',
    desc: 'Tap the three dots on any account card to edit details or delete the account.',
  },
  {
    icon: 'plus',
    title: 'Create Accounts',
    desc: "Use the plus button at the bottom to register a new account with custom icons, colors, and currencies.",
  },
];

export const TRANSACTIONS_LIST_WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    icon: 'receipt-text-outline',
    title: 'Transaction Log',
    desc: 'View a chronological feed of all recorded income, expenses, and transfer transactions.',
  },
  {
    icon: 'tune',
    title: 'Advanced Filtering',
    desc: 'Filter transactions by accounts, category tags, custom dates, or amount ranges dynamically.',
  },
  {
    icon: 'gesture-swipe-horizontal',
    title: 'Swipe Actions',
    desc: 'Swipe left on any transaction card to quickly edit details or delete the entry.',
  },
  {
    icon: 'plus',
    title: 'Quick Add',
    desc: "Tap the plus button to open the transaction creator screen instantly.",
  },
];

