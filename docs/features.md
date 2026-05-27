# Feature Access Matrix

Last updated: 2026-05-27

## Free

| Feature | Notes |
|---|---|
| Dashboard KPI card (balance, income, expense) | |
| Currency selector | Multi-currency support |
| Accounts carousel | Horizontal scroll with balances |
| Recent transactions (last 6) | |
| Top expense categories | |
| Pro upsell bottom sheet | 5s block, reappears after 3-day TTL |
| Create / edit / delete transactions | |
| Account-to-account transfers (TR type) | |
| View transactions list | |
| Advanced filters (multi-select, date, amount) | Available to all users |
| View / create / edit / delete accounts | Unlimited — no account count restriction |
| View / create / edit / delete categories | CR, DR, TR types |
| Transfer (TR) type categories | |
| Usage streak badge | Shown on dashboard |
| Settings — preferences, theme, reminders | |
| Settings — privacy policy & terms | External links |
| Settings — factory reset | |
| Developer tools | PIN `32159` gated |
| Seed dummy data | One-time via AsyncStorage |
| Premium override (ON/OFF) | Dev screen only |
| Onboarding wizard | Account + default categories setup |
| Default categories (CR, DR, TR) | Created during onboarding |

## Premium

| Feature | Gate |
|---|---|
| Spending trends (charts by day, month, category) | `PremiumGuard` — Analytics screen |
| Burn velocity tracking | `PremiumGuard` — Dashboard insights |
| Runway forecasts (days remaining) | `PremiumGuard` — Dashboard insights |
| Performance deltas (current vs previous) | `PremiumGuard` — Dashboard insights |
| Global search (transactions, accounts, categories) | Route-level gate (`app/search.tsx`) |
| CSV export (spreadsheet with filters) | `PremiumGuard` label="CSV Export" |
| Weekly reports (auto summaries + breakdowns) | `PremiumGuard` (hooks present, screen pending) |
| Monthly reports (full statement view) | `PremiumGuard` (hooks present, screen pending) |

## Pricing

- **Model**: One-time lifetime purchase
- **No subscriptions**, no recurring fees
- All future updates included
