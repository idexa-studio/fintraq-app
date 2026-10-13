/** Search: one field over every transaction, account, person and category. */
export default {
  title: 'Search',
  back: 'Back',
  placeholder: 'A note, account, person or category',
  clear: 'Clear search',
  start: {
    title: 'Find anything you recorded',
    body: 'Type part of a note, or the name of an account, a person or a category.',
  },
  recent: {
    title: 'Recent',
    clear: 'Clear',
    again: 'Search for {{query}} again',
    forget: 'Forget {{query}}',
  },
  kinds: {
    all: 'All {{count}}',
    transactions: 'Transactions {{count}}',
    accounts: 'Accounts {{count}}',
    people: 'People {{count}}',
    categories: 'Categories {{count}}',
  },
  groups: {
    transactions: 'Transactions',
    accounts: 'Accounts',
    people: 'People',
    categories: 'Categories',
  },
  kindLabel: 'Show',
  capped: 'These are the newest {{count}}. Type more to narrow it down.',
  none: {
    title: 'Nothing matches “{{query}}”',
    body: 'Search looks at notes and at the names of accounts, people and categories. Try fewer letters or another word.',
  },
} as const;
