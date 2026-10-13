import { Button, ListRow, Sheet, useTheme } from '@/design';
import type { IconName } from '@/design';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

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

/**
 * What changed, drawn as the Pro offer is: each change a line icon, a bold line and a sentence,
 * close together so they read as one list. No colour: the sheet's headline says what it is.
 */
export function WhatsNewPoints() {
  const { t } = useTranslation('guide');
  const { space } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      {POINTS.map((point) => (
        <ListRow key={point.id} icon={point.icon} strong title={t(`whatsNew.${point.id}.title`)} subtitle={t(`whatsNew.${point.id}.body`)} />
      ))}
    </View>
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
