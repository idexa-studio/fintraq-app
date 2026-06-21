import {
  BarChartIcon,
  ChartLineData01Icon,
  Download01Icon,
  FilterIcon,
  Infinity01Icon,
  PieChart01Icon,
  Search01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react-native';
import { Platform } from 'react-native';

export interface ProFeature {
  icon: IconSvgElement;
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
    icon: SparklesIcon,
    title: 'Dashboard insights',
    description: 'Real-time spending alerts, saving trends, and weekly summaries right on your home screen.',
  },
  {
    icon: ChartLineData01Icon,
    title: 'Extended analytics',
    description: '30-day, 90-day, and 12-month charts. 7-day view is always free.',
  },
  {
    icon: FilterIcon,
    title: 'Period flow',
    description: 'Side-by-side income vs expense bars to see how your money moves over time.',
  },
  {
    icon: PieChart01Icon,
    title: 'Category breakdown',
    description: 'Donut chart of your top spending categories with exact amounts and percentages.',
  },
  {
    icon: Infinity01Icon,
    title: 'Behavioral insights',
    description: 'Daily burn rate, financial runway in days, in/out ratio, and active day count.',
  },
  {
    icon: Search01Icon,
    title: 'Global search',
    description: 'Find any transaction, account, or category instantly across your entire history.',
  },
  {
    icon: BarChartIcon,
    title: 'Weekday patterns',
    description: 'Heatmap showing which days of the week you spend the most.',
  },
  {
    icon: Download01Icon,
    title: 'CSV export',
    description: 'Export filtered transactions as a spreadsheet. Save to device or share to any app.',
  },
];
