
# Luno — Website Brief for Developer

> Everything you need to build the marketing website. Last updated: 2026-05-27.

---

## App Identity

| Item | Value |
|---|---|
| Name | Luno |
| Tagline | "Free = Tracking. Premium = Insights + Control." |
| Website | `https://tryluno.app` |
| Pricing model | Lifetime one-time purchase. No subscriptions. |
| Platform | iOS & Android (React Native + Expo) |
| Version | 1.1.0 |

### Brand Colors

| Role | Light | Dark |
|---|---|---|
| Background | `#F6FFF9` | `#000100` |
| Surface | `rgba(0,0,0,0.05)` | `rgba(255,255,255,0.05)` |
| Primary accent | `#a6c13a` | `#B8D641` |
| Text | `#000100` | `#fbfff3` |
| Text muted | `#737a5f` | `#b2bb8b` |
| Success (income) | `#0E9F6E` | `#0E9F6E` |
| Danger (expense) | `#B42318` | `#B42318` |

### Typography

- **Font**: GoogleSans Flex (Regular, Medium, SemiBold, Bold)
- **Buttons**: Sentence case only ("See plans", not "SEE PLANS")
- **Headings**: Bold, clean, no letter-spacing tricks

---

## What the App Does

Luno is a personal finance tracker. Users add accounts (bank, cash, wallet), log transactions, and categorise their spending. The free tier covers everyday tracking. Luno Pro unlocks insights, analytics, search, and export.

---

## Free Features

- **Transaction tracking** — log income, expenses, and transfers between accounts
- **Multi-account** — unlimited accounts with custom icons, colours, and currencies (160+ supported)
- **Categories** — 44 default + custom with custom icons and colours
- **Dashboard** — net balance, income/expense totals, recent transactions, account overview
- **Top expenses** — per-category spending breakdown
- **Transaction list** — infinite scroll, grouped by day, swipe to edit or delete
- **Usage streak** — track your daily logging consistency
- **7-day analytics** — net position, savings rate, income/expense summary
- **Multi-currency** — accounts in different currencies side by side
- **Dark mode** — light, dark, and system theme
- **Daily reminders** — notification nudge at a time you pick
- **Local storage** — all data encrypted on-device, no cloud

---

## Luno Pro (Lifetime Purchase)

One payment. Every pro feature. Forever. All future updates included.

| Feature | What it does |
|---|---|
| Dashboard insights | Real-time spending spike alerts, saving trends, weekly summaries |
| Extended analytics | 30-day, 90-day, and 12-month time ranges (7D is free) |
| Period flow chart | Side-by-side income vs expense bars over time |
| Category breakdown | Donut chart of top expense categories |
| Account split | See how your balance is distributed across accounts |
| Weekday patterns | Heatmap of spending by day of week |
| Behavioral insights | Daily burn rate, financial runway, in/out ratio, active days count |
| Global search | Find any transaction, account, or category instantly across your entire history |
| CSV export | Export filtered transactions to a spreadsheet. Save to device or share to any app. |

---

## Screenshots / Key Screens

| Screen | Description |
|---|---|
| Dashboard | Hero balance card, account carousel, recent transactions, quick actions |
| Transactions | Infinite-scroll list grouped by date, swipe actions, KPI summary |
| Analytics | Area chart, bar chart, donut chart, weekday heatmap (Pro features) |
| Accounts | Full account management with balances, income/expense stats |
| Premium | Lifetime purchase page with bento feature grid |
| Search | Cross-entity full-text search (Pro only) |
| Settings | Preferences, theme, reminders, privacy, factory reset |
| Export CSV | Date range presets, account/type filters, live count preview |

---

## Tech Stack (for reference)

React Native, Expo, TypeScript, SQLite, Drizzle ORM, TanStack React Query

---

## Key Selling Points for Copy

1. **One price. Forever.** No subscriptions, no recurring charges.
2. **Private by design.** All data stored locally on your device. No cloud, no tracking.
3. **Beautiful and fast.** Bento-style UI, dark mode, smooth animations.
4. **160+ currencies.** Works anywhere in the world.
5. **Grows with you.** Free tier covers daily tracking. Pro adds analytics, search, and export.

---

## Legal Links

- Privacy: `https://tryluno.app/in-app/privacy?platform=ios|android`
- Terms: `https://tryluno.app/in-app/terms?platform=ios|android`
