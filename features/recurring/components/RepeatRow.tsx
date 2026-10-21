import { IconCircle, ListRow } from '@/design';
import { useRepeatWords } from '@/features/recurring/hooks/useRepeatWords';
import type { RepeatDraft } from '@/features/recurring/repeat-draft';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type RepeatRowProps = {
  value: RepeatDraft;
  onPress: () => void;
};

/** "Repeat" among the entry form's details: plain until chosen, like a person, then in colour with how it behaves. */
export function RepeatRow({ value, onPress }: RepeatRowProps) {
  const { t } = useTranslation('recurring');
  const words = useRepeatWords();
  const set = value.cadence !== null;
  return (
    <ListRow
      leading={set ? <IconCircle icon="repeat" color="lilac" /> : <IconCircle icon="repeat" plain />}
      strong
      title={set ? t(`cadence.${value.cadence!}`) : t('repeat.none')}
      subtitle={set ? words.summary(value) : t('repeat.label')}
      onPress={onPress}
    />
  );
}
