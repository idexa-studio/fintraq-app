/** Budgets: a monthly limit for a category or for everything, and how the month stands against it. */
export default {
  title: 'Budgets',
  hint: 'What is left this month',
  add: 'Add a budget',
  overall: 'All spending',
  row: {
    of: '{{spent}} of {{limit}}',
    left: '{{amount}} left',
    over: '{{amount}} over',
    reached: 'Limit reached',
  },
  head: {
    left: 'Left this month',
    over: 'Over this month',
    reached: 'Limit reached',
    limit: 'Limit',
    spent: 'Spent',
    daysLeft_one: '{{count}} day left',
    daysLeft_other: '{{count}} days left',
    lastDay: 'Last day of the month',
    today: 'Today',
    paceUnder: 'At this pace the month ends {{amount}} under.',
    paceOver: 'At this pace the month ends {{amount}} over.',
    pace: 'Spending against the limit, and where the month is heading',
  },
  empty: {
    title: 'Set a limit for a category',
    body: 'Fintraq shows what is left as the month goes, and tells you before you reach it.',
  },
} as const;
