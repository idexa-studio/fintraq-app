import { Specimen } from '@/features/gallery/components/Specimen';
import {
  Button, Calendar, Card, Chip, IconCircle, IconGrid, ListGroup, ListRow, OptionList, PASTELS, Section, SheetPanel, SwatchGrid, Text, TextField, TimePicker,
  IconButton, useTheme,
} from '@/design';
import type { IconName, OptionGroup, TimeValue } from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

const CURRENCIES: OptionGroup[] = [
  { title: 'Suggested', options: [{ key: 'USD', title: 'US dollar', value: 'USD', keywords: '$' }, { key: 'INR', title: 'Indian rupee', value: 'INR', keywords: '₹' }] },
  {
    title: 'All currencies',
    options: [
      { key: 'AUD', title: 'Australian dollar', value: 'AUD' }, { key: 'GBP', title: 'British pound', value: 'GBP', keywords: '£ sterling' },
      { key: 'EUR', title: 'Euro', value: 'EUR', keywords: '€' }, { key: 'JPY', title: 'Japanese yen', value: 'JPY', keywords: '¥' },
      { key: 'TRY', title: 'Turkish lira', value: 'TRY', keywords: '₺' },
    ],
  },
];

const ACCOUNTS: OptionGroup[] = [{
  options: [
    { key: 'everyday', title: 'Everyday', subtitle: 'Bank account', value: '$12,480.10', leading: <IconCircle icon="bank" color="lilac" /> },
    { key: 'cash', title: 'Cash', subtitle: 'Wallet', value: '$227.17', leading: <IconCircle icon="cash" color="green" /> },
    { key: 'travel', title: 'Travel card', subtitle: 'Credit card', value: '−$640.00', leading: <IconCircle icon="credit-card" color="orange" /> },
  ],
}];

const CATEGORIES: OptionGroup[] = [{
  options: [
    { key: 'groceries', title: 'Groceries', leading: <IconCircle icon="shopping-cart" color="teal" /> },
    { key: 'transport', title: 'Transport', leading: <IconCircle icon="car" color="orange" /> },
    { key: 'eating', title: 'Eating out', leading: <IconCircle icon="fork-knife" color="pink" /> },
  ],
}];

const PEOPLE: OptionGroup[] = [{
  options: [
    { key: 'rk', title: 'Rahul Kumar', subtitle: 'Owes you $120.00', leading: <IconCircle initials="RK" color="pink" /> },
    { key: 'as', title: 'Aylin Sahin', subtitle: 'You owe $60.00', leading: <IconCircle initials="AS" color="lilac" /> },
  ],
}];

const SORTS: OptionGroup[] = [{
  options: [
    { key: 'newest', title: 'Newest first' }, { key: 'oldest', title: 'Oldest first' },
    { key: 'largest', title: 'Largest amount first' }, { key: 'smallest', title: 'Smallest amount first' },
  ],
}];

const ICONS: { title: string; icons: IconName[] }[] = [
  { title: 'Food and drink', icons: ['shopping-cart', 'fork-knife', 'coffee', 'beer', 'pizza', 'shopping-basket'] },
  { title: 'Getting around', icons: ['car', 'bus', 'train', 'airplane', 'bike', 'boat'] },
  { title: 'Home', icons: ['house', 'bulb', 'wrench', 'wifi', 'droplets', 'flame'] },
];

const RECENT = ['groceries', 'rent october', 'Rahul'];

