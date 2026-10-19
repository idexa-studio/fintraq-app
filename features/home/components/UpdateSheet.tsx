import { Button, Sheet, Text } from '@/design';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

type UpdateSheetProps = {
  /** The version on offer, as the store names it; the sheet shows while there is one. */
  version: string | null;
  /** Goes to the store. */
  onUpdate: () => void;
  onClose: () => void;
};

/**
 * A newer Fintraq is in the store: offered once over Home, with the one reassurance that matters
 * and one way on. Unlike the update screen, nothing is blocked; it can be put off.
 */
export function UpdateSheet({ version, onUpdate, onClose }: UpdateSheetProps) {
  const { t } = useTranslation('home');
  // Kept while the sheet slides away, so its title does not empty as it goes.
  const [shown, setShown] = useState(version);
  if (version !== null && version !== shown) setShown(version);
  return (
    <Sheet
      visible={version !== null}
      onClose={onClose}
      title={t('prompt.update.title', { version: shown ?? '' })}
      footer={
        <>
          <Button label={t('prompt.update.link')} onPress={onUpdate} />
          <Button label={t('prompt.update.dismiss')} variant="link" onPress={onClose} />
        </>
      }
    >
      <Text variant="body" tone="muted">{t('prompt.update.body')}</Text>
    </Sheet>
  );
}
