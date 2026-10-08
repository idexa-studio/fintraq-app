/** The frame around every screen: tabs and start-up. */
export default {
  tabs: {
    home: 'Home',
    activity: 'Activity',
    add: 'Add',
    plan: 'Plan',
    insights: 'Insights',
  },
  start: {
    preparing: 'Getting your records ready',
    failedTitle: 'Fintraq could not open your records',
    failedBody: 'Close Fintraq and open it again. Your records are still on this phone: do not uninstall the app, or they go with it.',
  },
  // The app icon's long-press menu on the home screen.
  shortcuts: { expense: 'Add expense', income: 'Add income', transfer: 'Transfer', loan: 'Lend or borrow' },
  update: {
    title: 'Fintraq needs an update',
    titleVersion: 'Update to version {{version}}',
    body: 'This version is too old to keep your records safe. Updating takes a minute and nothing you recorded is lost.',
    points: {
      data: 'Everything you recorded stays on this phone',
      quick: 'It is the same app, a newer build',
    },
    action: 'Update Fintraq',
  },
  error: {
    title: 'Something went wrong on this screen',
    body: 'Your records are safe. Try again; if it keeps happening, close Fintraq and open it again.',
    retry: 'Try again',
  },
} as const;
