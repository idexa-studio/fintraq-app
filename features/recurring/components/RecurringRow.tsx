import type { RecurringRuleView } from '@/data/repositories/recurring';
import { Badge, ListRow } from '@/design';
import { RuleMark } from '@/features/recurring/components/RuleMark';
import { useRepeatWords } from '@/features/recurring/hooks/useRepeatWords';
import { stateOf } from '@/features/recurring/recurring-view';
import { signedAmount } from '@/shared/format/money';
import React from 'react';
import { useTranslation } from 'react-i18next';

export type RecurringRowProps = {
  rule: RecurringRuleView;
  /** In place of how often and when next, e.g. the day in Upcoming. */
  line?: string;
  onPress: () => void;
};

/** The amount as a list shows money: out with a minus, in with a plus, a transfer as it is. */
export const ruleAmount = (rule: Pick<RecurringRuleView, 'type' | 'amount' | 'account'>): string =>
  signedAmount({ type: rule.type, amount: rule.amount, account: { currency: rule.account?.currency ?? '' } });

/** One repeating item: what, how often and when next, and the amount; paused, ended and stopped ones say so instead. */
export function RecurringRow({ rule, line, onPress }: RecurringRowProps) {
  const { t } = useTranslation('recurring');
  const words = useRepeatWords();
  const state = stateOf(rule);
  const badge = state === 'running' ? null : <Badge label={t(`row.${state}`)} tone={state === 'stopped' ? 'danger' : 'neutral'} />;
  return (
    <ListRow
      leading={<RuleMark rule={rule} />}
      strong
      title={words.name(rule)}
      subtitle={line ?? words.line(rule)}
      value={badge ? undefined : ruleAmount(rule)}
      valueTone={rule.type === 'CR' ? 'positive' : 'default'}
      trailing={badge ?? undefined}
      onPress={onPress}
    />
  );
}
