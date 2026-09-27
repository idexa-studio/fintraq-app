import {
  Button,
  Icon,
  IconAvatar,
  IconButton,
  ListGroup,
  ListItem,
  MoneyText,
  PersonAvatar,
  SectionHeader,
  SegmentedControl,
  StatTile,
  Text,
} from '@/src/components/ui';
import {
  ArrowDownLeftIcon,
  ArrowsLeftRightIcon,
  ArrowUpRightIcon,
  BellIcon,
  BriefcaseIcon,
  CarIcon,
  ChartPieSliceIcon,
  CoffeeIcon,
  ForkKnifeIcon,
  LockKeyIcon,
  MagnifyingGlassIcon,
  PiggyBankIcon,
  PlusIcon,
  ShoppingBagIcon,
  WalletIcon,
} from '@/src/components/ui/icons';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import type { IconSource } from '@/src/components/ui';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Period = 'week' | 'month' | 'year';
const noop = () => {};

const RECENT: { id: number; title: string; meta: string; amount: number; type: 'CR' | 'DR'; icon: IconSource; color: string }[] = [
  { id: 1, title: 'Blue Tokai Coffee', meta: 'Food & drinks · 9:42 AM', amount: 340, type: 'DR', icon: CoffeeIcon, color: '#C2410C' },
  { id: 2, title: 'Salary — Acme Corp', meta: 'Income · Yesterday', amount: 84200, type: 'CR', icon: BriefcaseIcon, color: '#0E8A5F' },
  { id: 3, title: 'Zara', meta: 'Shopping · Yesterday', amount: 2990, type: 'DR', icon: ShoppingBagIcon, color: '#BE185D' },
  { id: 4, title: 'Uber', meta: 'Transport · Mon', amount: 412, type: 'DR', icon: CarIcon, color: '#1867D2' },
];

/**
 * A composed screen built only from design-system widgets — judge the system
 * here, as it will look in the app, rather than as a list of variants.
 */
export function ShowcaseSection() {
  const theme = useTheme();
  const { colors, spacing, heroCard } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [period, setPeriod] = useState<Period>('month');
  const [lock, setLock] = useState(true);

  return (
    <View style={{ gap: spacing('6') }}>
      {/* Greeting */}
      <View style={styles.topBar}>
        <PersonAvatar name="Ahmed Nafish" color={colors.primary} variant="solid" size={44} />
        <View style={{ flex: 1 }}>
          <Text variant="caption" tone="muted">Good evening</Text>
          <Text variant="subheading">Ahmed</Text>
        </View>
        <IconButton icon={MagnifyingGlassIcon} onPress={noop} accessibilityLabel="Search" />
        <IconButton icon={BellIcon} onPress={noop} accessibilityLabel="Notifications" />
      </View>

      {/* Balance hero — flat, one saturated surface */}
      <View style={[styles.hero, { backgroundColor: heroCard.background }]}>
        <View style={styles.heroTop}>
          <Text variant="callout" color={heroCard.textMuted}>Total balance</Text>
          <View style={styles.heroPill}>
            <Text variant="caption" color={heroCard.textPrimary} style={{ fontFamily: theme.typography.fonts.semibold }}>INR</Text>
          </View>
        </View>
        <MoneyText amount={124806.5} currency="INR" style={[theme.typography.variants.amountHero, { color: heroCard.textPrimary, fontSize: 36, lineHeight: 42 }]} />
        <View style={styles.heroStats}>
          <HeroStat icon={ArrowDownLeftIcon} label="Income" amount={84200} color={heroCard.income} theme={theme} />
          <View style={[styles.heroDivider, { backgroundColor: heroCard.separator }]} />
          <HeroStat icon={ArrowUpRightIcon} label="Spent" amount={31460} color={heroCard.expense} theme={theme} />
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actions}>
        <QuickAction icon={PlusIcon} label="Add" primary theme={theme} />
        <QuickAction icon={ArrowsLeftRightIcon} label="Transfer" theme={theme} />
        <QuickAction icon={WalletIcon} label="Accounts" theme={theme} />
        <QuickAction icon={ChartPieSliceIcon} label="Insights" theme={theme} />
      </View>

      {/* Period + KPIs */}
      <View style={{ gap: spacing('3') }}>
        <SegmentedControl<Period>
          value={period}
          onChange={setPeriod}
          options={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
        />
        <View style={{ flexDirection: 'row', gap: spacing('3') }}>
          <StatTile label="Saved" icon={PiggyBankIcon} iconColor={colors.success} amount={52740} currency="INR" compact delta={12} />
          <StatTile label="Dining" icon={ForkKnifeIcon} iconColor={colors.warning} amount={6380} currency="INR" compact delta={-18} positiveIsGood={false} />
        </View>
      </View>

      {/* Recent transactions */}
      <View>
        <View style={{ marginHorizontal: -spacing('4'), marginTop: -spacing('5') }}>
          <SectionHeader title="Recent activity" rightText="See all" onPressRight={noop} />
        </View>
        <ListGroup insetDividers>
          {RECENT.map((tx) => (
            <ListItem
              key={tx.id}
              leading={<IconAvatar icon={tx.icon} color={tx.color} size={40} weight="duotone" />}
              title={tx.title}
              subtitle={tx.meta}
              onPress={noop}
              showChevron={false}
              trailing={<MoneyText amount={tx.amount} currency="INR" type={tx.type} style={theme.typography.variants.amount} />}
            />
          ))}
        </ListGroup>
      </View>

      {/* Settings pattern */}
      <ListGroup title="Security">
        <ListItem icon={LockKeyIcon} title="App lock" subtitle="Face or fingerprint on open" switchValue={lock} onSwitchChange={setLock} />
        <ListItem icon={BellIcon} iconColor={colors.warning} title="Daily reminder" value="9:00 PM" onPress={noop} />
      </ListGroup>

      <Button title="Add transaction" icon={PlusIcon} size="lg" fullWidth onPress={noop} />
    </View>
  );
}

