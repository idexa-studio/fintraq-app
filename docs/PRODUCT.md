# Fintraq: free and Pro

What the rebooted product offers, what is free, what is Pro, and why. The
single source of truth in code is `features/pro/pro-features.ts`; this page
explains the reasoning behind it.

## The rule

**Recording your money is always free. Pro is for planning ahead,
understanding why, and having it done for you.**

Three promises follow from it and are never broken:

1. **Entry is never gated.** Unlimited transactions, accounts, categories and
   transfers on the free plan, for ever.
2. **Your data is never held hostage.** Anyone can save a full backup file to
   their device and restore it, free. Pro automates this to the cloud.
3. **Lifetime means lifetime.** Everyone who has bought the one-time licence
   keeps every Pro feature, including all those added later, with nothing
   more to pay.

## What is free

| Area | Free plan |
| --- | --- |
| Transactions | Unlimited expenses, income and transfers; notes; edit and delete |
| Accounts | Unlimited, in any currency; per-currency balance on Home |
| Categories | Unlimited, own icon and colour |
| People and loans | Up to 10 people and 3 active loans; repayments; due reminders |
| This month | Money in, money out, what was kept; top categories; this week's chart |
| Activity | Full history by day, filter by kind, account and category |
| Safety | App lock (PIN and biometrics); backup file to the device and restore from it |
| Habit | Daily reminder; logging streak |
| A taste of Plan | 1 budget, 2 repeating items, 1 goal |

## What Pro adds

Pro is organised as four jobs. Each has one line that explains it on the
paywall.

### Plan: know what is coming (new)

| Feature | What it does | Free allowance | Status |
| --- | --- | --- | --- |
| **Budgets** | A monthly limit per category or overall, with progress, a warning at 80% and at the limit, and optional rollover of what was left | 1 budget | Next |
| **Repeating items** | Rent, salary, subscriptions: entered once, then added automatically or offered for one-tap confirmation on the day. An "Upcoming" list shows the next 30 days | 2 items | Next |
| **Goals** | A target amount and date, fed from an account; shows what to set aside each month to get there | 1 goal | Later |
| **Safe to spend** | One number for today: income expected this month, minus bills still to come, minus budgets and goal contributions, divided by the days left | Pro only | Later |

### Understand: see why (exists today, regrouped)

| Feature | What it does | Status |
| --- | --- | --- |
| **Any period, compared** | 30 days, 90 days, 12 months and custom ranges, each against the period before | Live |
| **Forecast** | Daily average and where the month will end at the current pace | Live |
| **Category breakdown** | Every category's share for spending and income | Live |
| **Rhythm** | Which weekdays cost most, and a calendar of the month shaded by spending | Live |
| **People** | Who you spend with and how balances are spread | Live |
| **Insights** | Plain-language findings (the old "Highlights" are folded in here) | Live |
| **Net worth over time** | The line of what you have minus what you owe, month by month | Next |

### Find and share: get it out

| Feature | What it does | Status |
| --- | --- | --- |
| **Search** | Any transaction, account, person or category, across all history | Live |
| **Spreadsheet export** | Transactions and loans as CSV, saved or shared | Live |
| **Monthly statement** | A one-page PDF of the month: totals, categories, largest items. For landlords, accountants, or yourself | Later |

### Protect: stop worrying

| Feature | What it does | Status |
| --- | --- | --- |
| **Automatic cloud backup** | To the user's own Google Drive, twice a day, restorable on any phone | Live |
| **No limits** | More than 10 people, 3 loans, 1 budget, 2 repeating items and 1 goal | Live |

Status: **Live** exists in the shipped app and moves across unchanged in
function. **Next** is the first release after the redesign ships. **Later**
follows it. The paywall advertises only Live features as included, and lists
the others under "Coming to Pro, included in your purchase".

## What changed from the old split, and why

