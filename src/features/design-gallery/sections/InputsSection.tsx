import { GalleryGroup, Specimen, SpecimenRow } from '@/src/features/design-gallery/components/Specimen';
import { ColorPickerRow } from '@/src/components/pickers';
import { Card, Chip, IconButton, Input, ListGroup, ListItem, SegmentedControl, Switch, Text } from '@/src/components/ui';
import { PALETTE_COLORS } from '@/src/constants/picker';
import { useTheme } from '@/src/providers/ThemeProvider';
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';

type TxType = 'DR' | 'CR' | 'TR';
type Period = '7d' | '30d' | '90d' | '12m';
type ThemeMode = 'light' | 'dark' | 'system';

export function InputsSection() {
  const { spacing, colors, radius } = useTheme();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<TxType>('DR');
  const [period, setPeriod] = useState<Period>('30d');
  const [mode, setMode] = useState<ThemeMode>('system');
  const [chips, setChips] = useState<string[]>(['food']);
  const [enabled, setEnabled] = useState(true);
  const [color, setColor] = useState(PALETTE_COLORS[0]);

  const toggleChip = (key: string) =>
    setChips((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const nameError = name.length > 0 && name.length < 3 ? 'Name must be at least 3 characters' : undefined;

  return (
    <View style={{ gap: spacing('9') }}>
      <GalleryGroup title="Text entry">
        <Specimen
          title="Input"
          description="Single-line text field. Label above, helper or error below."
          guidelines={[
            'Always give a visible label — placeholders disappear while typing.',
            'Validate on blur or submit, not on every keystroke.',
            'Error text says how to fix it: "Enter an amount above 0", not "Invalid".',
            'default (tinted) works on any layer; filled (white + border) is for page-level fields like search.',
          ]}
        >
          <Input
            label="Search"
            placeholder="Transactions, accounts, people"
            leadingIcon="search"
            value={query}
            onChangeText={setQuery}
            variant="filled"
            trailing={query ? (
              <IconButton icon="x" size="sm" variant="ghost" onPress={() => setQuery('')} accessibilityLabel="Clear search" />
            ) : undefined}
          />
          <Input
            label="Account name"
            placeholder="e.g. HDFC Savings"
            value={name}
            onChangeText={setName}
            helperText="Shown on the dashboard and in reports"
            error={nameError}
          />
          <Input label="Note" placeholder="Minimal variant" variant="minimal" />
          <SpecimenRow label="Sizes">
            <View style={{ flex: 1, gap: spacing('2') }}>
              <Input size="sm" placeholder="Small · 40" variant="filled" />
              <Input size="md" placeholder="Medium · 50" variant="filled" />
              <Input size="lg" placeholder="Large · 58" variant="filled" />
            </View>
          </SpecimenRow>
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Selection">
        <Specimen
          title="SegmentedControl"
          description="Switch between 2–4 mutually exclusive views or modes. The indicator animates between options."
          guidelines={['More than 4 options → use Chips or an OptionsBottomSheet.', 'Keep labels to one short word.']}
        >
          <SegmentedControl<TxType>
            value={type}
            onChange={setType}
            options={[
              { value: 'DR', label: 'Expense', icon: 'arrow-down-left' },
              { value: 'CR', label: 'Income', icon: 'arrow-up-right' },
              { value: 'TR', label: 'Transfer', icon: 'arrows-left-right' },
            ]}
          />
          <SegmentedControl<Period>
            size="sm"
            value={period}
            onChange={setPeriod}
            options={[
              { value: '7d', label: '7D' },
              { value: '30d', label: '30D' },
              { value: '90d', label: '90D' },
              { value: '12m', label: '12M' },
            ]}
          />
          <SegmentedControl<ThemeMode>
            value={mode}
            onChange={setMode}
            options={[
              { value: 'light', label: 'Light', icon: 'theme-light' },
              { value: 'dark', label: 'Dark', icon: 'theme-dark' },
              { value: 'system', label: 'Auto', icon: 'circle-half' },
            ]}
          />
        </Specimen>

        <Specimen
          title="Chip"
          description="Filters and multi-select tags. Scroll horizontally when they overflow."
          guidelines={['Pass color for category-coloured chips; defaults to primary.', 'Inside a sheet or card, pass on="surface" so resting chips stay visible.', 'size="sm" for compact pickers above content, like the Analytics currency filter.']}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing('2') }}>
            <Chip label="Food" icon="coffee" isActive={chips.includes('food')} onPress={() => toggleChip('food')} />
            <Chip label="Shopping" icon="shopping-bag" color="#E8618C" isActive={chips.includes('shop')} onPress={() => toggleChip('shop')} />
            <Chip label="Transport" icon="car" color={colors.info} isActive={chips.includes('car')} onPress={() => toggleChip('car')} />
            <Chip label="This month" isActive={chips.includes('month')} onPress={() => toggleChip('month')} />
          </ScrollView>
          <View style={{ flexDirection: 'row', gap: spacing('2'), backgroundColor: colors.surface, padding: spacing('3'), borderRadius: radius('xl') }}>
            <Chip label="On a sheet" on="surface" onPress={() => toggleChip('sheet')} isActive={chips.includes('sheet')} />
            <Chip label="Resting" on="surface" onPress={() => toggleChip('rest')} isActive={chips.includes('rest')} />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing('1.5') }}>
            <Chip label="USD" size="sm" onPress={() => toggleChip('usd')} isActive={!chips.includes('usd')} />
            <Chip label="INR" size="sm" onPress={() => toggleChip('usd')} isActive={chips.includes('usd')} />
          </View>
        </Specimen>

        <Specimen
          title="Switch"
          description="Instant on/off settings. Inside lists, prefer ListItem with switchValue so the whole row is tappable."
          guidelines={['A switch applies immediately — never pair it with a Save button.']}
        >
          <SpecimenRow>
            <Switch value={enabled} onValueChange={setEnabled} accessibilityLabel="Demo switch" />
            <Switch value={!enabled} onValueChange={(v) => setEnabled(!v)} accessibilityLabel="Demo switch inverse" />
            <Switch value disabled onValueChange={() => {}} accessibilityLabel="Disabled switch" />
            <Text variant="caption" tone="muted">{enabled ? 'On' : 'Off'}</Text>
          </SpecimenRow>
          <ListGroup>
            <ListItem title="Daily reminder" subtitle="Nudge me at 9:00 PM" switchValue={enabled} onSwitchChange={setEnabled} />
          </ListGroup>
        </Specimen>

        <Specimen title="ColorPickerRow" description="Swatch grid for account, category and person colours: all colours visible, squircle swatches, check + name marks the choice (src/components/pickers)." bare>
          <Card style={{ padding: 0 }}>
            <ColorPickerRow colors={PALETTE_COLORS} value={color} onChange={setColor} />
          </Card>
        </Specimen>
      </GalleryGroup>
    </View>
  );
}
