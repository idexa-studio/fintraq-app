import type { Account } from '@/data/repositories/accounts';
import type { Category } from '@/data/repositories/categories';
import type { Person } from '@/data/repositories/people';
import { Button, Calendar, Card, IconCircle, ListGroup, ListRow, OptionList, Sheet, TextField, resolveIcon, useTheme } from '@/design';
import type { OptionGroup } from '@/design';
import { accountTypeIcon } from '@/features/accounts';
import { NO_FILTERS, PERIODS, activeCount } from '@/features/activity/activity-filters';
import type { ActivityFilters, Period } from '@/features/activity/activity-filters';
import { formatDate } from '@/shared/date/date';
import { colorNumberToHex } from '@/shared/format/color';
import type { TFunction } from 'i18next';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const ANY = 'any';
const shortDay = (date: Date) => formatDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map((word) => word[0]).join('');

/** The dates filter in words: a named period, or the two ends of a custom range. */
export function periodLabel(filters: ActivityFilters, t: TFunction<'activity'>): string {
  if (filters.period !== 'custom') return t(`periods.${filters.period}`);
  if (filters.from && filters.to) return t('customRange', { from: shortDay(filters.from), to: shortDay(filters.to) });
  if (filters.from) return t('since', { from: shortDay(filters.from) });
  if (filters.to) return t('until', { to: shortDay(filters.to) });
  return t('periods.custom');
}

type Props = {
  visible: boolean;
  onClose: () => void;
  filters: ActivityFilters;
  /** Called on every change: the list behind the sheet follows as filters are set. */
  onChange: (filters: ActivityFilters) => void;
  accounts: readonly Account[];
  categories: readonly Category[];
  people: readonly Person[];
};

type Picker = 'dates' | 'account' | 'category' | 'person' | 'from' | 'to' | null;

/**
 * Everything Activity can be narrowed to, on one sheet: dates, account,
 * category, person. Each row opens its choices as a sheet stacked over this
 * one. Changes apply at once, so there is nothing to submit.
 */
export function ActivityFilterSheet({ visible, onClose, filters, onChange, accounts, categories, people }: Props) {
  const { t } = useTranslation('activity');
  const { space } = useTheme();
  const [picker, setPicker] = useState<Picker>(null);
  const back = () => setPicker(null);

  const any = { key: ANY, title: t('filter.any') };
  const accountGroups: OptionGroup[] = [{ options: [any] }, { options: accounts.map((a) => ({ key: String(a.id), title: a.name, leading: <IconCircle icon={accountTypeIcon(a.accountType)} color={colorNumberToHex(a.color)} /> })) }];
  const categoryGroups: OptionGroup[] = [{ options: [any] }, { options: categories.map((c) => ({ key: String(c.id), title: c.name, leading: <IconCircle icon={resolveIcon(c.icon, 'tag')} color={colorNumberToHex(c.color)} /> })) }];
  const personGroups: OptionGroup[] = [{ options: [any] }, { options: people.map((p) => ({ key: String(p.id), title: p.name, leading: <IconCircle initials={initialsOf(p.name)} color={colorNumberToHex(p.color)} /> })) }];
  const periodGroups: OptionGroup[] = [{ options: PERIODS.map((period) => ({ key: period, title: t(`periods.${period}`) })) }];

  const idOf = (key: string) => (key === ANY ? undefined : Number(key));
  const keyOf = (id: number | undefined) => (id === undefined ? ANY : String(id));

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title={t('filter.title')}
        footer={
          <>
            <Button label={t('filter.done')} onPress={onClose} />
            <Button label={t('filter.clear')} variant="text" disabled={activeCount(filters) === 0} onPress={() => onChange(NO_FILTERS)} />
          </>
        }
      >
        <ListGroup>
          <ListRow icon="calendar" title={t('filter.dates')} value={periodLabel(filters, t)} onPress={() => setPicker('dates')} />
          <ListRow icon="wallet" title={t('filter.account')} value={accounts.find((a) => a.id === filters.accountId)?.name ?? t('filter.any')} onPress={() => setPicker('account')} />
          <ListRow icon="tag" title={t('filter.category')} value={categories.find((c) => c.id === filters.categoryId)?.name ?? t('filter.any')} onPress={() => setPicker('category')} />
          {people.length > 0 ? <ListRow icon="user" title={t('filter.person')} value={people.find((p) => p.id === filters.personId)?.name ?? t('filter.any')} onPress={() => setPicker('person')} /> : null}
        </ListGroup>
        {filters.period === 'custom' ? (
          <Card style={{ gap: space.lg }}>
            <TextField label={t('filter.from')} value={filters.from ? shortDay(filters.from) : t('filter.open_end')} onPress={() => setPicker('from')} />
            <TextField label={t('filter.to')} value={filters.to ? shortDay(filters.to) : t('filter.open_end')} onPress={() => setPicker('to')} />
          </Card>
        ) : null}
      </Sheet>

      <Sheet visible={visible && picker === 'dates'} onClose={back} title={t('filter.dates')}>
        <OptionList groups={periodGroups} selectedKey={filters.period} onSelect={(key) => { onChange({ ...filters, period: key as Period }); back(); }} />
      </Sheet>
      <Sheet visible={visible && picker === 'account'} onClose={back} title={t('filter.account')}>
        <OptionList groups={accountGroups} selectedKey={keyOf(filters.accountId)} onSelect={(key) => { onChange({ ...filters, accountId: idOf(key) }); back(); }} />
      </Sheet>
      <Sheet visible={visible && picker === 'category'} onClose={back} title={t('filter.category')}>
        <OptionList groups={categoryGroups} selectedKey={keyOf(filters.categoryId)} onSelect={(key) => { onChange({ ...filters, categoryId: idOf(key) }); back(); }} />
      </Sheet>
      <Sheet visible={visible && picker === 'person'} onClose={back} title={t('filter.person')}>
        <OptionList groups={personGroups} selectedKey={keyOf(filters.personId)} onSelect={(key) => { onChange({ ...filters, personId: idOf(key) }); back(); }} />
      </Sheet>
      <Sheet visible={visible && (picker === 'from' || picker === 'to')} onClose={back} title={picker === 'to' ? t('filter.pickTo') : t('filter.pickFrom')}>
        <Card>
          <View>
            <Calendar
              value={(picker === 'to' ? filters.to : filters.from) ?? new Date()}
              max={new Date()}
              onChange={(day) => { onChange(picker === 'to' ? { ...filters, to: day } : { ...filters, from: day }); back(); }}
            />
          </View>
        </Card>
      </Sheet>
    </>
  );
}
