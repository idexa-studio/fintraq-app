/**
 * Everything Fintraq says outside the app: the lines on the lock screen and the names in the
 * phone's notification settings.
 *
 * The voice (docs/PRODUCT.md, "Notifications"): the title says what it is about, the body is one
 * useful sentence, nothing shouts, and nothing is claimed that the app does not know. A title
 * stays within about 24 characters: a collapsed notification on the owner's phone cuts it there.
 */
export default {
  channels: {
    reminders: { name: 'Reminders', description: 'Your daily reminder and loan due dates' },
    backup: { name: 'Backup', description: 'Shown while a backup runs, and when one needs you' },
  },
  daily: {
    first: { title: 'Your first transaction', body: 'Add the last thing you paid for. It takes half a minute.' },
    weekday: {
      mon: { title: 'Monday’s spending', body: 'Add it now, while you still remember the small ones.' },
      tue: { title: 'Anything to add today?', body: 'Lunch, a ride, a bill. Half a minute and today is done.' },
      wed: { title: 'Half the week done', body: 'Add today and the week stays complete.' },
      thu: { title: 'Thursday’s spending', body: 'The small ones slip first. Add them before they do.' },
      fri: { title: 'Before the weekend', body: 'Add today so the weekend starts from the right balance.' },
      sat: { title: 'Saturday’s spending', body: 'Weekends are the easiest to lose track of. Add today while it is fresh.' },
      sun: { title: 'Last day of the week', body: 'Add today and the week is complete.' },
    },
    weekEnd: {
      title: '{{count}} recorded this week',
      body: 'Add today and the week is complete.',
    },
    monthStart: { title: '{{month}} starts today', body: 'A new month to fill in. Add the first thing you spend.' },
    monthEnd: {
      title: 'Last day of {{month}}',
      body: '{{count}} recorded so far. Add anything missing and the month is complete.',
    },
    missedYesterday: { title: 'Yesterday is missing', body: 'Add yesterday and today together. It still takes under a minute.' },
    quietSince: { title: 'Quiet since {{day}}', body: 'A few days are easy to catch up on. Start with what you remember.' },
    quiet: { title: 'It has been a while', body: 'No catching up needed. Start again with today.' },
    loanTomorrow: {
      lend: { title: '{{name}} owes you {{amount}}', body: 'Due tomorrow. Add today’s spending while you are here.' },
      borrow: { title: 'You owe {{name}} {{amount}}', body: 'Due tomorrow. Add today’s spending while you are here.' },
    },
  },
  loan: {
    when: { today: 'Due today', tomorrow: 'Due tomorrow', inDays_one: 'Due in {{count}} day', inDays_other: 'Due in {{count}} days' },
    due: {
      lend: { title: '{{name}} owes you {{amount}}', titleNoName: 'You are owed {{amount}}', body: '{{when}}. Add the repayment when it arrives.' },
      borrow: { title: 'You owe {{name}} {{amount}}', titleNoName: 'You owe {{amount}}', body: '{{when}}. Add the repayment once you have paid.' },
    },
    instalment: {
      lend: { title: '{{name}} pays you today', titleNoName: 'A payment comes in today', body: '{{amount}} still to come. Add it when it arrives.' },
      borrow: { title: 'Pay {{name}} today', titleNoName: 'Loan payment due today', body: '{{amount}} left to repay. Add it once you have paid.' },
    },
  },
  backup: {
    running: { title: 'Backing up' },
    failed: { title: 'Backup did not finish', body: 'Fintraq will try again by itself. Open Backup to run it now.' },
    reconnect: { title: 'Reconnect Google Drive', body: 'Fintraq was signed out of your Google account. Connect it again and backups carry on.' },
  },
} as const;
