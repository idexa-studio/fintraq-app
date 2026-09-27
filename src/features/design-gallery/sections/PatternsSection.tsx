import { GalleryGroup, Specimen } from '@/src/features/design-gallery/components/Specimen';
import { EmptyState, IconButton, ListGroup, ListItem, PersonAvatar, SectionHeader, StatTile, Text } from '@/src/components/ui';
import { TransactionRow } from '@/src/features/transactions/components/TransactionRow';
import { useTheme } from '@/src/providers/ThemeProvider';
import { toDbColor } from '@/src/utils/format';
import { ArrowDownLeftIcon, ArrowUpRightIcon, MagnifyingGlassIcon, SlidersHorizontalIcon, UserIcon } from '@/src/components/ui/icons';
import React from 'react';
import { View } from 'react-native';

type TxData = React.ComponentProps<typeof TransactionRow>['tx'];

const now = Date.now();
const account = { name: 'HDFC Savings', currency: 'INR', icon: 'bank', color: toDbColor('#3B82F6'), accountType: 'bank' as const };

const SAMPLE_TXS: TxData[] = [
  {
    id: 1, type: 'DR', amount: 450, note: 'Lunch with team', datetime: new Date(now - 2 * 3600e3).toISOString(),
    account, category: { name: 'Food', icon: 'restaurant', color: toDbColor('#F59E0B') },
  },
  {
    id: 2, type: 'CR', amount: 84200, note: '', datetime: new Date(now - 26 * 3600e3).toISOString(),
    account, category: { name: 'Salary', icon: 'work', color: toDbColor('#22A45D') },
  },
  {
    id: 3, type: 'TR', amount: 5000, note: 'Top up wallet', datetime: new Date(now - 50 * 3600e3).toISOString(),
    account,
    category: { name: 'Transfer', icon: 'swap-horiz', color: toDbColor('#1268AE') },
    toAccount: { name: 'Paytm Wallet', icon: 'wallet', color: toDbColor('#8B5CF6'), accountType: 'ewallet' },
  },
];

const noop = () => {};

export function PatternsSection() {
  const { spacing, colors } = useTheme();

  return (
    <View style={{ gap: spacing('9') }}>
      <GalleryGroup title="Domain">
        <Specimen
          title="TransactionRow"
          description="features/transactions/components. Expense, income and transfer. isFirst/isLast round the group corners."
          bare
        >
          <View>
            {SAMPLE_TXS.map((tx, i) => (
              <TransactionRow key={tx.id} tx={tx} showDate isFirst={i === 0} isLast={i === SAMPLE_TXS.length - 1} onPress={noop} />
            ))}
          </View>
        </Specimen>
      </GalleryGroup>

      <GalleryGroup title="Compositions">
        <Specimen
          title="Screen header with actions"
          description="Title left, up to two IconButtons right. Anything more goes in a 'more' menu."
          bare
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing('2') }}>
            <Text variant="title" style={{ flex: 1 }}>Transactions</Text>
            <IconButton icon={MagnifyingGlassIcon} onPress={noop} accessibilityLabel="Search" />
            <IconButton icon={SlidersHorizontalIcon} onPress={noop} accessibilityLabel="Filter" />
          </View>
        </Specimen>

        <Specimen
          title="Dashboard slice"
          description="KPIs → section header → grouped list. The rhythm every overview screen should follow."
          bare
        >
          <View style={{ flexDirection: 'row', gap: spacing('2') }}>
            <StatTile label="Income" icon={ArrowUpRightIcon} iconColor={colors.success} amount={84200} currency="INR" type="CR" compact />
            <StatTile label="Spent" icon={ArrowDownLeftIcon} iconColor={colors.danger} amount={5450} currency="INR" type="DR" compact />
          </View>
          <View style={{ marginHorizontal: -spacing('4') }}>
            <SectionHeader title="Top people" rightText="See all" onPressRight={noop} />
          </View>
          <ListGroup>
            <ListItem leading={<PersonAvatar name="Priya Sharma" color="#8B5CF6" size={36} />} title="Priya Sharma" subtitle="Owes you" value="₹1,200" onPress={noop} />
            <ListItem leading={<PersonAvatar name="Rahul" color="#0EA5E9" size={36} />} title="Rahul" subtitle="You owe" value="₹450" onPress={noop} />
          </ListGroup>
          <EmptyState variant="inline" icon={UserIcon} title="No loans" description="Lend or borrow money to track it here." />
        </Specimen>
      </GalleryGroup>
    </View>
  );
}
