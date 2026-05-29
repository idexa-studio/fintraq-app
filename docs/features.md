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
| Advanced filters (multi-select, date, amount) | Available to all |
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
| Dashboard insights (spending spikes, saving alerts, weekly trends) | `PremiumGuard` |
| Analytics — 30/90/12 month time ranges (7D is free) | Pill lock icon → premium page |
| Analytics — Period flow chart | `PremiumGuard` |
| Analytics — Category breakdown donut | `PremiumGuard` |
| Analytics — Account split bars | `PremiumGuard` |
| Analytics — Spending by weekday heatmap | `PremiumGuard` |
| Analytics — Behavioral insights (burn, runway, ratio, active days) | `PremiumGuard` |
| Global search (transactions, accounts, categories) | Route-level gate (`app/search.tsx`) |
| CSV export (spreadsheet with filters, save/share) | `PremiumGuard` |

## Pricing

- **Model**: One-time lifetime purchase
- **No subscriptions**, no recurring fees
- All future updates included
