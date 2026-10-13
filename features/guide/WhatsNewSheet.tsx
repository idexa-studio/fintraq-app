import { Button, Emblem, IconCircle, ListRow, Message, Sheet, useTheme } from '@/design';
import type { IconName, PastelName } from '@/design';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const POINTS = [
  { id: 'tabs', icon: 'squares-four', color: 'lilac' },
  { id: 'settings', icon: 'user-circle', color: 'orange' },
  { id: 'budgets', icon: 'pie-chart', color: 'teal' },
  { id: 'records', icon: 'shield-check', color: 'pink' },
] as const satisfies readonly { id: string; icon: IconName; color: PastelName }[];

type WhatsNewSheetProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * What changed, as a picture and a few lines: the release's one sentence under an emblem, then
 * each change with its own coloured mark, a bold line and a sentence, close together so they
 * read as one list.
 */
export function WhatsNewPoints() {
  const { t } = useTranslation('guide');
  const { space } = useTheme();
  return (
    <>
      <Message illustration={<Emblem icon="sparkle" color="green" />} title={t('whatsNew.title')} />
      <View style={{ gap: space.xs }}>
        {POINTS.map((point) => (
          <ListRow key={point.id} leading={<IconCircle icon={point.icon} color={point.color} />} strong title={t(`whatsNew.${point.id}.title`)} subtitle={t(`whatsNew.${point.id}.body`)} />
        ))}
      </View>
    </>
  );
}

/** What changed in this release, for someone who knew the app before: a few lines and one way out. */
export function WhatsNewSheet({ visible, onClose }: WhatsNewSheetProps) {
  const { t } = useTranslation('guide');
  return (
    <Sheet visible={visible} onClose={onClose} title={t('whatsNew.heading')} footer={<Button label={t('whatsNew.done')} onPress={onClose} />}>
      <WhatsNewPoints />
    </Sheet>
  );
}
