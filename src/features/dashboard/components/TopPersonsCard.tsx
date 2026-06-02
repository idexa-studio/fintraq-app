import { MoneyText } from '@/src/components/ui/MoneyText';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import type { PersonNetRow } from '../api/dashboard';

type Props = {
  currency: string;
  persons: PersonNetRow[];
  onPressPerson: (id: number) => void;
};

function PersonInitials({ name, color, size = 28 }: { name: string; color: string; size?: number }) {
  const initials = name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: size * 0.36 }}>{initials}</Text>
    </View>
  );
}

export const TopPersonsCard = React.memo(function TopPersonsCard({ currency, persons, onPressPerson }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePress = useCallback((id: number) => () => onPressPerson(id), [onPressPerson]);

  return (
    <View style={styles.grid}>
      {persons.map((person, idx) => {
        const hex = colorNumberToHex(person.color);
        const marginRight = idx % 2 === 0 ? theme.spacing('1') : 0;
        const marginLeft = idx % 2 === 1 ? theme.spacing('1') : 0;
        const isPositive = person.net >= 0;

        return (
          <View key={person.id} style={styles.itemWrap}>
            <TouchableOpacity style={[styles.cell, { marginRight, marginLeft }]} onPress={handlePress(person.id)} activeOpacity={0.7}>
              <PersonInitials name={person.name} color={hex} size={28} />
              <View style={styles.cellContent}>
                <Text style={[styles.cellName, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
                  {person.name.split(' ')[0]}
                </Text>
                <MoneyText
                  amount={Math.abs(person.net)}
                  currency={currency}
                  type={isPositive ? 'CR' : 'DR'}
                  weight="bold"
                  compact
                  style={styles.cellAmount}
                />
              </View>
            </TouchableOpacity>
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
      borderRadius: radius('lg'),
      padding: spacing('3'),
      gap: spacing('2'),
      flexDirection: 'row',
      alignItems: 'center',
    },
    cellContent: {
      flex: 1,
      gap: spacing('0.5'),
    },
    cellName: {
      fontSize: 11,
    },
    cellAmount: {
      fontSize: 11,
    },
  });
