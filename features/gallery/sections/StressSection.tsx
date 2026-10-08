import {
  Badge, Button, Card, CardActions, Chip, ChipRow, DetailRow, FeatureTile, Header, IconButton, IconCircle, ListGroup, ListRow, Money, Notice, Section, Stat, StepRow, TabBar,
  useTheme,
} from '@/design';
import React from 'react';
import { View } from 'react-native';

const LONG = 'Weekly grocery shopping at the big supermarket on the other side of town';
const HUGE = '−₹12,34,56,789.50';

/**
 * Every widget with more text than it was drawn for: long names, long
 * translations (German compounds), nine-figure amounts. Nothing may clip,
 * overlap or push a neighbour off the screen. Also the page to view at the
 * largest system font size (plan tasks B4.02 and B4.03). Reachable only by
 * link (`?section=stress`).
 */
export function StressSection() {
  const { colors, space, size } = useTheme();
  return (
    <>
      <View style={{ marginHorizontal: -space.lg, backgroundColor: colors.background }}>
        <Header title="Geschwindigkeitsbegrenzungen und Kategorien" onBack={() => {}} right={<><IconButton icon="search" accessibilityLabel="Search" /><IconButton icon="plus" accessibilityLabel="Add" /></>} />
        <Header task title="Benachrichtigungseinstellungen ändern" onClose={() => {}} />
        <ChipRow>
          <Chip label="Wiederkehrende Zahlungen" selected />
          <Chip label="Ausgaben" />
          <Chip label="Dieser Monat" onRemove={() => {}} />
        </ChipRow>
      </View>

      <Section title="Unterkategorien und wiederkehrende Zahlungen verwalten" actionLabel="Alle anzeigen">
        <ListGroup>
          <ListRow leading={<IconCircle icon="shopping-cart" color="teal" />} strong title={LONG} subtitle={LONG} value={HUGE} onPress={() => {}} />
          <ListRow icon="bank" title={LONG} value="Deutschland" onPress={() => {}} />
          <ListRow icon="lock" title={LONG} subtitle={LONG} trailing={<Badge label="Demnächst" tone="neutral" />} onPress={() => {}} />
          <ListRow icon="tag" title={LONG} onPress={() => {}} />
          <DetailRow label={LONG} value={LONG} />
        </ListGroup>
        <Card padded={false}>
          <View style={{ padding: size.cardPadding, gap: space.sm }}>
            <Money value={HUGE} variant="amountHero" />
            <Money value={HUGE} variant="amountLarge" />
            <View style={{ flexDirection: 'row', gap: space.lg }}>
              <Stat label="Geldeingang diesen Monat" value="₹12,34,56,789.50" tone="positive" />
              <Stat label="Geldausgang" value={HUGE} />
            </View>
          </View>
          <CardActions actions={[{ label: 'Ausgabe hinzufügen' }, { label: 'Einnahme hinzufügen' }]} />
        </Card>
        <View style={{ flexDirection: 'row', gap: size.cardGap }}>
          <FeatureTile icon="users" color="lilac" description={LONG} label="Person hinzufügen und Betrag aufteilen" />
          <FeatureTile icon="flag" color="pink" description="Short" label="Ziel" />
        </View>
        <StepRow icon="user" label={LONG} state="current" />
        <Notice tone="warning" title={LONG} body={LONG} linkLabel="Datenschutzrichtlinie und Nutzungsbedingungen lesen" />
        <Button label="Sicherung jetzt wiederherstellen und fortfahren" />
        <Button label="Sicherung jetzt wiederherstellen und fortfahren" variant="secondary" icon="download-simple" />
        <Button label="Wiederherstellen" size="sm" fullWidth={false} />
      </Section>

      <View style={{ marginHorizontal: -space.lg }}>
        <TabBar
          activeKey="b"
          items={[
            { key: 'a', label: 'Startseite', icon: 'house' }, { key: 'b', label: 'Aktivitäten', icon: 'receipt' }, { key: 'c', label: 'Hinzufügen', icon: 'plus' },
            { key: 'd', label: 'Planung', icon: 'calendar' }, { key: 'e', label: 'Auswertungen', icon: 'chart-pie' },
          ]}
        />
      </View>
    </>
  );
}
