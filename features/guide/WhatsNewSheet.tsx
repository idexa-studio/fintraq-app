import { Button, ListRow, Sheet } from '@/design';
import type { IconName } from '@/design';
import React from 'react';
import { useTranslation } from 'react-i18next';

const POINTS = [
  { id: 'tabs', icon: 'squares-four' },
  { id: 'settings', icon: 'user-circle' },
  { id: 'budgets', icon: 'pie-chart' },
  { id: 'records', icon: 'shield-check' },
] as const satisfies readonly { id: string; icon: IconName }[];

type WhatsNewSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/** The things that changed, each a mark, a bold line and a sentence. */
export function WhatsNewPoints() {
  const { t } = useTranslation('guide');
  return (
    <>
      {POINTS.map((point) => (
        <ListRow key={point.id} icon={point.icon} strong title={t(`whatsNew.${point.id}.title`)} subtitle={t(`whatsNew.${point.id}.body`)} />
      ))}
    </>
  );
}

/** What changed in this release, for someone who knew the app before: a few lines and one way out. */
export function WhatsNewSheet({ visible, onClose }: WhatsNewSheetProps) {
  const { t } = useTranslation('guide');
  return (
    <Sheet visible={visible} onClose={onClose} title={t('whatsNew.title')} footer={<Button label={t('whatsNew.done')} onPress={onClose} />}>
      <WhatsNewPoints />
    </Sheet>
  );
}
