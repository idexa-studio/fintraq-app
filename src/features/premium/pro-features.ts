import type { IconSource } from '@/src/components/ui';
import { FREE_LOAN_LIMIT, FREE_PERSON_LIMIT } from '@/src/constants/iap';

/**
 * Every Pro-only capability, in one place. Gates (`<ProGate>`, `useProAccess`), the paywall and the
 * upsell all read from here, so a feature can't be locked in the app without being advertised, or
 * advertised without being locked. Ids double as i18n keys under `premium.features.*`.
 */
export const PRO_FEATURES = {
  analytics: { icon: 'chart-line-data', group: 'analytics' },
  highlights: { icon: 'zap', group: 'analytics' },
  categories: { icon: 'chart-pie', group: 'analytics' },
  people: { icon: 'users', group: 'analytics' },
  forecast: { icon: 'trending-up-down', group: 'analytics' },
  weekly: { icon: 'chart-bar', group: 'analytics' },
  insights: { icon: 'sparkle', group: 'analytics' },
  search: { icon: 'search', group: 'tools' },
  csv: { icon: 'download-simple', group: 'tools' },
  backup: { icon: 'cloud-arrow-up', group: 'more' },
  unlimited: { icon: 'infinity-circle', group: 'more' },
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
