import type { RecurringRuleView } from '@/data/repositories/recurring';
import { AmountField, Button, Sheet, Text } from '@/design';
import { useRepeatWords } from '@/features/recurring/hooks/useRepeatWords';
import type { Waiting } from '@/features/recurring/recurring-view';
import { getCurrencySymbol } from '@/shared/currency/currencies';
import { parseAmountInput } from '@/shared/format/amount';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

export type AddDueSheetProps = {
  /** The occurrence being added; null when the sheet is closed. */
  work: Waiting<RecurringRuleView> | null;
  onClose: () => void;
  onAdd: (work: Waiting<RecurringRuleView>, amount: number) => void;
};

/** Adds a waiting occurrence with its amount changed, for a bill that came to a different figure this time. */
export function AddDueSheet({ work, onClose, onAdd }: AddDueSheetProps) {
  const { t } = useTranslation(['recurring', 'transactions']);
  const words = useRepeatWords();
  const [amountText, setAmountText] = useState('');
  const [openedFor, setOpenedFor] = useState<Waiting<RecurringRuleView> | null>(null);
  // Each time it opens, it starts from the item's own amount.
  if (work !== openedFor) {
    setOpenedFor(work);
    if (work) setAmountText(String(work.rule.amount));
  }
  const amount = parseAmountInput(amountText);
  const currency = work?.rule.account?.currency ?? '';

  return (
    <Sheet
      visible={work !== null}
      onClose={onClose}
      title={work ? words.name(work.rule) : ''}
      footer={<Button label={t('due.add')} disabled={!amount || amount <= 0} onPress={() => { if (work && amount) onAdd(work, amount); }} />}
    >
      {work ? <Text variant="callout" tone="muted">{t('due.sheetHint', { date: words.day(work.day) })}</Text> : null}
      <AmountField value={amountText} onChangeText={setAmountText} symbol={getCurrencySymbol(currency)} accessibilityLabel={t('transactions:amount')} focusOnArrival />
    </Sheet>
  );
}
