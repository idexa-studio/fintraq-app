import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { Header } from '@/src/components/ui/Header';
import { PageBackground } from '@/src/components/ui/PageBackground';
import { usePersons } from '@/src/features/persons/hooks/persons';
import { usePremium } from '@/src/providers/PremiumProvider';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import { WalkthroughOverlay, PERSONS_WALKTHROUGH_STEPS } from '@/src/features/walkthrough';
import { StorageKeys } from '@/src/constants/keys';
import { CancelCircleIcon, LockPasswordIcon, PlusSignIcon, Search01Icon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';


const FREE_PERSON_LIMIT = 10;

function PersonInitials({ name, color, size = 40 }: { name: string; color: string; size?: number }) {
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return (
    <View style={{
      width: size, height: size, borderRadius: Math.round(size * 0.25),
      backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ color: color, fontWeight: '700', fontSize: size * 0.38 }}>{initials}</Text>
    </View>
  );
}

export const PersonsScreen = React.memo(function PersonsScreen() {
  const theme = useTheme();
  const { colors, typography } = theme;
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(theme, insets), [theme, insets]);
  const router = useRouter();
  const { isPremium } = usePremium();

  const { data: personList } = usePersons();
  const persons = useMemo(() => personList ?? [], [personList]);
  const atLimit = !isPremium && persons.length >= FREE_PERSON_LIMIT;

  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.phone?.toLowerCase().includes(q) ||
      p.company?.toLowerCase().includes(q) ||
      p.designation?.toLowerCase().includes(q),
    );
  }, [persons, query]);

  const handleAdd = useCallback(() => {
    if (atLimit) {
      router.push('/premium');
      return;
    }
    router.push('/(main)/persons/form');
  }, [atLimit, router]);

  const handlePersonPress = useCallback((id: number) => {
    router.push(`/(main)/persons/${id}`);
  }, [router]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <PageBackground />
      <Header title="Persons" />

      {persons.length > 0 && (
        <View style={styles.searchRow}>
          <View style={styles.searchWrap}>
            <HugeiconsIcon icon={Search01Icon} size={18} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { fontFamily: typography.fonts.regular, color: colors.text }]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search persons..."
              placeholderTextColor={colors.textMuted + '80'}
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
            />
            {query.length > 0 && (
              <BentoPressable onPress={() => setQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <HugeiconsIcon icon={CancelCircleIcon} size={17} color={colors.textMuted} />
              </BentoPressable>
            )}
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!isPremium && (
          <View style={styles.limitBanner}>
            <HugeiconsIcon icon={UserGroupIcon} size={16} color={colors.textMuted} />
            <Text style={[styles.limitText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              {persons.length}/{FREE_PERSON_LIMIT} persons — upgrade for unlimited
            </Text>
          </View>
        )}

        {filtered.length > 0 && (
          <View style={styles.group}>
            {filtered.map((person, idx) => {
              const hex = colorNumberToHex(person.color);
              const isLast = idx === filtered.length - 1;
              return (
                <BentoPressable
                  key={person.id}
                  style={[styles.row, !isLast && styles.rowGap]}
                  onPress={() => handlePersonPress(person.id)}
                >
                  <PersonInitials name={person.name} color={hex} size={40} />

                  <View style={styles.rowMeta}>
                    <Text style={styles.rowName} numberOfLines={1}>
                      {person.name}
                    </Text>
                    {(person.designation || person.company) ? (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {[person.designation, person.company].filter(Boolean).join(' · ')}
                      </Text>
                    ) : person.phone ? (
                      <Text style={styles.rowSub} numberOfLines={1}>
                        {person.phone}
                      </Text>
                    ) : null}
                  </View>

                </BentoPressable>
              );
            })}
          </View>
        )}

        {persons.length === 0 && (
          <View style={styles.empty}>
            <HugeiconsIcon icon={UserGroupIcon} size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              No persons yet
            </Text>
            <Text style={[styles.emptyHint, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              Add people to link with transactions
            </Text>
          </View>
        )}

        {persons.length > 0 && filtered.length === 0 && (
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { fontFamily: typography.fonts.regular, color: colors.textMuted }]}>
              No results for &quot;{query}&quot;
            </Text>
          </View>
        )}
      </ScrollView>

      <BentoPressable style={[styles.fab, { backgroundColor: atLimit ? colors.textMuted : colors.primary }]} onPress={handleAdd}>
        {atLimit
          ? <HugeiconsIcon icon={LockPasswordIcon} size={20} color={colors.background} />
          : <HugeiconsIcon icon={PlusSignIcon} size={24} color={colors.background} />
        }
      </BentoPressable>
      <WalkthroughOverlay storageKey={StorageKeys.WALKTHROUGH_PERSONS} steps={PERSONS_WALKTHROUGH_STEPS} />
    </SafeAreaView>
  );
});

const createStyles = ({ colors, spacing, radius, layout, typography }: ThemeContextType) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      paddingTop: spacing('2'),
      paddingBottom: 100,
    },

    searchRow: {
      paddingHorizontal: layout.screenPadding,
      paddingBottom: spacing('3'),
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 48,
      borderRadius: radius('lg'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      gap: spacing('2'),
    },
    searchInput: {
      flex: 1,
      fontSize: typography.sizes.md,
      padding: 0,
    },
 
    limitBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('1.5'),
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      marginBottom: spacing('3'),
    },
    limitText: { fontSize: typography.sizes.xs },
 
    group: {
      borderRadius: radius('xl'),
      overflow: 'hidden',
      marginBottom: spacing('4'),
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3.5'),
    },
    rowGap: { marginBottom: spacing('0.5') },
    rowMeta: { flex: 1 },
    rowName: {
      fontSize: typography.sizes.md,
      fontFamily: typography.fonts.medium,
      color: colors.text,
    },
    rowSub: {
      fontSize: typography.sizes.xs,
      fontFamily: typography.fonts.regular,
      color: colors.textMuted,
      marginTop: 2,
      opacity: 0.65,
    },

    empty: { alignItems: 'center', paddingVertical: spacing('11'), gap: spacing('2') },
    emptyText: { fontSize: 15 },
    emptyHint: { fontSize: 12, opacity: 0.5, textAlign: 'center' },

    fab: {
      position: 'absolute',
      bottom: 20,
      right: 16,
      width: 56,
      height: 56,
      borderRadius: radius('lg'),
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