function HeroStat({ icon, label, amount, color, theme }: { icon: IconSource; label: string; amount: number; color: string; theme: ThemeContextType }) {
  const { heroCard, spacing, radius } = theme;
  return (
    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing('2.5') }}>
      <View style={{ width: 32, height: 32, borderRadius: radius('sm'), backgroundColor: heroCard.decoOverlay, alignItems: 'center', justifyContent: 'center' }}>
        <Icon icon={icon} size={16} color={color} weight="bold" />
      </View>
      <View>
        <Text variant="caption" color={heroCard.textMuted}>{label}</Text>
        <MoneyText amount={amount} currency="INR" compact style={[theme.typography.variants.amount, { color: heroCard.textPrimary }]} />
      </View>
    </View>
  );
}

function QuickAction({ icon, label, primary = false, theme }: { icon: IconSource; label: string; primary?: boolean; theme: ThemeContextType }) {
  const { colors, spacing, radius } = theme;
  return (
    <Pressable onPress={noop} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => ({ alignItems: 'center', gap: spacing('2'), flex: 1, opacity: pressed ? 0.7 : 1 })}>
      <View
        style={{
          width: 58,
          height: 58,
          borderRadius: radius('lg'),
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: primary ? colors.primary : colors.surface,
        }}
      >
        <Icon icon={icon} size={24} color={primary ? colors.primaryForeground : colors.text} weight={primary ? 'bold' : 'regular'} />
      </View>
      <Text variant="caption" style={{ fontFamily: theme.typography.fonts.medium }}>{label}</Text>
    </Pressable>
  );
}

const createStyles = ({ spacing, radius, heroCard }: ThemeContextType) =>
  StyleSheet.create({
    topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    hero: { borderRadius: radius('2xl'), padding: spacing('5'), gap: spacing('2') },
    heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroPill: { paddingHorizontal: spacing('2.5'), height: 24, justifyContent: 'center', borderRadius: radius('full'), backgroundColor: heroCard.decoOverlay },
    heroStats: { flexDirection: 'row', alignItems: 'center', marginTop: spacing('4') },
    heroDivider: { width: 1, height: 32, marginHorizontal: spacing('3') },
    actions: { flexDirection: 'row', justifyContent: 'space-between' },
  });
