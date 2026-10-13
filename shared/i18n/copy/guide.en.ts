/** Finding your way round: one-time tips on the tabs, and the note for someone updating. */
export default {
  tips: {
    dismiss: 'Close tip',
    activity: {
      title: 'Swipe a transaction',
      body: 'Swipe a row to the left to edit or delete it. Tap it to see the whole transaction.',
    },
    plan: {
      title: 'The loan due first is at the top',
      body: 'Open a loan to record a repayment or change its due date.',
    },
  },
  whatsNew: {
    title: 'Fintraq has a new look',
    done: 'Got it',
    tabs: {
      title: 'Five tabs',
      body: 'Home, Activity, Add, Plan and Insights. Loans and people are under Plan.',
    },
    settings: {
      title: 'Settings moved',
      body: 'Tap the profile icon at the top of Home for settings, accounts, categories and backup.',
    },
    budgets: {
      title: 'Budgets',
      body: 'Set a monthly limit for a category under Plan and see what is left as you spend.',
    },
    records: {
      title: 'Your records are as you left them',
      body: 'Every account, transaction and loan carried over. Nothing was changed.',
    },
  },
} as const;
