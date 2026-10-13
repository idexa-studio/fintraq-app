import { CheckMark } from '@/design/components/StepRow';
import { Divider } from '@/design/components/Divider';
import { Icon } from '@/design/components/Icon';
import type { IconName } from '@/design/components/Icon';
import { ListRow } from '@/design/components/ListRow';
import { Text } from '@/design/components/Text';
import { TextField } from '@/design/components/TextField';
import { useStyles, useTheme } from '@/design/ThemeProvider';
import type { Theme } from '@/design/ThemeProvider';
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

export type Option<K extends string = string> = {
  key: K;
  title: string;
  subtitle?: string;
  /** Right-aligned text, e.g. a balance or a currency code. */
  value?: string;
  icon?: IconName;
  /** Any leading mark instead of an icon, e.g. an IconCircle. */
  leading?: React.ReactNode;
  /** Extra words that should find this option when searching. */
  keywords?: string;
};

export type OptionGroup<K extends string = string> = {
  /** Shown above the group, e.g. "Suggested". Omit for a single unlabelled list. */
  title?: string;
  options: Option<K>[];
};

export type OptionListProps<K extends string = string> = {
  groups: OptionGroup<K>[];
  selectedKey?: K;
  onSelect?: (key: K) => void;
  /** Shows a search field with this placeholder above the list. */
  searchPlaceholder?: string;
  /** What to say when the search finds nothing; receives the query. */
  noMatch?: (query: string) => string;
  /** A last row for making a new one, e.g. "Add a person". */
  addLabel?: string;
  onAdd?: () => void;
};

/**
 * One thing chosen from a list: a currency, an account, a category, a person,
 * a sort order. The chosen row carries a tick. Long lists get a search field.
 */
export function OptionList<K extends string>({ groups, selectedKey, onSelect, searchPlaceholder, noMatch, addLabel, onAdd }: OptionListProps<K>) {
  const { colors } = useTheme();
  const styles = useStyles(createStyles);
  const [query, setQuery] = useState('');
  const needle = query.trim().toLowerCase();

  const shown = useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          options: needle ? group.options.filter((o) => `${o.title} ${o.subtitle ?? ''} ${o.value ?? ''} ${o.keywords ?? ''}`.toLowerCase().includes(needle)) : group.options,
        }))
        .filter((group) => group.options.length > 0),
    [groups, needle],
  );

  return (
    <View style={styles.wrap}>
      {searchPlaceholder ? (
        <TextField icon="search" value={query} onChangeText={setQuery} placeholder={searchPlaceholder} accessibilityLabel={searchPlaceholder} autoCorrect={false} autoCapitalize="none" />
      ) : null}
      {shown.map((group, g) => (
        <View key={group.title ?? g} style={styles.group}>
          {group.title ? <Text variant="bodyStrong">{group.title}</Text> : null}
          <View style={styles.card}>
            {group.options.map((option, i) => (
              <React.Fragment key={option.key}>
                {i > 0 ? <Divider /> : null}
                <ListRow
                  title={option.title}
                  subtitle={option.subtitle}
                  value={option.key === selectedKey ? undefined : option.value}
                  icon={option.icon}
                  leading={option.leading}
                  strong={option.key === selectedKey}
                  trailing={option.key === selectedKey ? <CheckMark /> : <View />}
                  onPress={() => onSelect?.(option.key)}
                />
              </React.Fragment>
            ))}
          </View>
        </View>
      ))}
      {shown.length === 0 && needle ? <Text variant="body" tone="muted" align="center" style={styles.none}>{noMatch ? noMatch(query.trim()) : `No match for “${query.trim()}”`}</Text> : null}
      {addLabel ? (
        <View style={styles.card}>
          <ListRow leading={<Icon name="plus" color={colors.text} />} title={addLabel} strong onPress={onAdd} trailing={<View />} />
        </View>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, radius, space }: Theme) =>
  StyleSheet.create({
    wrap: { gap: space.lg },
    group: { gap: space.sm },
    card: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: 'hidden' },
    none: { paddingVertical: space.xl },
  });
