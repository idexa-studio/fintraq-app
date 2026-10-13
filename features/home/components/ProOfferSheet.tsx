import { Button, ListRow, Sheet } from '@/design';
import { PRO_FEATURES, PRO_PILLARS, featuresIn, useProCopy } from '@/features/pro';
import React from 'react';
import { useTranslation } from 'react-i18next';

/** One thing Pro adds from each of its four parts, so the sheet says what Pro is in four lines. */
const SHOWN = PRO_PILLARS.flatMap((pillar) => featuresIn(pillar, 'live').slice(0, 1));

/** What the offer says, without the sheet round it: for the gallery too. */
export function ProOfferPoints() {
  const copy = useProCopy();
  return (
    <>
      {SHOWN.map((id) => <ListRow key={id} icon={PRO_FEATURES[id].icon} strong title={copy.feature(id).title} subtitle={copy.feature(id).description} />)}
    </>
  );
}

type ProOfferSheetProps = {
  visible: boolean;
  /** Goes on to the Pro page, where the plans and prices are. */
  onSee: () => void;
  onClose: () => void;
};

/**
 * Fintraq Pro, offered to someone on the free plan who uses the app: now and then, over Home,
 * with what it adds and one way on. Closing it keeps it away for a fortnight.
 */
export function ProOfferSheet({ visible, onSee, onClose }: ProOfferSheetProps) {
  const { t } = useTranslation('home');
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={t('prompt.pro.title')}
      footer={
        <>
          <Button label={t('prompt.pro.link')} onPress={onSee} />
          <Button label={t('prompt.pro.dismiss')} variant="link" onPress={onClose} />
        </>
      }
    >
      <ProOfferPoints />
    </Sheet>
  );
}
