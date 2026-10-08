import { Specimen } from '@/features/gallery/components/Specimen';
import { Button, Card, CardActions, Chip, ChipRow, IconButton, Section, TabStrip, Text, useTheme } from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

const VIEWS = ['All', 'Expenses', 'Income', 'Transfers'];

export function ActionsSection() {
  const { space } = useTheme();
  const [view, setView] = useState('All');
  const [kindOf, setKindOf] = useState('expense');
  return (
    <>
      <Section title="Buttons">
        <Specimen name="Primary" note="The way forward. Solid, full width.">
          <Button label="Continue" />
        </Specimen>
        <Specimen name="Secondary" note="The alternative, under or beside a primary.">
          <Button label="Not now" variant="secondary" />
        </Specimen>
        <Specimen name="Text" note="A quiet way out of the step.">
          <Button label="Maybe later" variant="text" />
        </Specimen>
        <Specimen name="Link" note="Goes somewhere else.">
          <Button label="Restore from a backup instead" variant="link" />
        </Specimen>
        <Specimen name="Danger" note="Destroys something. Always confirmed in a dialog.">
          <Button label="Delete account" variant="danger" />
        </Specimen>
        <Specimen name="Unavailable" note="Grey until the step is complete, so it cannot be tapped into an error.">
          <Button label="Next" disabled />
          <Button label="Next" variant="secondary" disabled />
        </Specimen>
        <Specimen name="Working" note="Keeps its colour while the action runs.">
          <Button label="Continue" loading />
        </Specimen>
        <Specimen name="With icon, small, hugging" row>
          <Button label="Add account" icon="plus" fullWidth={false} />
          <Button label="Filter" icon="filter" variant="secondary" size="sm" fullWidth={false} />
        </Specimen>
      </Section>

      <Section title="Icon buttons">
        <Specimen name="Header actions" note="Bare line icons with a 44pt target." row>
          <IconButton icon="mail" accessibilityLabel="Messages" />
          <IconButton icon="question" accessibilityLabel="Help" />
          <IconButton icon="user-circle" accessibilityLabel="Profile" />
          <IconButton icon="x" accessibilityLabel="Close" />
          <IconButton icon="calendar" accessibilityLabel="Pick a date" disabled />
        </Specimen>
      </Section>

      <Section title="Chips">
        <Specimen name="Views" note="One row that scrolls off the edge. One is always selected.">
          <View style={{ marginHorizontal: -space.lg }}>
            <ChipRow>
              {VIEWS.map((label) => <Chip key={label} label={label} selected={label === view} onPress={() => setView(label)} />)}
            </ChipRow>
          </View>
        </Specimen>
      </Section>

      <Section title="Tab strip">
        <Specimen name="Tab strip" note="Views of one screen, under its header. Plain labels; the active one is bold and the green mark slides to it.">
          <TabStrip tabs={[{ key: 'expense', label: 'Expense' }, { key: 'income', label: 'Income' }, { key: 'transfer', label: 'Transfer' }]} value={kindOf} onChange={setKindOf} accessibilityLabel="Kind of transaction" />
        </Specimen>
      </Section>

      <Section title="Card actions">
        <Specimen name="Split" note="One or two actions at the foot of a card.">
          <Card padded={false}>
            <View style={{ padding: space.lg }}>
              <Text variant="bodyStrong">Everyday</Text>
            </View>
            <CardActions actions={[{ label: 'Add expense' }, { label: 'Add income' }]} />
          </Card>
          <Card padded={false}>
            <View style={{ padding: space.lg }}>
              <Text variant="bodyStrong">Cash</Text>
            </View>
            <CardActions actions={[{ label: 'Add transaction' }]} />
          </Card>
        </Specimen>
      </Section>
    </>
  );
}
