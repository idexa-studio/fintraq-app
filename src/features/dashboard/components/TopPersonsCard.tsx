import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex, withAlpha } from '@/src/utils/format';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PersonNetRow } from '../api/dashboard';

type Props = {
  currency: string;
  persons: PersonNetRow[];
  onPressPerson: (id: number) => void;
};

function PersonInitials({ name, color, size = 32 }: { name: string; color: string; size?: number }) {
  const { typography } = useTheme();
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: withAlpha(color, '12'),
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Text style={{
        color: color,
        fontFamily: typography.fonts.medium,
        fontSize: Math.round(size * 0.38),
      }}>{initials}</Text>
    </View>
  );
}

export const TopPersonsCard = React.memo(function TopPersonsCard({ currency, persons, onPressPerson }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback((id: number) => () => onPressPerson(id), [onPressPerson]);

  return (
    <View style={styles.grid}>
      {persons.map((person, idx) => {
        const hex = colorNumberToHex(person.color);
        const marginRight = idx % 2 === 0 ? theme.spacing('1.5') : 0;
        const marginLeft = idx % 2 === 1 ? theme.spacing('1.5') : 0;
        const isPositive = person.net >= 0;

        return (
          <View key={person.id} style={styles.itemWrap}>
            <BentoPressable style={[styles.cell, { marginRight, marginLeft }]} onPress={handlePress(person.id)}>
              <PersonInitials name={person.name} color={hex} size={32} />
              <View style={styles.cellContent}>
                <Text style={styles.cellName} numberOfLines={1}>
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
          </View>
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
      paddingHorizontal: layout.screenPadding,
    },
    itemWrap: {
      width: '50%',
      marginBottom: spacing('2'),
    },
    cell: {
      backgroundColor: colors.surface,
      borderRadius: radius('xl'),
      padding: spacing('3'),
      gap: spacing('3'),
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    cellContent: {
      flex: 1,
      gap: spacing('0.5'),
    },
    cellName: {
      fontSize: typography.sizes.sm,
      fontFamily: typography.fonts.medium,
      color: colors.text,
    },
    cellAmount: {
      fontSize: 12,
    },
  });
