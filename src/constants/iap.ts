import { Platform } from 'react-native';
import { IoniconName } from '@/src/utils/icons';

export interface ProFeature {
  icon: IoniconName;
  title: string;
  description: string;
}

export const SKU_LIFETIME = Platform.select({
  ios: 'com.luno.lifetime',
  android: 'luno_lifetime',
}) || 'luno_lifetime';

export const ALL_SKUS = [SKU_LIFETIME];

export const FEATURES: ProFeature[] = [
  {
    icon: 'bar-chart-outline',
    title: 'Dashboard insights',
    description: 'Real-time spending alerts, saving trends, and weekly summaries right on your home screen.',
  },
  {
    icon: 'analytics-outline',
    title: 'Extended analytics',
    description: '30-day, 90-day, and 12-month charts. 7-day view is always free.',
  },
  {
    icon: 'git-compare',
    title: 'Period flow',
    description: 'Side-by-side income vs expense bars to see how your money moves over time.',
  },
  {
    icon: 'pie-chart-outline',
    title: 'Category breakdown',
    description: 'Donut chart of your top spending categories with exact amounts and percentages.',
  },
  {
    icon: 'infinite',
    title: 'Behavioral insights',
    description: 'Daily burn rate, financial runway in days, in/out ratio, and active day count.',
  },
  {
    icon: 'search-outline',
    title: 'Global search',
    description: 'Find any transaction, account, or category instantly across your entire history.',
  },
  {
    icon: 'stats-chart-outline',
    title: 'Weekday patterns',
    description: 'Heatmap showing which days of the week you spend the most.',
  },
  {
    icon: 'download-outline',
    title: 'CSV export',
    description: 'Export filtered transactions as a spreadsheet. Save to device or share to any app.',
  },
];
