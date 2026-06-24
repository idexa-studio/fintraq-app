import {
  BarChartIcon,
  ChartLineData01Icon,
  Download01Icon,
  PieChart01Icon,
  Search01Icon,
  SparklesIcon,
  TrendingUpDownIcon,
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
    description: 'Unlock 30-day, 90-day, and 12-month views with delta badges comparing against the previous period.',
  },
  {
    icon: SparklesIcon,
    title: 'Highlights',
    description: 'Instantly see your top expense category and single biggest expense. Tap to drill into transactions.',
  },
  {
    icon: PieChart01Icon,
    title: 'Category breakdown',
    description: 'Expense and income tabs with a proportion bar and per-category amounts and percentages.',
  },
  {
    icon: TrendingUpDownIcon,
    title: 'Spending forecast',
    description: 'Daily average spend and a month-end projection based on your current burn rate.',
  },
  {
    icon: Search01Icon,
    title: 'Global search',
    description: 'Find any transaction, account, or category instantly across your entire history.',
  },
  {
    icon: BarChartIcon,
    title: 'Weekly pattern',
    description: 'Bar chart showing which days you spend most, with an auto-generated spending insight.',
  },
  {
    icon: Download01Icon,
    title: 'CSV export',
    description: 'Export transactions and loan records as a spreadsheet. Save to device or share to any app.',
  },
];
