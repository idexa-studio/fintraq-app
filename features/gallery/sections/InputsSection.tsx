import { Specimen } from '@/features/gallery/components/Specimen';
import { Card, Checkbox, Divider, IconButton, ListRow, Radio, Section, Switch, Text, TextField, useTheme } from '@/design';
import React, { useState } from 'react';
import { View } from 'react-native';

export function InputsSection() {
  const { space } = useTheme();
  const [amount, setAmount] = useState('$42.10');
  const [ref, setRef] = useState('Weekly shop');
  const [answer, setAnswer] = useState<'new' | 'existing' | null>('new');
  const [agree, setAgree] = useState(true);
  const [find, setFind] = useState('rent');
  const [repeat, setRepeat] = useState(false);
  const [alerts, setAlerts] = useState(true);
  return (
    <>
      <Section title="Text fields">
        <Card style={{ gap: space.lg }}>
          <Specimen name="Label inside" note="The label sits in the field, before the value.">
            <TextField label="Amount" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
            <TextField label="Note" value={ref} onChangeText={setRef} />
          </Specimen>
          <Specimen name="Search" note="No label; a cross empties it once it holds something.">
            <TextField icon="search" value={find} onChangeText={setFind} placeholder="A note, account or person" onClear={() => setFind('')} />
          </Specimen>
          <Specimen name="With a helper beside it">
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.xs }}>
              <View style={{ flex: 1 }}><TextField label="When" value="Today" editable={false} /></View>
              <IconButton icon="calendar" accessibilityLabel="Pick a date" />
            </View>
          </Specimen>
          <Specimen name="Empty, error, search">
            <TextField label="Name" placeholder="e.g. Holiday fund" />
            <TextField label="Amount" value="0" error="Enter an amount above zero" />
            <TextField icon="search" placeholder="Search transactions" accessibilityLabel="Search transactions" />
          </Specimen>
        </Card>
      </Section>

      <Section title="Choices">
        <Specimen name="Radio" note="One answer. The button stays grey until one is chosen.">
          <View style={{ paddingHorizontal: space.lg }}>
            <Radio label="Start fresh" selected={answer === 'new'} onPress={() => setAnswer('new')} />
            <Radio label="Restore my data from a backup" selected={answer === 'existing'} onPress={() => setAnswer('existing')} />
            <Radio label="Not available" selected={false} disabled />
          </View>
        </Specimen>
        <Specimen name="Checkbox" note="Answers that combine, or one thing to agree to.">
          <View style={{ paddingHorizontal: space.lg }}>
            <Checkbox label="Include transfers" selected={agree} onPress={() => setAgree(!agree)} />
            <Checkbox label="Include archived accounts" selected={false} />
          </View>
        </Specimen>
      </Section>

      <Section title="Unavailable">
        <Specimen name="Every control, switched off" note="Greyed, not pressable, and announced as unavailable. The reason goes beside it in words.">
          <Card style={{ gap: space.lg }}>
            <TextField label="Account" value="Everyday" editable={false} helper="Can’t be changed once the account has transactions" />
            <View>
              <Radio label="Transfer" selected={false} disabled />
              <Checkbox label="Repeat every month" selected disabled />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, gap: space.xxs }}>
                <Text variant="body" tone="disabled">Unlock with fingerprint</Text>
                <Text variant="callout" tone="muted">This phone has no fingerprint set up</Text>
              </View>
              <Switch value={false} disabled accessibilityLabel="Unlock with fingerprint" />
            </View>
          </Card>
        </Specimen>
      </Section>

      <Section title="Switch">
        <Specimen name="In a row" note="Takes effect at once. No save button.">
          <Card padded={false}>
            <ListRow title="Repeat this every month" trailing={<Switch value={repeat} onValueChange={setRepeat} accessibilityLabel="Repeat this every month" />} />
            <Divider />
            <ListRow title="Daily reminder" subtitle="At 8:00 pm" trailing={<Switch value={alerts} onValueChange={setAlerts} accessibilityLabel="Daily reminder" />} />
          </Card>
        </Specimen>
      </Section>
    </>
  );
}
