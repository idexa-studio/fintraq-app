import type { Account } from '@/data/repositories/accounts';
import type { Category } from '@/data/repositories/categories';
import type { Person } from '@/data/repositories/people';
import { Button, Calendar, Card, Chip, IconCircle, OptionList, Sheet, Text, TimePicker, resolveIcon, useTheme } from '@/design';
import type { OptionGroup } from '@/design';
import { accountTypeIcon } from '@/features/accounts';
import { colorNumberToHex } from '@/shared/format/color';
import { formatCurrency } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type PickerProps<T> = { visible: boolean; onClose: () => void; selectedId: number | null; onSelect: (id: T) => void };

const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

/** Chooses one and closes: every picker on the entry screen behaves the same way. */
function PickerSheet({ title, visible, onClose, groups, selectedKey, onSelect }: { title: string; visible: boolean; onClose: () => void; groups: OptionGroup[]; selectedKey?: string; onSelect: (key: string) => void }) {
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <OptionList groups={groups} selectedKey={selectedKey} onSelect={(key) => { onSelect(key); onClose(); }} />
    </Sheet>
  );
}

export function AccountPicker({ title, accounts, ...picker }: PickerProps<number> & { title: string; accounts: readonly Account[] }) {
  const { t } = useTranslation('common');
  const groups: OptionGroup[] = [{
    options: accounts.map((account) => ({
      key: String(account.id),
      title: account.name,
      subtitle: t(`accountTypes.${account.accountType ?? 'bank'}`),
      value: formatCurrency(account.balance, account.currency),
      leading: <IconCircle icon={accountTypeIcon(account.accountType)} color={colorNumberToHex(account.color)} />,
    })),
  }];
  return <PickerSheet title={title} visible={picker.visible} onClose={picker.onClose} groups={groups} selectedKey={picker.selectedId == null ? undefined : String(picker.selectedId)} onSelect={(key) => picker.onSelect(Number(key))} />;
}

export function CategoryPicker({ categories, ...picker }: PickerProps<number> & { categories: readonly Category[] }) {
  const { t } = useTranslation('transactions');
  const groups: OptionGroup[] = [{
    options: categories.map((category) => ({
      key: String(category.id),
      title: category.name,
      leading: <IconCircle icon={resolveIcon(category.icon, 'tag')} color={colorNumberToHex(category.color)} />,
    })),
  }];
  return <PickerSheet title={t('pick.category')} visible={picker.visible} onClose={picker.onClose} groups={groups} selectedKey={picker.selectedId == null ? undefined : String(picker.selectedId)} onSelect={(key) => picker.onSelect(Number(key))} />;
}

const NO_ONE = 'none';

export function PersonPicker({ people, ...picker }: PickerProps<number | null> & { people: readonly Person[] }) {
  const { t } = useTranslation('transactions');
  const groups: OptionGroup[] = [
    { options: [{ key: NO_ONE, title: t('noPerson'), icon: 'x-circle' }] },
    { options: people.map((person) => ({ key: String(person.id), title: person.name, leading: <IconCircle initials={initialsOf(person.name)} color={colorNumberToHex(person.color)} /> })) },
  ];
  return <PickerSheet title={t('pick.person')} visible={picker.visible} onClose={picker.onClose} groups={groups} selectedKey={picker.selectedId == null ? NO_ONE : String(picker.selectedId)} onSelect={(key) => picker.onSelect(key === NO_ONE ? null : Number(key))} />;
}

type WhenPickerProps = { visible: boolean; onClose: () => void; value: Date; onChange: (value: Date) => void };

/** The day, with shortcuts for the two days most entries are for, and the time under it. */
export function WhenPicker({ visible, onClose, value, onChange }: WhenPickerProps) {
  const { t } = useTranslation(['transactions', 'common']);
  const { space } = useTheme();
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  // Changing the day keeps the time, and changing the time keeps the day.
  const setDay = (day: Date) => onChange(new Date(day.getFullYear(), day.getMonth(), day.getDate(), value.getHours(), value.getMinutes()));
  const setTime = (hour: number, minute: number) => onChange(new Date(value.getFullYear(), value.getMonth(), value.getDate(), hour, minute));

  return (
    <Sheet visible={visible} onClose={onClose} title={t('pick.date')} footer={<Button label={t('pick.done')} onPress={onClose} />}>
      <View style={{ flexDirection: 'row', gap: space.md }}>
        <Chip label={t('common:today')} selected={sameDay(value, today)} onPress={() => setDay(today)} />
        <Chip label={t('common:yesterday')} selected={sameDay(value, yesterday)} onPress={() => setDay(yesterday)} />
      </View>
      {/* Keyed by the day so a shortcut also turns the calendar to that month. */}
      <Card><Calendar key={value.toDateString()} value={value} onChange={setDay} /></Card>
      <View style={{ gap: space.sm }}>
        <Text variant="bodyStrong">{t('pick.time')}</Text>
        <Card style={{ alignItems: 'center' }}>
          <TimePicker value={{ hour: value.getHours(), minute: value.getMinutes() }} onChange={(time) => setTime(time.hour, time.minute)} minuteStep={1} />
        </Card>
      </View>
    </Sheet>
  );
}
