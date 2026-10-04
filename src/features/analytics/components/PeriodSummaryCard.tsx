import React from 'react';
import { NetFlowGrid } from '@/src/components/ui';
import type { Totals } from '@/src/utils/analytics';

type Props = {
  totals: Totals;
  deltas: { income: number | null; expense: number | null };
  currency: string;
};

/** The period: net on the left, income over expenses (each against the previous period) on the right. */
export const PeriodSummaryCard = React.memo(function PeriodSummaryCard({ totals, deltas, currency }: Props) {
  return <NetFlowGrid income={totals.income} expense={totals.expense} currency={currency} incomeDelta={deltas.income} expenseDelta={deltas.expense} />;
});
