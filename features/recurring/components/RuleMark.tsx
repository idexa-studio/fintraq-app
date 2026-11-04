import type { RecurringRuleView } from '@/data/repositories/recurring';
import { IconCircle, resolveIcon } from '@/design';
import { colorNumberToHex } from '@/shared/format/color';
import React from 'react';

export type RuleMarkProps = { rule: Pick<RecurringRuleView, 'type' | 'category'> };

/** The mark of what an item makes: a transfer's arrows, else its category's, plain once the category is gone. */
export function RuleMark({ rule }: RuleMarkProps) {
  if (!rule.category) return <IconCircle icon={rule.type === 'TR' ? 'arrows-left-right' : 'repeat'} plain />;
  return <IconCircle icon={rule.type === 'TR' ? 'arrows-left-right' : resolveIcon(rule.category.icon, 'tag')} color={colorNumberToHex(rule.category.color)} />;
}

