import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { NetFlowGrid, Skeleton } from '@/src/components/ui';
import { useMonthTotals } from '@/src/features/dashboard/hooks/dashboard';
import { buildMonthPulse } from '@/src/features/dashboard/utils/widgets';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';

type Props = { currency: string };

/** This month so far: the net and how much was kept, with income over spending (against last month to date). */
export const MonthPulseCard = React.memo(function MonthPulseCard({ currency }: Props) {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { data: totals, isLoading } = useMonthTotals(currency);

  const pulse = useMemo(() => (totals ? buildMonthPulse(totals, new Date()) : null), [totals]);

  return (
    <View style={styles.margin}>
      {isLoading || !pulse ? (
        <View style={styles.row}>
          <Skeleton height={148} radius="xl" style={styles.flex} />
          <Skeleton height={148} radius="xl" style={styles.flex} />
        </View>
      ) : (
        <NetFlowGrid income={pulse.income} expense={pulse.expense} currency={currency} expenseDelta={pulse.deltaVsLastMonth} />
      )}
    </View>
  );
});

const createStyles = ({ spacing, layout }: ThemeContextType) =>
  StyleSheet.create({
    margin: { marginHorizontal: layout.screenPadding },
    row: { flexDirection: 'row', gap: spacing('3') },
    flex: { flex: 1 },
  });
