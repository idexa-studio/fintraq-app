import { Button, ListRow, Sheet, useTheme } from '@/design';
import type { IconName } from '@/design';
import { WHATS_NEW_POINTS } from '@/features/guide/guide-rules';
import type { WhatsNewNote } from '@/features/guide/guide-rules';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

/** The mark beside each line. */
const ICONS: Record<string, IconName> = {
  tabs: 'squares-four',
  settings: 'user-circle',
  budgets: 'pie-chart',
  repeating: 'repeat',
  upcoming: 'calendar',
  spendable: 'wallet',
  records: 'shield-check',
};

type WhatsNewSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Which note: the new look for someone from before 2.0, else what the latest release adds. */
  note?: WhatsNewNote;
};

type WhatsNewPointsProps = { note?: WhatsNewNote };

/**
 * What changed, drawn as the Pro offer is: each change a line icon, a bold line and a sentence,
 * close together so they read as one list. No colour: the sheet's headline says what it is.
 */
export function WhatsNewPoints({ note = 'latest' }: WhatsNewPointsProps) {
  const { t } = useTranslation('guide');
  const { space } = useTheme();
  return (
    <View style={{ gap: space.xs }}>
      {WHATS_NEW_POINTS[note].map((id) => (
        <ListRow key={id} icon={ICONS[id]} strong title={t(`whatsNew.${id}.title` as 'whatsNew.tabs.title')} subtitle={t(`whatsNew.${id}.body` as 'whatsNew.tabs.body')} />
      ))}
    </View>
  );
}

/** What changed in this release, for someone who knew the app before: a few lines and one way out. */
export function WhatsNewSheet({ visible, onClose, note = 'latest' }: WhatsNewSheetProps) {
  const { t } = useTranslation('guide');
  return (
    <Sheet visible={visible} onClose={onClose} title={note === 'newLook' ? t('whatsNew.title') : t('whatsNew.titleLatest')} footer={<Button label={t('whatsNew.done')} onPress={onClose} />}>
      <WhatsNewPoints note={note} />
    </Sheet>
  );
}
