import React from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/src/components/ui';
import type { LoanStatus } from '@/src/features/loans/api/loans';
import { useTheme } from '@/src/providers/ThemeProvider';

type Props = { status: LoanStatus };

/** Repaid / overdue / active, as the standard tinted Badge. */
export const LoanStatusBadge = React.memo(function LoanStatusBadge({ status }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  if (status === 'repaid') return <Badge label={t('loans.statusRepaid')} color={colors.success} />;
  if (status === 'overdue') return <Badge label={t('loans.statusOverdue')} color={colors.danger} />;
  // No colour: the badge's default brand tint uses the readable ink for its text.
  return <Badge label={t('loans.statusActive')} />;
});
