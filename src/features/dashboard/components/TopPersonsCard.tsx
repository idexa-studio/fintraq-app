import { Text } from '@/src/components/ui/Text';
import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { PersonAvatar } from '@/src/components/ui/PersonAvatar';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { PersonNetRow } from '@/src/features/dashboard/api/dashboard';

type Props = {
  currency: string;
  persons: PersonNetRow[];
  onPressPerson: (id: number) => void;
};


export const TopPersonsCard = React.memo(function TopPersonsCard({ currency, persons, onPressPerson }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { width: screenWidth } = useWindowDimensions();
  // Two per row: an odd last tile keeps its size instead of stretching.
  const tileWidth = (screenWidth - theme.layout.screenPadding * 2 - theme.spacing('2.5')) / 2;

  const handlePress = useCallback((id: number) => () => onPressPerson(id), [onPressPerson]);

  return (
    <View style={styles.grid}>
      {persons.map((person) => {
        const hex = colorNumberToHex(person.color);
        const isPositive = person.net >= 0;

        return (
          <BentoPressable key={person.id} style={[styles.cell, { width: tileWidth }]} onPress={handlePress(person.id)} accessibilityRole="button" accessibilityLabel={person.name}>
              <PersonAvatar name={person.name} color={hex} size={36} />
              <View style={styles.cellContent}>
                <Text variant="calloutStrong" numberOfLines={1}>
                  {person.name.split(' ')[0]}
                </Text>
                <MoneyText
                  amount={Math.abs(person.net)}
                  currency={currency}
                  type={isPositive ? 'CR' : 'DR'}
                  weight="medium"
                  compact
                  style={styles.cellAmount}
                />
              </View>
          </BentoPressable>
        );
      })}
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography, layout }: ThemeContextType) =>
  StyleSheet.create({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing('2.5'),
      marginHorizontal: layout.screenPadding,
    },
    cell: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('3'),
      padding: spacing('3'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
    },
    cellContent: { flex: 1, gap: spacing('0.5') },
    cellAmount: { ...typography.metrics.xs },
  });
