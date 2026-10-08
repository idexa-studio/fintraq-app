import { FREE_LIMITS } from '@/features/pro/pro-features';
import type { ProFeatureId, ProPillar } from '@/features/pro/pro-features';
import pro from '@/shared/i18n/copy/pro.en';
import { useTranslation } from 'react-i18next';

/** A feature's name and one-line description, and a pillar's name and promise, in the app's language. */
export function useProCopy() {
  const { t } = useTranslation('pro');
  return {
    feature: (id: ProFeatureId) => ({ title: t(`features.${id}.title`), description: t(`features.${id}.description`, FREE_LIMITS) }),
    pillar: (id: ProPillar) => ({ title: t(`pillars.${id}.title`), promise: t(`pillars.${id}.promise`) }),
  };
}

const filled = (text: string): string => text.replace(/\{\{(\w+)\}\}/g, (_, key: keyof typeof FREE_LIMITS) => String(FREE_LIMITS[key]));

/** The same copy as plain English, for the design gallery only, which is not translated. */
export const PRO_PILLAR_COPY: Record<ProPillar, { title: string; promise: string }> = pro.pillars;

export const PRO_FEATURE_COPY = Object.fromEntries(
  (Object.keys(pro.features) as ProFeatureId[]).map((id) => [id, { title: pro.features[id].title, description: filled(pro.features[id].description) }]),
) as Record<ProFeatureId, { title: string; description: string }>;