| Change | Reason |
| --- | --- |
| Backup file on the device becomes free | Promise 2. A free user who loses a phone today loses everything, which is the wrong reason to buy Pro |
| "Highlights" merged into "Insights" | They answered the same question in two places |
| "Weekly pattern" and the heat calendar become one feature, "Rhythm" | Same job, two charts |
| New Plan pillar | The app only looked backwards. Budgets and repeating items are the two things a tracker user asks for first, and features that work for you every month are what make a subscription, or a lifetime price, worth it |
| Free caps for people (10) and loans (3) unchanged | Lowering them would take something away from existing free users |

## Plans and pricing

The app is on Android only for now; everything below about stores means Google Play.

Pro is sold three ways from the redesign onwards (owner's decision,
2026-10-08). All three unlock exactly the same features.

| Plan | Billing | Role on the paywall |
| --- | --- | --- |
| **Lifetime** | Once | The one we want chosen. Listed first, preselected, marked "Best value" |
| **Yearly** | Every 12 months | The sensible subscription; makes lifetime look close |
| **Monthly** | Every month | The anchor: shows what Pro costs if you do not commit |

**How lifetime is pushed.** By the arithmetic, shown plainly, never by
pressure:

- Under Lifetime: "Pay once. Same as N months of monthly." N is computed
  from the store's live prices (`lifetimeBreakEvenMonths`).
- Under Yearly: "Save P% on monthly" (`yearlySavingPercent`).
- Price the three so the lines sell themselves. A workable shape: yearly at
  about 6 to 7 months of monthly, lifetime at about 2 years of yearly or
  less. For example 2.99 / 19.99 / 39.99: lifetime then equals 14 months of
  monthly and exactly two years of yearly.
- No countdown timers, no invented "was" prices, no pre-ticked trials. The old
  paywall's "Unlock in N seconds" delay goes.

**Rules that keep it fair**

- Prices and currency always come from the store at runtime; none are written
  in the app.
- A lapsed subscriber loses access to Pro features, never to data. Budgets,
  repeating items, goals, people and loans above the free allowance stay
  visible and deletable; adding more, and the Pro screens, ask for Pro again.
  Automatic backup stops; the last cloud backup stays restorable.
- Buying Lifetime while subscribed: the app says the subscription must be
  cancelled in the store and links to it. Stores do not cancel it for us.
- Restore purchases finds a lifetime licence or an active subscription.

**What this needs outside the code (owner)**

| Needed | Where |
| --- | --- |
| Re-enable the existing monthly and yearly subscription products: `luno_monthly`, `luno_yearly` (created before launch, never sold). Done by the owner, 2026-10-09 | Play Console |
| Final prices for the three plans | Both stores |
| Store listing and screenshots: remove "No subscriptions" wording | Both stores |
| Subscription terms and auto-renewal disclosure next to the buy button; updated privacy policy and terms | Paywall and website |

The existing lifetime product (`luno_lifetime` on Android,
`com.luno.lifetime` on iOS) is unchanged, so every existing buyer stays Pro.
The monthly and yearly products were created before the app's public release
and disabled before anyone could buy them, so there are no existing
subscribers to carry over.

## Ideas considered and not taken

| Idea | Why not (now) |
| --- | --- |
| Receipt photos | Multiplies backup size and needs a second backup format; worth revisiting after Plan ships |
| One net worth across currencies | Needs exchange rates, so either a network dependency in an offline-first app or rates typed by hand. Per-currency totals stay |
| Paid themes or app icons | Cosmetic; does not help anyone with their money |
| Auto-categorising rules | Useful only once repeating items exist; reconsider then |
| A free trial | Adds a third state to every gate; the free plan with a taste of Plan already lets people try before paying. Revisit with conversion data |

## Data needed for the new features

All additive; nothing existing changes shape. Each lands as a generated
Drizzle migration with a backup-format version bump and a test that older
backups still restore.

| Table | Holds | For |
| --- | --- | --- |
| `budgets` | category (or none for overall), currency, monthly limit, rollover flag | Budgets |
| `recurring_rules` | template of a transaction, cadence, next due date, auto-add or confirm, end date | Repeating items |
| `goals` | name, target amount, target date, linked account, icon and colour | Goals |

"Safe to spend", net worth over time and the monthly statement are computed
from existing and the new tables; they store nothing.
