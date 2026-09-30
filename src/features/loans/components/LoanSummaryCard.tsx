import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { Badge, MoneyText, PersonAvatar, ProgressBar, StatColumns, Text } from '@/src/components/ui';
import type { LoanWithStats } from '@/src/features/loans/api/loans';
import { LoanStatusBadge } from '@/src/features/loans/components/LoanStatusBadge';
import { ThemeContextType, useTheme } from '@/src/providers/ThemeProvider';
import { colorNumberToHex, formatDate } from '@/src/utils/format';
import { parseDateKey } from '@/src/utils/date';

type Props = { loan: LoanWithStats; personName: string };

/** Who, what's left, how far along — same card anatomy as the period and month summaries. */
export const LoanSummaryCard = React.memo(function LoanSummaryCard({ loan, personName }: Props) {
  const theme = useTheme();
  const { colors } = theme;
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const isLend = loan.type === 'lend';
  const pct = loan.principal > 0 ? Math.min(100, Math.round((loan.repaid / loan.principal) * 100)) : 0;
  const personColor = loan.personColor != null ? colorNumberToHex(loan.personColor) : colors.textMuted;

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <PersonAvatar name={personName} color={personColor} size={48} />
        <View style={styles.identity}>
          <Text variant="subheading" numberOfLines={1}>
            {personName}
          </Text>
          <View style={styles.badges}>
            <Badge label={isLend ? t('loans.lentOut') : t('loans.borrowed')} color={isLend ? colors.success : colors.danger} />
            <Badge label={loan.accountName} variant="muted" />
          </View>
        </View>
        <LoanStatusBadge status={loan.computedStatus} />
      </View>

      <View>
        <Text variant="label" tone="muted">
          {t('loans.outstandingBalance')}
        </Text>
        <MoneyText
          amount={loan.outstanding}
          currency={loan.currency}
          type={isLend ? 'CR' : 'DR'}
          weight="bold"
          style={styles.balance}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        />
      </View>

      <View style={styles.progress}>
        <ProgressBar progress={pct} height={8} color={isLend ? colors.success : colors.danger} accessibilityLabel={t('loans.repaidPct', { pct })} />
        <View style={styles.progressMeta}>
          <Text variant="caption" tone="muted">
            {t('loans.repaidPct', { pct })}
          </Text>
          {loan.dueDate ? (
            <Text variant="caption" tone={loan.computedStatus === 'overdue' ? 'danger' : 'muted'}>
              {t('loans.due', { date: formatDate(parseDateKey(loan.dueDate), { day: 'numeric', month: 'short', year: 'numeric' }) })}
            </Text>
          ) : null}
        </View>
      </View>

      <StatColumns
        columns={[
          { key: 'principal', label: t('loans.principal'), amount: loan.principal, currency: loan.currency },
          { key: 'repaid', label: t('loans.repaid'), amount: loan.repaid, currency: loan.currency },
        ]}
      />
    </View>
  );
});

const createStyles = ({ colors, spacing, radius, typography }: ThemeContextType) =>
  StyleSheet.create({
    card: { backgroundColor: colors.surface, borderRadius: radius('xl'), padding: spacing('4'), gap: spacing('4') },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing('3') },
    identity: { flex: 1, gap: spacing('1.5') },
    badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing('1.5') },
    balance: typography.metrics.xxxl,
    progress: { gap: spacing('1.5') },
    progressMeta: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing('3') },
  });
