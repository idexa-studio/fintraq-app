import { openStore, useAnnouncedRelease } from '@/features/shell';
import { updateToOffer } from '@/platform/config/update-rules';
import { getAppBuildNumber } from '@/platform/config/version';
import { StorageKeys } from '@/shared/contracts/storage-keys';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * A newer release than this one, if the remote settings announce one and it has not been offered
 * on this phone yet. Taking it or putting it off both count: each release is offered once.
 */
export function useUpdateOffer() {
  const announced = useAnnouncedRelease();
  /** The build last offered here; undefined until it has been read, so nothing shows before. */
  const [offeredBuild, setOfferedBuild] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(StorageKeys.UPDATE_OFFERED_BUILD).catch(() => null).then((stored) => {
      const build = Number.parseInt(stored ?? '', 10);
      if (!cancelled) setOfferedBuild(Number.isFinite(build) ? build : null);
    });
    return () => { cancelled = true; };
  }, []);

  const release = offeredBuild === undefined ? null : updateToOffer({ installedBuild: getAppBuildNumber(), latest: announced, offeredBuild });

  const settle = () => {
    if (!release) return;
    setOfferedBuild(release.build);
    void AsyncStorage.setItem(StorageKeys.UPDATE_OFFERED_BUILD, String(release.build)).catch(() => {});
  };

  return {
    /** The release to offer now, or null. */
    release,
    update: () => {
      if (!announced) return;
      settle();
      void openStore();
    },
    dismiss: settle,
  };
}
