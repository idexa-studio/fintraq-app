import { OptionList, Sheet } from '@/design';
import type { OptionGroup } from '@/design';
import { CURRENCIES } from '@/shared/currency/currencies';
import type { Currency } from '@/shared/currency/currencies';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type CurrencyPickerProps = {
  visible: boolean;
  onClose: () => void;
  value: string;
  onChange: (code: string) => void;
  /** Currencies to offer first, e.g. the ones already held, so the usual choice needs no search. */
  suggested?: readonly string[];
};

const NONE: readonly string[] = [];

/** Every currency, searchable by name, code or symbol. Chooses one and closes. */
export function CurrencyPicker({ visible, onClose, value, onChange, suggested = NONE }: CurrencyPickerProps) {
  const { t } = useTranslation('accounts');
  const groups = useMemo<OptionGroup[]>(() => {
    const option = (currency: Currency) => ({ key: currency.code, title: currency.name, value: currency.code, keywords: `${currency.code} ${currency.symbol}` });
    const first = suggested.map((code) => CURRENCIES.find((currency) => currency.code === code)).filter((currency): currency is Currency => !!currency);
    if (first.length === 0) return [{ options: CURRENCIES.map(option) }];
    return [
      { title: t('form.currencies.yours'), options: first.map(option) },
      { title: t('form.currencies.all'), options: CURRENCIES.filter((currency) => !suggested.includes(currency.code)).map(option) },
    ];
  }, [suggested, t]);
  return (
    <Sheet visible={visible} onClose={onClose} title={t('form.pick.currency')}>
      <OptionList groups={groups} selectedKey={value} onSelect={(code) => { onChange(code); onClose(); }} searchPlaceholder={t('form.searchCurrency')} noMatch={(query) => t('form.noCurrency', { query })} />
    </Sheet>
  );
}
