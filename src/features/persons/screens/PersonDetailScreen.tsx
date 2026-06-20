import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ConfirmDialog } from '@/src/components/ui/ConfirmDialog';
import { Header } from '@/src/components/ui/Header';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { TransactionRow } from '@/src/components/ui/TransactionRow';
import { usePersonWithStats, useTransactionsByPerson, useDeletePerson } from '@/src/features/persons/hooks/persons';
import { useAccounts } from '@/src/features/accounts/hooks/accounts';
import { useCategories } from '@/src/features/categories/hooks/categories';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function PersonInitials({ name, color, size = 64 }: { name: string; color: string; size?: number }) {
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: color, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export const PersonDetailScreen = React.memo(function PersonDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const personId = Number(id);
  const router = useRouter();
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const deletePerson = useDeletePerson();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { data: txList } = useTransactionsByPerson(personId);
  const { data: accounts } = useAccounts();
  const { data: categories } = useCategories();

  const availableCurrencies = useMemo(() => {
    if (!txList || !accounts) return ['USD'];
    const currencies = Array.from(new Set(
      txList.map(tx => accounts.find(a => a.id === tx.accountId)?.currency).filter((c): c is string => !!c)
    ));
    return currencies.length > 0 ? currencies : ['USD'];
  }, [txList, accounts]);

  const [selectedCurrency, setSelectedCurrency] = useState<string>('');
  const currency = selectedCurrency || (availableCurrencies[0] ?? 'USD');

  const { data: person, isLoading } = usePersonWithStats(personId, currency);

  const enrichedTx = useMemo(() => {
    if (!txList || !accounts || !categories) return [];
    return txList
      .filter(tx => {
        const account = accounts.find(a => a.id === tx.accountId);
        return account?.currency === currency;
      })
      .map(tx => {
        const account = accounts.find(a => a.id === tx.accountId);
        const category = categories.find(c => c.id === tx.categoryId);
        return {
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          datetime: tx.datetime,
          note: tx.note,
          account: {
            name: account?.name ?? '',
            currency: account?.currency ?? currency,
            icon: account?.icon ?? 'domain',
            color: account?.color ?? 0,
          },
          category: {
            name: category?.name ?? '',
            icon: category?.icon ?? 'grid',
            color: category?.color ?? 0,
          },
          toAccount: null,
        };
      });
  }, [txList, accounts, categories, currency]);

  const handleEdit = useCallback(() => {
    router.push(`/(main)/persons/form?id=${personId}`);
  }, [personId, router]);

  const handleDeleteConfirm = useCallback(() => {
    deletePerson.mutate(personId);
    setShowDeleteConfirm(false);
    router.back();
  }, [personId, deletePerson, router]);

  const handleTxPress = useCallback((tx: { id: number }) => {
    router.push(`/transactions/edit/${tx.id}`);
  }, [router]);

  if (isLoading || !person) {
    return (
      <SafeAreaView style={styles.container}>
        <PageBackground />
        <Header title="Person" showBack />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const hex = colorNumberToHex(person.color);

  return (
    <SafeAreaView style={styles.container}>
      <PageBackground />
      <Header
        title={person.name}
        showBack
        rightAction={
          <View style={styles.headerActions}>
            <BentoPressable
              onPress={() => setShowDeleteConfirm(true)}
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={colors.danger} />
            </BentoPressable>
            <BentoPressable
              onPress={handleEdit}
              style={styles.iconBtn}
            >
              <MaterialCommunityIcons name="pencil-outline" size={20} color={colors.text} />
            </BentoPressable>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <PersonInitials name={person.name} color={hex} size={60} />
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, { fontFamily: typography.fonts.bold, color: colors.text }]}>
                {person.name}
              </Text>
              {(person.designation || person.company) ? (
                <Text style={[styles.heroRole, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                  {[person.designation, person.company].filter(Boolean).join(' · ')}
                </Text>
              ) : null}
            </View>
          </View>

          {(person.email || person.phone) ? (
            <View style={styles.contactRow}>
              {person.email ? (
                <View style={styles.contactChip}>
                  <MaterialCommunityIcons name="email-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.contactText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
                    {person.email}
                  </Text>
                </View>
              ) : null}
              {person.phone ? (
                <View style={styles.contactChip}>
                  <MaterialCommunityIcons name="phone-outline" size={14} color={colors.textMuted} />
                  <Text style={[styles.contactText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
                    {person.phone}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Currency switcher — only when multiple currencies */}
        {availableCurrencies.length > 1 && (
          <View style={styles.currencyRow}>
            {availableCurrencies.map(c => (
              <BentoPressable
                key={c}
                style={[styles.currencyPill, c === currency && styles.currencyPillActive]}
                onPress={() => setSelectedCurrency(c)}
              >
                <Text style={[styles.currencyPillText, c === currency && styles.currencyPillTextActive]}>
                  {c}
                </Text>
              </BentoPressable>
            ))}
          </View>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, { backgroundColor: colors.danger + '15' }]}>
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.danger }]}>Spent</Text>
            <MoneyText amount={person.totalSpent} currency={currency} type="DR" weight="bold" compact style={styles.statValue} />
          </View>
          <View style={[styles.statTile, { backgroundColor: colors.success + '15' }]}>
            <Text style={[styles.statLabel, { fontFamily: typography.fonts.semibold, color: colors.success }]}>Received</Text>
            <MoneyText amount={person.totalReceived} currency={currency} type="CR" weight="bold" compact style={styles.statValue} />
          </View>
        </View>

        {/* Transactions */}
        {enrichedTx.length > 0 ? (
          <View style={styles.txSection}>
            <Text style={styles.txTitle}>
              Transactions
            </Text>
            {enrichedTx.map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                isFirst={idx === 0}
                isLast={idx === enrichedTx.length - 1}
                showDate
                onPress={handleTxPress}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyTx}>
            <MaterialCommunityIcons name="receipt-text-outline" size={28} color={colors.textMuted} />
            <Text style={[styles.emptyTxText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              No transactions in {currency}
            </Text>
          </View>
        )}
      </ScrollView>

      <ConfirmDialog
        visible={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Delete person"
        message={`Delete ${person.name}? Their linked transactions will keep the data but lose the person link.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteConfirm}
        isLoading={deletePerson.isPending}
      />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scroll: { paddingTop: spacing('3'), paddingBottom: spacing('10') },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: -spacing('2'),
    },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: radius('full'),
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'transparent',
    },

    heroCard: {
      backgroundColor: colors.surface,
      borderRadius: radius('2xl'),
      marginHorizontal: layout.screenPadding,
      padding: spacing('5'),
      marginBottom: spacing('3'),
      gap: spacing('3'),
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: spacing('4') },
    heroInfo: { flex: 1, gap: spacing('1') },
    heroName: { fontSize: 20 },
    heroRole: { fontSize: 13, opacity: 0.7 },
    contactRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('3') },
    contactChip: { flexDirection: 'row', alignItems: 'center', gap: spacing('1.5') },
    contactText: { fontSize: 12 },

    currencyRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      paddingHorizontal: layout.screenPadding,
      marginBottom: spacing('3'),
    },
    currencyPill: {
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('1.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
    },
    currencyPillActive: { backgroundColor: colors.primary + '18' },
    currencyPillText: { fontFamily: typography.fonts.semibold, color: colors.textMuted, fontSize: 11 },
    currencyPillTextActive: { color: colors.primary },

    statsRow: {
      flexDirection: 'row',
      gap: spacing('2'),
      paddingHorizontal: layout.screenPadding,
      marginBottom: spacing('4'),
    },
    statTile: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      gap: spacing('1'),
    },
    statLabel: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.fonts.semibold,
    },
    statValue: { fontSize: 14 },
    statPlain: { fontSize: 18 },

    txSection: { paddingHorizontal: layout.screenPadding },
    txTitle: {
      fontFamily: typography.fonts.semibold,
      color: colors.textMuted,
      fontSize: typography.sizes.xs,
      marginBottom: spacing('2'),
    },
    emptyTx: { alignItems: 'center', paddingVertical: spacing('9'), gap: spacing('2') },
    emptyTxText: { fontSize: typography.sizes.sm },
  });
