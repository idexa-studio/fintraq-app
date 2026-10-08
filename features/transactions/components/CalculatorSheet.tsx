import { Button, Keypad, Money, Sheet, Text, useTheme } from '@/design';
import { amountValue, pressAmountKey } from '@/shared/format/amount-entry';
import { isExpression } from '@/shared/format/calculate';
import { formatCurrency } from '@/shared/format/money';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type CalculatorSheetProps = {
  visible: boolean;
  onClose: () => void;
  currency: string;
  /** Receives what the sum came to. */
  onUse: (amount: number) => void;
};

/** Works out an amount, e.g. a bill split or several items added up, and hands back the answer. */
export function CalculatorSheet({ visible, onClose, currency, onUse }: CalculatorSheetProps) {
  const { t } = useTranslation('transactions');
  const { space } = useTheme();
  const [sum, setSum] = useState('');
  const result = amountValue(sum);
  const close = () => {
    setSum('');
    onClose();
  };
  return (
    <Sheet
      visible={visible}
      onClose={close}
      title={t('calculator.title')}
      footer={<Button label={t('calculator.use')} disabled={!result} onPress={() => { if (result) onUse(result); close(); }} />}
    >
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Text variant="callout" tone="muted">{isExpression(sum) ? sum : t('amount')}</Text>
        <Money value={formatCurrency(result ?? 0, currency)} variant="amountHero" tone={result ? 'default' : 'muted'} />
      </View>
      <Keypad operators onKey={(key) => setSum((text) => pressAmountKey(text, key))} />
    </Sheet>
  );
}
