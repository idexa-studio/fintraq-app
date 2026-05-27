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
    title: 'Spending trends',
    description: 'Visual charts showing exactly where your money goes — daily, monthly, and by category.',
  },
  {
    icon: 'trending-up-outline',
    title: 'Burn velocity',
    description: 'See how fast you\'re spending. Spot anomalies before they drain your balance.',
  },
  {
    icon: 'infinite',
    title: 'Runway forecasts',
    description: 'Know exactly how many days your capital will last at your current spending rate.',
  },
  {
    icon: 'git-compare',
    title: 'Performance deltas',
    description: 'Compare income and expenses against previous periods. Track real growth over time.',
  },
  {
    icon: 'search-outline',
    title: 'Global search',
    description: 'Find any transaction, account, or category instantly across your entire history.',
  },
  {
    icon: 'download-outline',
    title: 'CSV export',
    description: 'Export filtered transactions as a spreadsheet. Save to device or share to any app.',
  },
  {
    icon: 'newspaper-outline',
    title: 'Weekly reports',
    description: 'Auto-generated summaries of your weekly activity with category breakdowns and comparisons.',
  },
  {
    icon: 'calendar-outline',
    title: 'Monthly reports',
    description: 'Detailed monthly financial statements. Income, expenses, and net change in one view.',
  },
];