/** Everything that is chosen rather than typed, plus filtering and search. */
export function PickersSection() {
  const { colors, space, size } = useTheme();
  const [day, setDay] = useState(new Date());
  const [time, setTime] = useState<TimeValue>({ hour: 20, minute: 0 });
  const [currency, setCurrency] = useState('USD');
  const [account, setAccount] = useState('everyday');
  const [category, setCategory] = useState('groceries');
  const [person, setPerson] = useState('rk');
  const [sort, setSort] = useState('newest');
  const [swatch, setSwatch] = useState('teal');
  const [icon, setIcon] = useState<IconName>('shopping-cart');
  const [kinds, setKinds] = useState(['Expenses']);
  const [applied, setApplied] = useState(['Expenses', 'Everyday', 'This month']);
  const swatches = [
    ...Object.entries(PASTELS).map(([key, color]) => ({ key, color, label: key })),
    { key: 'brand', color: colors.brand, label: 'green' }, { key: 'accent', color: colors.accent, label: 'bright green' }, { key: 'warning', color: colors.warning, label: 'amber' },
  ];
  const sheet = { backgroundColor: colors.scrim, paddingTop: space.xl };
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  return (
    <>
      <Section title="Date and time">
        <Specimen name="Date" note="A month to pick a day from. Two shortcuts cover most entries; days ahead are off for a transaction.">
          <View style={sheet}>
            <SheetPanel title="When was it?" onClose={() => {}} footer={<Button label="Done" />}>
              <View style={{ flexDirection: 'row', gap: space.md }}>
                <Chip label="Today" selected={day.toDateString() === today.toDateString()} onPress={() => setDay(today)} />
                <Chip label="Yesterday" selected={day.toDateString() === yesterday.toDateString()} onPress={() => setDay(yesterday)} />
              </View>
              <Card><Calendar key={day.toDateString()} value={day} onChange={setDay} max={today} /></Card>
            </SheetPanel>
          </View>
        </Specimen>
        <Specimen name="Time" note="For the daily reminder: step the hour and the minute.">
          <Card style={{ alignItems: 'center' }}><TimePicker value={time} onChange={setTime} /></Card>
        </Specimen>
      </Section>

      <Section title="Choosing one">
        <Specimen name="Currency" note="Search by name, code or symbol. Suggested ones come first.">
          <OptionList groups={CURRENCIES} selectedKey={currency} onSelect={setCurrency} searchPlaceholder="Search currencies" />
        </Specimen>
        <Specimen name="Account" note="Each with its balance, so the choice is informed.">
          <OptionList groups={ACCOUNTS} selectedKey={account} onSelect={setAccount} />
        </Specimen>
        <Specimen name="Category" note="With a way to make a new one without leaving.">
          <OptionList groups={CATEGORIES} selectedKey={category} onSelect={setCategory} addLabel="Add a category" />
        </Specimen>
        <Specimen name="Person">
          <OptionList groups={PEOPLE} selectedKey={person} onSelect={setPerson} addLabel="Add a person" />
        </Specimen>
        <Specimen name="Sort" note="A short list of orders; the current one ticked.">
          <OptionList groups={SORTS} selectedKey={sort} onSelect={setSort} />
        </Specimen>
      </Section>

      <Section title="Colour and icon">
        <Specimen name="Colour" note="From the saved palette. The chosen one is ringed and ticked.">
          <Card><SwatchGrid swatches={swatches} selectedKey={swatch} onSelect={setSwatch} /></Card>
        </Specimen>
        <Specimen name="Icon" note="Grouped. The chosen one previews on its colour.">
          <Card><IconGrid groups={ICONS} selected={icon} onSelect={setIcon} color={swatches.find((s) => s.key === swatch)?.color ?? colors.brandTint} /></Card>
        </Specimen>
      </Section>

      <Section title="Filter and search">
        <Specimen name="Applied filters" note="What is narrowing the list, each removable, above the results.">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
            {applied.map((label) => <Chip key={label} label={label} onRemove={() => setApplied(applied.filter((a) => a !== label))} />)}
            {applied.length ? <Chip label="Clear all" onPress={() => setApplied([])} /> : <Chip label="Filter" menu onPress={() => setApplied(['Expenses', 'Everyday', 'This month'])} />}
          </View>
        </Specimen>
        <Specimen name="Filter sheet" note="Every way to narrow the list on one sheet. The button says how many it leaves.">
          <View style={sheet}>
            <SheetPanel title="Filter" onClose={() => {}} footer={<><Button label="Show 42 transactions" /><Button label="Clear all" variant="text" /></>}>
              <View style={{ gap: space.md }}>
                <Text variant="bodyStrong">Kind</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
                  {['Expenses', 'Income', 'Transfers'].map((label) => (
                    <Chip key={label} label={label} selected={kinds.includes(label)} onPress={() => setKinds(kinds.includes(label) ? kinds.filter((k) => k !== label) : [...kinds, label])} />
                  ))}
                </View>
              </View>
              <ListGroup>
                <ListRow icon="bank" title="Account" value="Everyday" onPress={() => {}} />
                <ListRow icon="tag" title="Category" value="Any" onPress={() => {}} />
                <ListRow icon="user" title="Person" value="Any" onPress={() => {}} />
                <ListRow icon="calendar" title="Dates" value="This month" onPress={() => {}} />
              </ListGroup>
              <View style={{ gap: space.md }}>
                <Text variant="bodyStrong">Amount</Text>
                <View style={{ flexDirection: 'row', gap: space.md }}>
                  <View style={{ flex: 1 }}><TextField label="From" placeholder="Any" keyboardType="decimal-pad" /></View>
                  <View style={{ flex: 1 }}><TextField label="To" placeholder="Any" keyboardType="decimal-pad" /></View>
                </View>
              </View>
            </SheetPanel>
          </View>
        </Specimen>
        <Specimen name="Search" note="The field, then what was searched before, each one tap to repeat.">
          <TextField icon="search" placeholder="Search everything" accessibilityLabel="Search everything" />
          <ListGroup>
            {RECENT.map((term) => (
              <ListRow key={term} icon="history" title={term} onPress={() => {}} trailing={<IconButton icon="x" size={size.iconSmall} accessibilityLabel={`Forget ${term}`} />} />
            ))}
          </ListGroup>
        </Specimen>
      </Section>
    </>
  );
}
