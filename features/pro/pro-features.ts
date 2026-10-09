import type { IconName } from '@/design';

/**
 * Everything Fintraq Pro is, in one place: the paywall, every gate and every
 * limit read from here, so a feature cannot be locked without being
 * advertised or advertised without existing. The reasoning is in
 * docs/PRODUCT.md.
 */

/** The four jobs Pro does, in the order the paywall presents them. */
export const PRO_PILLARS = ['plan', 'understand', 'find', 'protect'] as const;
export type ProPillar = (typeof PRO_PILLARS)[number];

/**
 * live: in the app today. next: the version being built now (`docs/PLAN.md`).
 * later: the versions after it. Only live features may be gated or sold as included.
 */
export type ProStatus = 'live' | 'next' | 'later';

type ProFeature = { pillar: ProPillar; icon: IconName; status: ProStatus };

export const PRO_FEATURES = {
  budgets: { pillar: 'plan', icon: 'pie-chart', status: 'live' },
  recurring: { pillar: 'plan', icon: 'repeat', status: 'later' },
  goals: { pillar: 'plan', icon: 'flag', status: 'later' },
  safeToSpend: { pillar: 'plan', icon: 'dashboard-speed', status: 'later' },

  periods: { pillar: 'understand', icon: 'chart-line-data', status: 'live' },
  forecast: { pillar: 'understand', icon: 'trending-up-down', status: 'live' },
  categories: { pillar: 'understand', icon: 'chart-pie', status: 'live' },
  rhythm: { pillar: 'understand', icon: 'chart-bar', status: 'live' },
  people: { pillar: 'understand', icon: 'users', status: 'live' },
  insights: { pillar: 'understand', icon: 'sparkle', status: 'live' },
  netWorthTrend: { pillar: 'understand', icon: 'chart-up', status: 'later' },

  search: { pillar: 'find', icon: 'search', status: 'live' },
  export: { pillar: 'find', icon: 'download-simple', status: 'live' },
  statement: { pillar: 'find', icon: 'file-text', status: 'later' },

  backup: { pillar: 'protect', icon: 'cloud-arrow-up', status: 'live' },
  unlimited: { pillar: 'protect', icon: 'infinity-circle', status: 'live' },
} as const satisfies Record<string, ProFeature>;

export type ProFeatureId = keyof typeof PRO_FEATURES;

export const PRO_FEATURE_IDS = Object.keys(PRO_FEATURES) as ProFeatureId[];

export const isProFeatureId = (value: unknown): value is ProFeatureId => typeof value === 'string' && value in PRO_FEATURES;

export const featuresIn = (pillar: ProPillar, status?: ProStatus): ProFeatureId[] =>
  PRO_FEATURE_IDS.filter((id) => PRO_FEATURES[id].pillar === pillar && (!status || PRO_FEATURES[id].status === status));

/** What can be sold as included today. */
export const LIVE_FEATURES = PRO_FEATURE_IDS.filter((id) => PRO_FEATURES[id].status === 'live');

/** Shown on the paywall as "coming to Pro, included in your purchase". */
export const UPCOMING_FEATURES = PRO_FEATURE_IDS.filter((id) => PRO_FEATURES[id].status !== 'live');

/**
 * How many of each the free plan allows before `unlimited` is needed. People
 * and loans keep the caps the shipped app has always had; lowering either
 * would take something away from existing free users.
 */
export const FREE_LIMITS = {
  people: 10,
  loans: 3,
  budgets: 1,
  recurring: 2,
  goals: 1,
} as const;

export type LimitedThing = keyof typeof FREE_LIMITS;

/** True when adding one more needs Pro. */
export const isOverFreeLimit = (thing: LimitedThing, current: number): boolean => current >= FREE_LIMITS[thing];

/**
 * Feature ids used by the shipped app, mapped to today's. Old paywall links
 * (`/premium?feature=highlights`), saved analytics dimensions and anything a
 * notification still carries keep resolving to the right place.
 */
export const LEGACY_FEATURE_IDS: Record<string, ProFeatureId> = {
  analytics: 'periods',
  highlights: 'insights',
  categories: 'categories',
  people: 'people',
  forecast: 'forecast',
  weekly: 'rhythm',
  insights: 'insights',
  search: 'search',
  csv: 'export',
  backup: 'backup',
  unlimited: 'unlimited',
};

/** Resolves a current or legacy id; undefined when it is neither. */
export const resolveProFeature = (value: unknown): ProFeatureId | undefined => {
  if (isProFeatureId(value)) return value;
  return typeof value === 'string' ? LEGACY_FEATURE_IDS[value] : undefined;
};
