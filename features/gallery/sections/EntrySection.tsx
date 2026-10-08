import { Specimen } from '@/features/gallery/components/Specimen';
import { Button, Card, CardStack, Chip, ChipRow, Divider, Header, IconButton, IconCircle, Keypad, ListGroup, ListRow, Money, Text, TextField, useTheme } from '@/design';
import type { KeypadKey, StackCard } from '@/design';
import { calculate, isExpression } from '@/shared/format/calculate';
import React, { useState } from 'react';
import { View } from 'react-native';

const KINDS = ['Expense', 'Income', 'Transfer'];

const press = (amount: string, key: KeypadKey): string => {
  if (key === 'delete') return amount.slice(0, -1);
  if (key === '.' && amount.includes('.')) return amount;
  if (amount.includes('.') && amount.split('.')[1].length >= 2) return amount;
  return amount + key;
};

const ACCOUNTS = [
  { name: 'Everyday', kind: 'Bank account', icon: 'bank', color: 'lilac' },
  { name: 'Cash', kind: 'Wallet', icon: 'cash', color: 'green' },
  { name: 'Travel card', kind: 'Credit card', icon: 'credit-card', color: 'orange' },
] as const;

const CATEGORIES = [
  { name: 'Groceries', icon: 'shopping-cart', color: 'teal' },
  { name: 'Transport', icon: 'car', color: 'orange' },
  { name: 'Eating out', icon: 'fork-knife', color: 'pink' },
] as const;

/** One question per card; answered cards tuck behind and can be tapped to change. */
function StackedEntry() {
  const { space } = useTheme();
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState('42.10');
  const [account, setAccount] = useState('Everyday');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');

  const cards: StackCard[] = [
    {
      key: 'amount',
      label: 'How much?',
      value: `$${amount}`,
      content: (
        <View style={{ gap: space.lg }}>
          <View style={{ alignItems: 'center' }}><Money value={`$${amount || '0'}`} variant="amountHero" tone={amount ? 'default' : 'muted'} /></View>
          <Keypad onKey={(key) => setAmount((current) => press(current, key))} />
          <Button label="Next" disabled={!amount} onPress={() => setStep(1)} />
        </View>
      ),
    },
    {
      key: 'account',
      label: 'From which account?',
      value: account,
      content: (
        <View style={{ marginHorizontal: -space.lg }}>
          {ACCOUNTS.map((item, i) => (
            <React.Fragment key={item.name}>
              {i > 0 ? <Divider /> : null}
              <ListRow leading={<IconCircle icon={item.icon} color={item.color} />} strong title={item.name} subtitle={item.kind} onPress={() => { setAccount(item.name); setStep(2); }} />
            </React.Fragment>
          ))}
        </View>
      ),
    },
    {
      key: 'category',
      label: 'What was it for?',
      value: category,
      content: (
        <View style={{ marginHorizontal: -space.lg }}>
          {CATEGORIES.map((item, i) => (
            <React.Fragment key={item.name}>
              {i > 0 ? <Divider /> : null}
              <ListRow leading={<IconCircle icon={item.icon} color={item.color} />} strong title={item.name} onPress={() => { setCategory(item.name); setStep(3); }} />
            </React.Fragment>
          ))}
        </View>
      ),
    },
    {
      key: 'details',
      label: 'Anything to add?',
      content: (
        <View style={{ gap: space.lg }}>
          <TextField label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
          <TextField label="When" value="Today" editable={false} />
          <Button label="Save expense" onPress={() => setStep(0)} />
        </View>
      ),
    },
  ];

  return <CardStack cards={cards} active={step} onSelect={setStep} />;
}

