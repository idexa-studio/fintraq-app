import { readLatest, updateToOffer } from '@/platform/config/update-rules';

const latest = { build: 80, version: '2.1.0' };

describe('telling someone a new version is out', () => {
  it('reads the release announced for each platform', () => {
    const config = { android: { build: 80, version: '2.1.0' }, ios: { build: 12, version: ' 2.1.0 ' } };
    expect(readLatest(config, 'android')).toEqual({ build: 80, version: '2.1.0' });
    expect(readLatest(config, 'ios')).toEqual({ build: 12, version: '2.1.0' });
  });

  it('announces nothing for a platform left empty, misspelt or zero', () => {
    expect(readLatest(null, 'android')).toBeNull();
    expect(readLatest({}, 'android')).toBeNull();
    expect(readLatest({ ios: { build: 0, version: '' } }, 'ios')).toBeNull();
    expect(readLatest({ android: { build: '80', version: '2.1.0' } }, 'android')).toBeNull();
    expect(readLatest({ android: { build: 80.5, version: '2.1.0' } }, 'android')).toBeNull();
    expect(readLatest({ android: { build: 80, version: '  ' } }, 'android')).toBeNull();
    expect(readLatest({ android: 'v80' }, 'android')).toBeNull();
  });

  it('offers a newer release', () => {
    expect(updateToOffer({ installedBuild: 74, latest, offeredBuild: null })).toEqual(latest);
  });

  it('offers nothing to the release itself, or to a newer one', () => {
    expect(updateToOffer({ installedBuild: 80, latest, offeredBuild: null })).toBeNull();
    expect(updateToOffer({ installedBuild: 81, latest, offeredBuild: null })).toBeNull();
  });

  it('offers each release once, and offers again when a newer one is announced', () => {
    expect(updateToOffer({ installedBuild: 74, latest, offeredBuild: 80 })).toBeNull();
    expect(updateToOffer({ installedBuild: 74, latest: { build: 85, version: '2.2.0' }, offeredBuild: 80 })).toEqual({ build: 85, version: '2.2.0' });
  });

  it('offers nothing when nothing is announced or its own build cannot be read', () => {
    expect(updateToOffer({ installedBuild: 74, latest: null, offeredBuild: null })).toBeNull();
    expect(updateToOffer({ installedBuild: 0, latest, offeredBuild: null })).toBeNull();
  });
});
