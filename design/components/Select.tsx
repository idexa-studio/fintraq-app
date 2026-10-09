import { Chip } from '@/design/components/Chip';
import { OptionList } from '@/design/components/OptionList';
import { Sheet } from '@/design/components/Sheet';
import React, { useState } from 'react';

export type SelectOption<K extends string = string> = {
  key: K;
  /** Shown on the chip and in the list, e.g. "USD". */
  label: string;
  /** Extra words in the list only, e.g. "US dollar". */
  detail?: string;
};

export type SelectProps<K extends string = string> = {
  options: SelectOption<K>[];
  value: K;
  onChange?: (key: K) => void;
  /** The question the sheet asks, e.g. "Which currency?". */
  title: string;
  /** What is being chosen, for screen readers, e.g. "Currency". */
  accessibilityLabel: string;
  /** Draws the chip in black whatever the scheme, for use on the green wave card. */
  onBrand?: boolean;
};

/**
 * A short choice (a currency, a period): a chip showing the current one that
 * opens the options in a sheet, like every other choice in the app. A choice
 * that is a field of a form is a row opening the same sheet.
 */
export function Select<K extends string>({ options, value, onChange, title, accessibilityLabel, onBrand = false }: SelectProps<K>) {
  const [open, setOpen] = useState(false);
  const current = options.find((option) => option.key === value);

  return (
    <>
      <Chip menu onBrand={onBrand} label={current?.label ?? ''} onPress={() => setOpen(true)} accessibilityLabel={`${accessibilityLabel}: ${current?.label ?? ''}`} />
      <Sheet visible={open} onClose={() => setOpen(false)} title={title}>
        <OptionList
          groups={[{ options: options.map((option) => ({ key: option.key, title: option.label, subtitle: option.detail })) }]}
          selectedKey={value}
          onSelect={(key) => { setOpen(false); onChange?.(key); }}
        />
      </Sheet>
    </>
  );
}
