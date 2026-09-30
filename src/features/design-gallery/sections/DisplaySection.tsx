import { GalleryGroup, Specimen, SpecimenRow } from '@/src/features/design-gallery/components/Specimen';
import {
  Badge,
  Card,
  Divider,
  IconAvatar,
  ListGroup,
  ListItem,
  MoneyText,
  PersonAvatar,
  ProgressBar,
  SectionHeader,
  StatTile,
  Text,
  TrendBadge,
} from '@/src/components/ui';
import { useTheme } from '@/src/providers/ThemeProvider';
import { ArrowDownLeftIcon, ArrowUpRightIcon, BankIcon, CoffeeIcon, GlobeIcon, LockKeyIcon, MoonIcon, TrashIcon, WalletIcon } from '@/src/components/ui/icons';
import React, { useState } from 'react';
import { View } from 'react-native';

const noop = () => {};

export function DisplaySection() {
  const { spacing, colors } = useTheme();
  const [lock, setLock] = useState(false);
  const [lang, setLang] = useState('en');

  return (
    <View style={{ gap: spacing('9') }}>
      <GalleryGroup title="Containers">
        <Specimen
          title="Card"
          description="Groups related content. surface on the page, inset for blocks nested inside a surface."
          guidelines={['Don\'t nest surface cards — use variant="inset" for the inner block.', 'Tappable cards take onPress; never wrap a Card in another pressable.']}
          bare
        >
          <Card>
            <Text variant="subheading">Surface card</Text>
            <Text variant="callout" tone="muted">Default container on the page background.</Text>
            <Card variant="inset" size="sm" style={{ marginTop: spacing('3') }}>
              <Text variant="calloutStrong">Inset card</Text>
              <Text variant="caption" tone="muted">Nested one level deeper.</Text>
            </Card>
          </Card>
          <Card variant="outlined">
            <Text variant="subheading">Outlined card</Text>
            <Text variant="callout" tone="muted">Low-emphasis grouping.</Text>
          </Card>
          <Card onPress={noop} accessibilityLabel="Pressable card">
            <Text variant="subheading">Pressable card</Text>
            <Text variant="callout" tone="muted">The whole card is a single tap target.</Text>
          </Card>
        </Specimen>

        <Specimen
          title="ListGroup + ListItem"
          description="The settings-style list: one component for navigation rows, toggles, single choice and read-only info. Replaces the per-screen NavRow / SwitchRow / InfoRow copies."
          guidelines={[
            'Group related rows; give the group a short title.',
            'value shows the current setting — tapping opens the picker.',
            'Destructive rows go in their own group at the bottom.',
          ]}
          bare
        >
          <ListGroup title="Preferences" footer="Changes apply immediately.">
            <ListItem icon={GlobeIcon} title="Language" value={lang === 'en' ? 'English' : 'हिन्दी'} onPress={noop} />
            <ListItem icon={MoonIcon} title="Theme" subtitle="Follows your device setting" value="System" onPress={noop} />
            <ListItem icon={LockKeyIcon} iconColor={colors.primary} title="App lock" subtitle="Require biometrics on open" switchValue={lock} onSwitchChange={setLock} />
          </ListGroup>

          <ListGroup title="Single choice" insetDividers={false}>
            <ListItem title="English" selected={lang === 'en'} onPress={() => setLang('en')} />
            <ListItem title="हिन्दी" selected={lang === 'hi'} onPress={() => setLang('hi')} />
          </ListGroup>

          <ListGroup title="Info & destructive">
            <ListItem icon={WalletIcon} title="Version" value="1.2.3" />
            <ListItem icon={TrashIcon} title="Factory reset" subtitle="Erase all data on this device" destructive onPress={noop} />
            <ListItem icon={BankIcon} title="Disabled row" disabled onPress={noop} />
          </ListGroup>
        </Specimen>

        <Specimen title="SectionHeader" description="Title above a dashboard section, with an optional 'See all' link." bare>
          <View style={{ marginHorizontal: -spacing('4') }}>
            <SectionHeader title="Recent transactions" rightText="See all" onPressRight={noop} />
          </View>
        </Specimen>

        <Specimen title="Divider" description="Hairline separator. Use inset to align with a text column.">
          <Text variant="callout">Above</Text>
          <Divider />
          <Text variant="callout">Below — full width</Text>
          <Divider inset={48} />
          <Text variant="callout">Below — inset 48</Text>
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Data display">
        <Specimen
          title="MoneyText"
          description="The only way to render money. Handles currency formatting, compact mode and CR/DR sign + colour."
          guidelines={['CR = income (green, +). DR = expense (red, −). NONE = neutral balance.', 'Use compact for tight spaces (tiles, charts).']}
        >
          <MoneyText amount={1234567.89} currency="INR" style={{ fontSize: 28, lineHeight: 33 }} />
          <SpecimenRow>
            <MoneyText amount={4200} currency="USD" type="CR" />
            <MoneyText amount={1730.5} currency="USD" type="DR" />
            <MoneyText amount={98000} currency="EUR" weight="regular" />
            <MoneyText amount={1250000} currency="USD" compact />
          </SpecimenRow>
        </Specimen>

        <Specimen title="StatTile" description="A single KPI. Lay out in rows of two." bare>
          <View style={{ flexDirection: 'row', gap: spacing('2') }}>
            <StatTile label="Income" icon={ArrowUpRightIcon} iconColor={colors.success} amount={84200} currency="INR" type="CR" delta={12.4} compact />
            <StatTile label="Expenses" icon={ArrowDownLeftIcon} iconColor={colors.danger} amount={51730} currency="INR" type="DR" delta={8} positiveIsGood={false} compact />
          </View>
          <View style={{ flexDirection: 'row', gap: spacing('2') }}>
            <StatTile label="Transactions" value="142" onPress={noop} />
            <StatTile label="Savings rate" value="38%" delta={-4} />
          </View>
        </Specimen>

        <Specimen title="Badge & TrendBadge" description="Short status labels and period-over-period change.">
          <SpecimenRow label="Badge">
            <Badge label="Income" color={colors.success} />
            <Badge label="Expense" color={colors.danger} />
            <Badge label="Due soon" color={colors.warning} />
            <Badge label="USD" variant="muted" />
            <Badge label={3} variant="count" />
            <Badge label="PRO" variant="count" color={colors.info} />
          </SpecimenRow>
          <SpecimenRow label="TrendBadge">
            <TrendBadge delta={12} />
            <TrendBadge delta={-7} />
            <TrendBadge delta={15} positiveIsGood={false} />
            <TrendBadge delta={0} />
          </SpecimenRow>
        </Specimen>

        <Specimen
          title="IconAvatar & PersonAvatar"
          description="Leading visuals for accounts, categories and people. For brand-coloured avatars pass colors.primaryInk — lime glyphs on a lime tint are ~2:1. Solid fills choose their own readable glyph colour, so user colours are safe."
        >
          <SpecimenRow label="IconAvatar · subtle / solid / outline">
            <IconAvatar icon={CoffeeIcon} color="#E8A33D" />
            <IconAvatar icon={CoffeeIcon} color="#E8A33D" variant="solid" />
            <IconAvatar icon={CoffeeIcon} color="#E8A33D" variant="outline" />
            <IconAvatar icon={BankIcon} color={colors.info} size={48} />
            <IconAvatar icon={WalletIcon} color={colors.primaryInk} size={32} />
          </SpecimenRow>
          <SpecimenRow label="Solid on any fill · glyph picks dark or white for contrast (foregroundOn)">
            <IconAvatar icon={CoffeeIcon} color="#FACC15" variant="solid" />
            <IconAvatar icon={WalletIcon} color={colors.primary} variant="solid" />
            <IconAvatar icon={BankIcon} color="#1D4ED8" variant="solid" />
            <PersonAvatar name="Yuki" color="#A7F3D0" variant="solid" />
            <PersonAvatar name="Dev" color="#7C3AED" variant="solid" />
            <Badge label={7} variant="count" color="#FACC15" />
          </SpecimenRow>
          <SpecimenRow label="PersonAvatar">
            <PersonAvatar name="Priya Sharma" color="#8B5CF6" />
            <PersonAvatar name="Rahul" color="#0EA5E9" variant="solid" />
            <PersonAvatar name="Ana Lima" color="#F43F5E" size={48} />
          </SpecimenRow>
        </Specimen>

        <Specimen title="ProgressBar" description="Determinate progress — budgets, loan repayment, backups.">
          <View style={{ gap: spacing('1.5') }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text variant="calloutStrong">Loan repaid</Text>
              <Text variant="caption" tone="muted">65%</Text>
            </View>
            <ProgressBar progress={65} accessibilityLabel="Loan repaid" />
          </View>
          <ProgressBar progress={92} color={colors.danger} height={6} />
          <ProgressBar progress={40} color={colors.warning} height={4} />
        </Specimen>
      </GalleryGroup>
    </View>
  );
}