function Calculator() {
  const { space } = useTheme();
  const [sum, setSum] = useState('12.50+3×4');
  const result = calculate(sum);
  return (
    <View style={{ gap: space.lg }}>
      <View style={{ alignItems: 'center', gap: space.xs }}>
        <Text variant="callout" tone="muted">{isExpression(sum) ? sum : 'Amount'}</Text>
        <Money value={`$${result === undefined ? '0' : result.toFixed(2)}`} variant="amountHero" tone={result === undefined ? 'muted' : 'default'} />
      </View>
      <Keypad operators onKey={(key) => setSum((current) => (key === 'delete' ? current.slice(0, -1) : current + key))} />
      <Button label="Use this amount" disabled={result === undefined || result === 0} />
    </View>
  );
}

/** Adding a transaction: the task the app is opened for most. */
export function EntrySection() {
  const { colors, space, size, border } = useTheme();
  const [kind, setKind] = useState('Expense');
  const [amount, setAmount] = useState('42.10');
  const [repeat, setRepeat] = useState(false);
  const [note, setNote] = useState('');
  const frame = { marginHorizontal: -space.lg, backgroundColor: colors.background, borderTopWidth: border.thin, borderBottomWidth: border.thin, borderColor: colors.divider };

  return (
    <>
      <Specimen name="Add a transaction (the default)" note="The reference's form: From and Details as labelled cards, outlined fields with the label inside, the phone's number keyboard. Save is grey, with the reason above it, until there is an amount.">
        <View style={frame}>
          <Header task title={`Add ${kind.toLowerCase()}`} onClose={() => {}} />
          <View style={{ padding: size.screenPadding, gap: size.sectionGap }}>
            <ChipRow inset>
              {KINDS.map((label) => <Chip key={label} label={label} selected={label === kind} onPress={() => setKind(label)} />)}
            </ChipRow>
            <View style={{ gap: space.md }}>
              <Text variant="bodyStrong">From:</Text>
              <Card padded={false}>
                <ListRow leading={<IconCircle icon="bank" color="lilac" />} strong title="Everyday" subtitle="$12,480.10 available" onPress={() => {}} />
              </Card>
            </View>
            <View style={{ gap: space.md }}>
              <Text variant="bodyStrong">Details:</Text>
              <ListGroup>
                <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title="Groceries" subtitle="Category" onPress={() => {}} />
                <View style={{ padding: size.cardPadding, gap: space.lg }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                    <View style={{ flex: 1 }}><TextField label="Amount" prefix="$" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" /></View>
                    <IconButton icon="calculator" accessibilityLabel="Work out the amount" />
                  </View>
                  <TextField label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
                    <View style={{ flex: 1 }}><TextField label="When" value="Today · 11:04 AM" onPress={() => {}} /></View>
                    <IconButton icon="calendar" accessibilityLabel="Choose the date and time" />
                  </View>
                  <TextField label="With" value="No one" onPress={() => {}} />
                </View>
              </ListGroup>
            </View>
            <View style={{ gap: space.lg }}>
              {amount ? null : <Text variant="callout" tone="muted" align="center">Enter an amount to save</Text>}
              <Button label={`Save ${kind.toLowerCase()}`} disabled={!amount} />
            </View>
          </View>
        </View>
      </Specimen>

      <Specimen name="Guided, in stacked cards" note="For first-run setup and anyone who wants to be walked through: one question per card, each answer tucked behind the next.">
        <StackedEntry />
      </Specimen>

      <Specimen name="Working it out" note="The keypad can add up a bill. The sum shows small; the answer is the amount.">
        <Calculator />
      </Specimen>

      <Specimen name="Transfer" note="From and to, each a row that opens a picker.">
        <View style={[frame, { padding: size.screenPadding, gap: space.md }]}>
          <Text variant="bodyStrong">From:</Text>
          <ListGroup>
            <ListRow leading={<IconCircle icon="bank" color="lilac" />} strong title="Everyday" subtitle="$12,480.10 available" onPress={() => {}} />
          </ListGroup>
          <Text variant="bodyStrong">To:</Text>
          <ListGroup>
            <ListRow leading={<IconCircle icon="cash" color="green" />} strong title="Cash" subtitle="$227.17" onPress={() => {}} />
          </ListGroup>
        </View>
      </Specimen>
    </>
  );
}
