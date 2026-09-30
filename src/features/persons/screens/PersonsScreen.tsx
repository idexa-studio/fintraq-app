import { InboxIcon, UserGroupIcon } from '@hugeicons/core-free-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet } from 'react-native';
import { Banner, EmptyState, Fab, LIST_ITEM_LEADING_SIZE, ListGroup, ListItem, PersonAvatar, Screen, SearchField } from '@/src/components/ui';
import { FREE_PERSON_LIMIT } from '@/src/constants/iap';
import { usePersons } from '@/src/features/persons/hooks/persons';
import { useProAccess } from '@/src/features/premium/hooks/useProAccess';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';

/** Everyone you track, searchable by name, contact or work details. */
export const PersonsScreen = React.memo(function PersonsScreen() {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const router = useRouter();
  const { isPremium, openPaywall } = useProAccess();

  const { data: persons = [] } = usePersons();
  const atLimit = !isPremium && persons.length >= FREE_PERSON_LIMIT;
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return persons;
    return persons.filter((p) => [p.name, p.email, p.phone, p.company, p.designation].some((field) => field?.toLowerCase().includes(q)));
  }, [persons, query]);

  const add = useCallback(() => {
    if (atLimit) openPaywall('unlimited');
    else router.push('/(main)/persons/form');
  }, [atLimit, openPaywall, router]);

  return (
    <Screen header={{ title: t('persons.title'), showBack: true }} variant="fixed" edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {atLimit ? (
          <Banner tone="warning" title={t('persons.limitMessage', { limit: FREE_PERSON_LIMIT })} actionLabel={t('loans.upgrade')} onAction={() => openPaywall('unlimited')} />
        ) : null}

        {persons.length > 0 ? <SearchField value={query} onChangeText={setQuery} placeholder={t('persons.searchPlaceholder')} on="page" /> : null}

        {persons.length === 0 ? (
          <EmptyState icon={UserGroupIcon} title={t('persons.none')} description={t('persons.noneHint')} actionLabel={t('persons.add')} onAction={add} />
        ) : filtered.length === 0 ? (
          <EmptyState variant="inline" icon={InboxIcon} title={t('search.noResults')} description={t('search.noMatch', { query })} />
        ) : (
          <ListGroup>
            {filtered.map((person) => (
              <ListItem
                key={person.id}
                leading={<PersonAvatar name={person.name} color={colorNumberToHex(person.color)} size={LIST_ITEM_LEADING_SIZE} />}
                title={person.name}
                subtitle={[person.designation, person.company].filter(Boolean).join(' · ') || person.phone || undefined}
                onPress={() => router.push(`/(main)/persons/${person.id}`)}
              />
            ))}
          </ListGroup>
        )}
      </ScrollView>

      <Fab onPress={add} accessibilityLabel={t('persons.add')} />
    </Screen>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    content: { paddingHorizontal: layout.screenPadding, paddingTop: spacing('2'), paddingBottom: 56 + spacing('12'), gap: spacing('4') },
  });
