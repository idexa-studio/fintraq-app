/** A release announced in Remote Config (`latestVersionConfig`), for one platform. */
export type LatestVersion = { build: number; version: string };

/** What `latestVersionConfig` holds: the newest release on each store. */
export type LatestVersionConfig = { android?: unknown; ios?: unknown };

/**
 * The release announced for this platform, or none. Anything missing, misspelt or zero announces
 * nothing: a mistake in the console only keeps the offer away, it never shows a wrong one.
 */
export function readLatest(config: LatestVersionConfig | null, platform: 'android' | 'ios'): LatestVersion | null {
  const entry = config?.[platform];
  if (typeof entry !== 'object' || entry === null) return null;
  const { build, version } = entry as Record<string, unknown>;
  if (typeof build !== 'number' || !Number.isInteger(build) || build <= 0) return null;
  if (typeof version !== 'string' || version.trim() === '') return null;
  return { build, version: version.trim() };
}

export type UpdateMoment = {
  /** This app's own build. Zero when it cannot be read, which offers nothing. */
  installedBuild: number;
  latest: LatestVersion | null;
  /** The build last offered on this phone, whether it was taken or put off; null if none yet. */
  offeredBuild: number | null;
};

/**
 * The release to offer, if any: a newer one than this, not offered on this phone before. Each
 * announced build is offered once; announcing a newer one offers again.
 */
export function updateToOffer({ installedBuild, latest, offeredBuild }: UpdateMoment): LatestVersion | null {
  if (!latest || installedBuild <= 0 || installedBuild >= latest.build) return null;
  if (offeredBuild !== null && offeredBuild >= latest.build) return null;
  return latest;
}
