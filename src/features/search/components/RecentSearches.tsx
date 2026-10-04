import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { BentoPressable, Chip, Text } from '@/src/components/ui';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type RecentSearchesProps = {
  recents: readonly string[];
  onSelect: (query: string) => void;
  onRemove: (query: string) => void;
  onClearAll: () => void;
};

export const RecentSearches = React.memo(function RecentSearches({ recents, onSelect, onRemove, onClearAll }: RecentSearchesProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  if (recents.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="label" tone="muted">
          {t('search.recent')}
        </Text>
        <BentoPressable onPress={onClearAll} hitSlop={8} style={styles.clear} accessibilityRole="button" accessibilityLabel={t('search.clearHistory')}>
          <Text variant="caption" tone="danger">
            {t('search.clearHistory')}
          </Text>
        </BentoPressable>
      </View>
      <View style={styles.chips}>
        {recents.map((recent) => (
          <Chip key={recent} label={recent} icon="clock" onPress={() => onSelect(recent)} onClear={() => onRemove(recent)} />
        ))}
      </View>
    </View>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { gap: spacing('3') },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing('1') },
    clear: { minHeight: layout.minTouchTarget, justifyContent: 'center' },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('2') },
  });
