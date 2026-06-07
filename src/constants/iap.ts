import { Platform } from 'react-native';
import { MaterialIconName } from '@/src/utils/icons';

export interface ProFeature {
  icon: MaterialIconName;
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
    icon: 'chart-bar',
    title: 'Dashboard insights',
    description: 'Real-time spending alerts, saving trends, and weekly summaries right on your home screen.',
  },
  {
    icon: 'chart-timeline-variant',
    title: 'Extended analytics',
    description: '30-day, 90-day, and 12-month charts. 7-day view is always free.',
  },
  {
    icon: 'compare',
    title: 'Period flow',
    description: 'Side-by-side income vs expense bars to see how your money moves over time.',
  },
  {
    icon: 'chart-pie',
    title: 'Category breakdown',
    description: 'Donut chart of your top spending categories with exact amounts and percentages.',
  },
  {
    icon: 'infinity',
    title: 'Behavioral insights',
    description: 'Daily burn rate, financial runway in days, in/out ratio, and active day count.',
  },
  {
    icon: 'magnify',
    title: 'Global search',
    description: 'Find any transaction, account, or category instantly across your entire history.',
  },
  {
    icon: 'chart-bar',
    title: 'Weekday patterns',
    description: 'Heatmap showing which days of the week you spend the most.',
  },
  {
    icon: 'download-outline',
    title: 'CSV export',
    description: 'Export filtered transactions as a spreadsheet. Save to device or share to any app.',
  },
];
