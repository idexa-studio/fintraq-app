/** The Activity tab: everything recorded, newest first. */
export default {
  title: 'Activity',
  search: 'Search',
  kinds: { all: 'All', expense: 'Expenses', income: 'Income', transfer: 'Transfers' },
  kindLabel: 'Show',
  summary: {
    title: { all: 'Everything recorded', expense: 'All expenses', income: 'All income', transfer: 'All transfers' },
    moneyIn: 'Money in',
    moneyOut: 'Money out',
    currency: 'Currency',
  },
  filteredBy: { account: 'Account: {{name}}', category: 'Category: {{name}}', remove: 'Show everything' },
  edit: 'Edit',
  delete: 'Delete',
  emptyTitle: 'No transactions yet',
  emptyBody: 'Add what you spend and earn, and it will show up here.',
  emptyAction: 'Add your first transaction',
  noMatchTitle: 'Nothing matches',
  noMatchBody: 'There is nothing of this kind here yet.',
  noMatchAction: 'Show everything',
} as const;
