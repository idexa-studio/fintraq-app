import { Notice } from '@/design';
import type { TipId } from '@/features/guide/guide-rules';
import { useTip } from '@/features/guide/useGuide';
import React from 'react';
import { useTranslation } from 'react-i18next';

type TabTipProps = {
  id: TipId;
  /** Whether what the tip describes is on screen now. */
  ready: boolean;
};

/** A tab's one-time tip: a quiet note at the top, closed for good with its cross. */
export function TabTip({ id, ready }: TabTipProps) {
  const { t } = useTranslation('guide');
  const tip = useTip(id, ready);
  if (!tip.visible) return null;
  return <Notice title={t(`tips.${id}.title`)} body={t(`tips.${id}.body`)} onDismiss={tip.dismiss} dismissLabel={t('tips.dismiss')} />;
}
