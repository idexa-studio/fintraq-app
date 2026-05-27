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
| Dashboard insights (burn, runway, deltas) | `PremiumGuard` label="Upgrade to Pro for insights" |
| Analytics screen | `PremiumGuard` wraps entire screen |
| Area, bar, donut, DOW charts | Inside AnalyticsScreen |
| Period flow chart | `PremiumGuard` label="Period Flow" |
| Global search | Route-level gate (`app/search.tsx`) |
| CSV export screen | `PremiumGuard` label="CSV Export" |
| Save to folder / Share | Inside ExportScreen |
| Weekly & monthly reports | Hooks present, screens removed in current build |

## Pricing

- **Model**: One-time lifetime purchase
- **No subscriptions**, no recurring fees
- All future updates included
