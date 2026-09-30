import en from '@/src/i18n/locales/en';
import { featuresInGroup, isProFeatureId, PRO_FEATURE_GROUPS, PRO_FEATURE_IDS, HEADLINE_FEATURES } from '@/src/features/premium/pro-features';

describe('Pro feature registry', () => {
  it('has paywall copy for every feature and group', () => {
    for (const id of PRO_FEATURE_IDS) {
      expect(en.premium.features[id].title).toBeTruthy();
      expect(en.premium.features[id].description).toBeTruthy();
    }
    for (const group of PRO_FEATURE_GROUPS) expect(en.premium.groups[group]).toBeTruthy();
  });

  it('puts every feature in exactly one listed group', () => {
    const grouped = PRO_FEATURE_GROUPS.flatMap(featuresInGroup);
    expect([...grouped].sort()).toEqual([...PRO_FEATURE_IDS].sort());
  });

  it('only headlines real features and validates route params', () => {
    expect(HEADLINE_FEATURES.every(isProFeatureId)).toBe(true);
    expect(isProFeatureId('csv')).toBe(true);
    expect(isProFeatureId('nope')).toBe(false);
    expect(isProFeatureId(undefined)).toBe(false);
  });
});
