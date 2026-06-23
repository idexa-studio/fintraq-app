import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BentoPressable } from '../../../components/ui/BentoPressable';
import { MoneyText } from '../../../components/ui/MoneyText';
import { PersonAvatar } from '../../../components/ui/PersonAvatar';
import { ThemeContextType, useTheme } from '../../../providers/ThemeProvider';
import { colorNumberToHex } from '../../../utils/format';
import type { LoanWithStats } from '../api/loans';
import { LoanStatusBadge } from './LoanStatusBadge';
import { OutstandingBar } from './OutstandingBar';

type Props = {
  loan: LoanWithStats;
  onPress: (loan: LoanWithStats) => void;
  isFirst?: boolean;
  isLast?: boolean;
};

export const LoanCard = React.memo(function LoanCard({ loan, onPress, isFirst, isLast }: Props) {
  const theme = useTheme();
  const { colors, typography } = theme;
  const styles = useMemo(() => createStyles(theme), [theme]);

  const personColor = useMemo(() => colorNumberToHex(loan.personColor), [loan.personColor]);
  const handlePress = useCallback(() => onPress(loan), [onPress, loan]);

  const borderRadius = useMemo(() => ({
    borderTopLeftRadius: isFirst ? theme.radius('xl') : theme.radius('xs'),
    borderTopRightRadius: isFirst ? theme.radius('xl') : theme.radius('xs'),
    borderBottomLeftRadius: isLast ? theme.radius('xl') : theme.radius('xs'),
    borderBottomRightRadius: isLast ? theme.radius('xl') : theme.radius('xs'),
  }), [isFirst, isLast, theme]);

  return (
    <BentoPressable onPress={handlePress} style={[styles.card, borderRadius]}>
      <View style={styles.row}>
        <PersonAvatar name={loan.personName} color={personColor} size={40} />
        <View style={styles.info}>
          <Text style={[styles.name, { fontFamily: typography.fonts.semibold, color: colors.text }]} numberOfLines={1}>
            {loan.personName}
          </Text>
          <Text style={[styles.sub, { fontFamily: typography.fonts.regular, color: colors.textMuted }]} numberOfLines={1}>
            {loan.type === 'lend' ? 'You lent' : 'You borrowed'} · {loan.accountName}
          </Text>
        </View>
        <View style={styles.right}>
          <MoneyText amount={loan.outstanding} currency={loan.currency} type={loan.type === 'lend' ? 'CR' : 'DR'} weight="semibold" compact style={styles.amount} />
          <LoanStatusBadge status={loan.computedStatus} />
        </View>
      </View>
      <OutstandingBar
        principal={loan.principal}
        repaid={loan.repaid}
        color={loan.computedStatus === 'overdue' ? colors.danger : loan.computedStatus === 'repaid' ? colors.success : colors.primary}
      />
    </BentoPressable>
  );
});

const createStyles = ({ colors, spacing, shadow }: ThemeContextType) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing('4'),
      paddingVertical: spacing('3'),
      marginHorizontal: spacing('4'),
      marginBottom: spacing('1'),
      ...shadow('sm'),
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    info: { flex: 1 },
    name: { fontSize: 15 },
    sub: { fontSize: 12, marginTop: 2 },
    right: { alignItems: 'flex-end', gap: spacing('1') },
    amount: { fontSize: 15 },
  });
