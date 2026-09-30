import {
  BarChartIcon,
  ChartLineData01Icon,
  CloudUploadIcon,
  Download01Icon,
  InfinityCircleIcon,
  PieChart01Icon,
  Search01Icon,
  SparklesIcon,
  TrendingUpDownIcon,
  UserGroupIcon,
  ZapIcon,
} from '@hugeicons/core-free-icons';
import type { IconSource } from '@/src/components/ui';
import { FREE_LOAN_LIMIT, FREE_PERSON_LIMIT } from '@/src/constants/iap';

/**
 * Every Pro-only capability, in one place. Gates (`<ProGate>`, `useProAccess`), the paywall and the
 * upsell all read from here, so a feature can't be locked in the app without being advertised, or
 * advertised without being locked. Ids double as i18n keys under `premium.features.*`.
 */
export const PRO_FEATURES = {
  analytics: { icon: ChartLineData01Icon, group: 'analytics' },
  highlights: { icon: ZapIcon, group: 'analytics' },
  categories: { icon: PieChart01Icon, group: 'analytics' },
  people: { icon: UserGroupIcon, group: 'analytics' },
  forecast: { icon: TrendingUpDownIcon, group: 'analytics' },
  weekly: { icon: BarChartIcon, group: 'analytics' },
  insights: { icon: SparklesIcon, group: 'analytics' },
  search: { icon: Search01Icon, group: 'tools' },
  csv: { icon: Download01Icon, group: 'tools' },
  backup: { icon: CloudUploadIcon, group: 'more' },
  unlimited: { icon: InfinityCircleIcon, group: 'more' },
} as const satisfies Record<string, { icon: IconSource; group: ProFeatureGroup }>;

export type ProFeatureGroup = 'analytics' | 'tools' | 'more';
export type ProFeatureId = keyof typeof PRO_FEATURES;

export const PRO_FEATURE_IDS = Object.keys(PRO_FEATURES) as ProFeatureId[];
export const PRO_FEATURE_GROUPS: readonly ProFeatureGroup[] = ['analytics', 'tools', 'more'];

export const featuresInGroup = (group: ProFeatureGroup): ProFeatureId[] => PRO_FEATURE_IDS.filter((id) => PRO_FEATURES[id].group === group);

export const isProFeatureId = (value: unknown): value is ProFeatureId => typeof value === 'string' && value in PRO_FEATURES;

/** The short list for compact upsells (dashboard modal), strongest reasons first. */
export const HEADLINE_FEATURES: readonly ProFeatureId[] = ['analytics', 'backup', 'search', 'csv', 'forecast'];

/** Interpolation values for feature copy (the free-tier caps quoted in "No limits"). */
export const FEATURE_COPY_PARAMS = { loans: FREE_LOAN_LIMIT, persons: FREE_PERSON_LIMIT } as const;
