import { Specimen } from '@/features/gallery/components/Specimen';
import { AmountField, BACKDROP, Button, Card, Header, IconButton, IconCircle, Keypad, ListGroup, ListRow, MarkTile, Money, TabStrip, Text, TextField, useTheme } from '@/design';
import type { KeypadKey } from '@/design';
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
  const { colors, space, size, border, radius } = useTheme();
  const [kind, setKind] = useState('Expense');
  const [amount, setAmount] = useState('42.10');
  const [repeat, setRepeat] = useState(false);
  const [note, setNote] = useState('');
  const frame = { marginHorizontal: -space.lg, backgroundColor: colors.background, borderTopWidth: border.thin, borderBottomWidth: border.thin, borderColor: colors.divider };

  return (
    <>
      <Specimen name="Add a transaction" note="A sheet that rises over the screen behind (stacked by the system on iOS, a bottom sheet on Android). Kind as tabs under the header, the amount as the one large thing, then the reference's form: labelled cards and outlined fields.">
        <View style={{ marginHorizontal: -space.lg, backgroundColor: BACKDROP, paddingTop: space.lg }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
            <Header task flush title={`Add ${kind.toLowerCase()}`} onClose={() => {}} />
            <TabStrip tabs={KINDS.map((label) => ({ key: label, label }))} value={kind} onChange={setKind} accessibilityLabel="Kind of transaction" />
            <View style={{ padding: size.screenPadding, gap: size.sectionGap }}>
              <Card style={{ gap: space.sm }}>
                <Text variant="callout" tone="muted">Amount</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                  <View style={{ flex: 1 }}><AmountField value={amount} onChangeText={setAmount} symbol="$" accessibilityLabel="Amount" /></View>
                  <MarkTile icon="calculator" accessibilityLabel="Work out the amount" onPress={() => {}} />
                </View>
              </Card>
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
        </View>
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
