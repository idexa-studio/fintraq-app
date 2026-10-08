import { PRO_FEATURE_COPY, PRO_PILLAR_COPY } from '@/features/pro/pro-copy.en';
import {
  FREE_LIMITS, LEGACY_FEATURE_IDS, LIVE_FEATURES, PRO_FEATURES, PRO_FEATURE_IDS, PRO_PILLARS, UPCOMING_FEATURES, featuresIn, isOverFreeLimit,
  resolveProFeature,
} from '@/features/pro/pro-features';

/** Every feature id the shipped app (1.2.4) gates or links to. */
const SHIPPED_IDS = ['analytics', 'highlights', 'categories', 'people', 'forecast', 'weekly', 'insights', 'search', 'csv', 'backup', 'unlimited'];

describe('Pro registry', () => {
  it('has copy for every feature and every pillar', () => {
    for (const id of PRO_FEATURE_IDS) {
      expect(PRO_FEATURE_COPY[id].title.length).toBeGreaterThan(0);
      expect(PRO_FEATURE_COPY[id].description.length).toBeGreaterThan(0);
    }
    for (const pillar of PRO_PILLARS) expect(PRO_PILLAR_COPY[pillar].promise.length).toBeGreaterThan(0);
  });

  it('puts every feature in a pillar that exists, and leaves no pillar empty', () => {
    for (const id of PRO_FEATURE_IDS) expect(PRO_PILLARS).toContain(PRO_FEATURES[id].pillar);
    for (const pillar of PRO_PILLARS) expect(featuresIn(pillar).length).toBeGreaterThan(0);
  });

  it('splits features into live and upcoming with nothing lost', () => {
    expect([...LIVE_FEATURES, ...UPCOMING_FEATURES].sort()).toEqual([...PRO_FEATURE_IDS].sort());
  });

  // Existing buyers and old links: nothing the shipped app sold may disappear.
  it('keeps every feature of the shipped app, as a live feature', () => {
    for (const id of SHIPPED_IDS) {
      const current = resolveProFeature(id);
      expect(`${id}:${current && PRO_FEATURES[current].status}`).toBe(`${id}:live`);
    }
    expect(Object.keys(LEGACY_FEATURE_IDS).sort()).toEqual([...SHIPPED_IDS].sort());
  });

  it('resolves current ids to themselves and rejects unknown ones', () => {
    expect(resolveProFeature('budgets')).toBe('budgets');
    expect(resolveProFeature('nope')).toBeUndefined();
    expect(resolveProFeature(undefined)).toBeUndefined();
  });

  it('never lowers the free caps the shipped app has', () => {
    expect(FREE_LIMITS.people).toBeGreaterThanOrEqual(10);
    expect(FREE_LIMITS.loans).toBeGreaterThanOrEqual(3);
  });

  it('asks for Pro at the limit, not before', () => {
    expect(isOverFreeLimit('loans', FREE_LIMITS.loans - 1)).toBe(false);
    expect(isOverFreeLimit('loans', FREE_LIMITS.loans)).toBe(true);
  });
});
