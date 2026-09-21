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
  key: 'insights' | 'analytics' | 'highlights' | 'categories' | 'forecast' | 'search' | 'weekly' | 'csv';
}

export const SKU_LIFETIME = Platform.select({
  ios: 'com.luno.lifetime',
  android: 'luno_lifetime',
}) || 'luno_lifetime';

export const ALL_SKUS = [SKU_LIFETIME];

// Free-tier caps before Pro is required.
export const FREE_LOAN_LIMIT = 3;
export const FREE_PERSON_LIMIT = 10;

export const FEATURES: ProFeature[] = [
  {
    icon: SparklesIcon,
    key: 'insights',
  },
  {
    icon: ChartLineData01Icon,
    key: 'analytics',
  },
  {
    icon: SparklesIcon,
    key: 'highlights',
  },
  {
    icon: PieChart01Icon,
    key: 'categories',
  },
  {
    icon: TrendingUpDownIcon,
    key: 'forecast',
  },
  {
    icon: Search01Icon,
    key: 'search',
  },
  {
    icon: BarChartIcon,
    key: 'weekly',
  },
  {
    icon: Download01Icon,
    key: 'csv',
  },
];
