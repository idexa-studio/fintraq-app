import { BentoPressable } from '@/src/components/ui/BentoPressable';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex } from '@/src/utils/format';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Person } from '../../persons/api/persons';

type Props = {
  persons: Person[];
  selectedId: number | null;
  onSelect: (id: number | null) => void;
  label?: string;
};

export const TransactionPersonPicker = React.memo(function TransactionPersonPicker({
  persons,
  selectedId,
  onSelect,
  label = 'Linked person',
}: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { colors, typography } = theme;

  const handleNone = useCallback(() => onSelect(null), [onSelect]);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* None chip */}
        <BentoPressable
          style={[styles.chip, selectedId === null && styles.chipActive]}
          onPress={handleNone}
        >
          <Text style={[styles.chipText, { color: selectedId === null ? colors.primary : colors.textMuted }]}>
            None
          </Text>
        </BentoPressable>

        {persons.map(person => {
          const selected = selectedId === person.id;
          const hex = colorNumberToHex(person.color);
          const initials = person.name.trim().split(' ').map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('');

          return (
            <BentoPressable
              key={person.id}
              style={[styles.personChip, selected && { backgroundColor: hex + '18' }]}
              onPress={() => onSelect(person.id)}
            >
              <View style={[styles.avatar, { backgroundColor: hex }]}>
                <Text style={[styles.avatarText, { fontFamily: typography.styles.profileMono.fontFamily }]}>
                  {initials}
                </Text>
              </View>
              <Text style={[styles.personName, { fontFamily: typography.styles.rowLabel.fontFamily, color: selected ? colors.text : colors.textMuted }]} numberOfLines={1}>
                {person.name.split(' ')[0]}
              </Text>
              {selected && (
                <View style={[styles.checkDot, { backgroundColor: hex }]} />
              )}
            </BentoPressable>
          );
        })}
      </ScrollView>
    </View>
  );
});

const createStyles = ({ colors, typography, spacing, radius, layout }: ThemeContextType) =>
  StyleSheet.create({
    container: { paddingVertical: spacing('3') },
    label: {
      fontFamily: typography.styles.sectionLabel.fontFamily,
      fontSize: typography.sizes.xs,
      marginBottom: spacing('3'),
      paddingHorizontal: layout.screenPadding,
    },
    scroll: {
      paddingHorizontal: layout.screenPadding,
      gap: spacing('2.5'),
    },

    chip: {
      height: 36,
      paddingHorizontal: spacing('3.5'),
      borderRadius: radius('full'),
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
    },
    chipActive: { backgroundColor: colors.primary + '15' },
    chipText: { fontFamily: typography.styles.rowLabel.fontFamily, fontSize: typography.sizes.sm },

    personChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing('2'),
      height: 44,
      paddingHorizontal: spacing('3'),
      paddingVertical: spacing('2'),
      borderRadius: radius('xl'),
      backgroundColor: colors.surface,
      minWidth: 80,
    },
    avatar: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { color: '#fff', fontSize: typography.sizes.xs },
    personName: { fontSize: typography.sizes.sm, flex: 1 },
    checkDot: {
      position: 'absolute',
      top: -4,
      right: -4,
      width: 10,
      height: 10,
      borderRadius: 5,
      borderWidth: 2,
      borderColor: colors.background,
    },
  });
