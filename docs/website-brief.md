# Fintraq — Website Brief for Developer

> Everything you need to build the marketing website. Last updated: 2026-05-29.

---

## App Identity

| Item | Value |
|---|---|
| Name | Fintraq |
| Tagline | "Free = Tracking. Premium = Insights + Control." |
| Website | `https://fintraq.idexa.app` |
| Pricing model | Lifetime one-time purchase. No subscriptions. |
| Platform | iOS & Android (React Native + Expo) |
| Version | 1.1.1 |

### Brand Colors

| Role | Light | Dark |
|---|---|---|
| Background | `#FCFCF9` | `#0D0D0F` |
| Surface | `#F5F5F2` | `#252528` |
| Primary accent | `#047857` | `#059669` |
| Text | `#171717` | `#F5F5F5` |
| Text muted | `#737373` | `#A3A3A3` |
| Success (income) | `#16A34A` | `#22C55E` |
| Danger (expense) | `#DC2626` | `#EF4444` |

### Typography

- **Font**: GoogleSans Flex (Regular, Medium, SemiBold, Bold)
- **Buttons**: Sentence case only ("Get lifetime access", not "GET LIFETIME ACCESS")
- **Headings**: Bold, clean, no letter-spacing tricks

---

## What the App Does

Fintraq is a personal finance tracker. Users add accounts (bank, cash, wallet), log transactions, and categorise their spending. The free tier covers everyday tracking. Fintraq Pro unlocks insights, analytics, search, and export.

---

## Free Features

- **Transaction tracking** — log income, expenses, and transfers between accounts
- **Multi-account** — unlimited accounts with custom icons, colours, and currencies (160+ supported)
- **Categories** — 44 default + custom with custom icons and colours
- **Dashboard** — net balance, income/expense totals, recent transactions, account overview
- **Top expenses** — per-category spending breakdown
- **Transaction list** — infinite scroll, grouped by date, swipe to edit or delete
- **Usage streak** — track your daily logging consistency
- **7-day analytics** — net position, savings rate, income/expense summary
- **Multi-currency** — accounts in different currencies side by side
- **Dark mode** — light, dark, and system theme
- **Daily reminders** — notification nudge at a time you pick
- **Local storage** — all data encrypted on-device, no cloud

---

## Fintraq Pro (Lifetime Purchase)

One payment. Every pro feature. Forever. All future updates included.

| Feature | What it does |
|---|---|
| Dashboard insights | Real-time spending spike alerts, saving trends, weekly summaries |
| Extended analytics | 30-day, 90-day, and 12-month time ranges (7D is free) |
| Period flow chart | Side-by-side income vs expense bars over time |
| Category breakdown | Top expense categories with amounts and percentages |
| Account split | See how your balance is distributed across accounts |
| Weekday patterns | Heatmap of spending by day of week |
| Behavioral insights | Daily burn rate, financial runway in days, in/out ratio, active days count |
| Global search | Find any transaction, account, or category instantly across your entire history |
| CSV export | Export filtered transactions to a spreadsheet. Save to device or share to any app. |

---

## Screenshots / Key Screens

| Screen | Description |
|---|---|
| Dashboard | Hero balance card with gradient glow, account carousel, insight cards, recent transactions |
| Transactions | Infinite-scroll list grouped by date, swipe actions, KPI summary, advanced filters |
| Analytics | Area chart, bar chart, category rows, account split, weekday heatmap (Pro) |
| Accounts | Full account management with balances, income/expense stats |
| Premium | Lifetime purchase page with bento feature grid |
| Search | Cross-entity full-text search (Pro only) |
| Settings | Preferences, theme, reminders, currency, privacy, factory reset |
| Export CSV | Date presets, account/type filters, live count preview |

---

## Tech Stack (for reference)

React Native, Expo, TypeScript, SQLite, Drizzle ORM, TanStack React Query

---

## Key Selling Points for Copy

1. **One price. Forever.** No subscriptions, no recurring charges.
2. **Private by design.** All data stored locally on your device. No cloud, no tracking.
3. **Beautiful and fast.** Premium emerald UI, dark mode, smooth animations.
4. **160+ currencies.** Works anywhere in the world.
5. **Grows with you.** Free tier covers daily tracking. Pro adds analytics, search, and export.

---

## Legal Links

- Privacy: `https://fintraq.idexa.app/in-app/privacy?platform=ios|android`
- Terms: `https://fintraq.idexa.app/in-app/terms?platform=ios|android`
