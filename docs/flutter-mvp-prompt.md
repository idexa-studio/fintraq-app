# Luno — Flutter MVP Build Prompt (A-Z)

> Complete specification to rebuild the Luno personal finance tracker in Flutter.
> Current production app: React Native + Expo. Target: Flutter.

---

## 1. App Identity

| Field | Value |
|---|---|
| Name | Luno |
| Tagline | Free = Tracking. Premium = Insights + Control. |
| iOS Bundle | `me.nafish.luno` |
| Android Package | `me.nafish.luno` |
| Pricing | Lifetime one-time purchase via IAP |
| Orientation | Portrait only |
| Website | `https://tryluno.app` |

---

## 2. Design System

### Colors (Dual Theme)

| Token | Dark | Light |
|---|---|---|
| `background` | `#0D0D0F` | `#FCFCF9` |
| `card` | `#18181B` | `#F9F9F6` |
| `surface` | `#252528` | `#F5F5F2` |
| `primary` | `#B0C443` | `#8A9D16` |
| `text` | `#F5F5F5` | `#171717` |
| `textMuted` | `#A3A3A3` | `#737373` |
| `success` | `#22C55E` | `#16A34A` |
| `danger` | `#EF4444` | `#DC2626` |
| `warning` | `#EAB308` | `#CA8A04` |
| `info` | `#3B82F6` | `#2563EB` |

### Typography

- **Font**: GoogleSans Flex (Regular, Medium, SemiBold, Bold)
- **Scale**: 11/13/14/16/18/22/28px
- **Headings**: Bold, 22-28px
- **Body**: Regular, 13-14px
- **Labels**: SemiBold, 9-10px

### Rules
- **No `letterSpacing`** anywhere
- **Sentence case** on all buttons and labels
- **No borders** (use surface background contrast for separation)
- **Card radius**: 20px (`radius('xl')`) default
- **Dialog radius**: 24px (`radius('2xl')`)
- **Spacing**: 4px base grid (4, 8, 12, 16, 20, 24, 32...)
- **No shadows** in styles

---

## 3. Tech Stack (Flutter)

| Layer | Package |
|---|---|
| State | `riverpod` or `provider` |
| Database | `sqflite` or `drift` (SQLite) |
| Routing | `go_router` |
| IAP | `in_app_purchase` |
| Notifications | `flutter_local_notifications` |
| Charts | `fl_chart` |
| Fonts | GoogleSans Flex (custom TTF) |
| Icons | Ionicons via `flutter_ionicons` or custom |
| Storage | `shared_preferences` |
| File Export | `path_provider` + `share_plus` |

---

## 4. Database Schema (SQLite)

### `accounts`
```
id        INTEGER PRIMARY KEY AUTOINCREMENT
name      TEXT NOT NULL
holder_name TEXT NOT NULL
account_number TEXT NOT NULL
icon      TEXT DEFAULT 'wallet'
color     INTEGER NOT NULL
is_default INTEGER DEFAULT 0
currency  TEXT DEFAULT 'USD'
balance   REAL DEFAULT 0
income    REAL DEFAULT 0
expense   REAL DEFAULT 0
created_at TEXT
updated_at TEXT
```

### `categories`
```
id        INTEGER PRIMARY KEY AUTOINCREMENT
name      TEXT NOT NULL
icon      TEXT DEFAULT 'grid'
color     INTEGER NOT NULL
type      TEXT NOT NULL  -- 'CR' | 'DR' | 'TR'
created_at TEXT
updated_at TEXT
```

### `payments`
```
id        INTEGER PRIMARY KEY AUTOINCREMENT
account_id INTEGER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE
category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE
to_account_id INTEGER REFERENCES accounts(id) ON DELETE SET NULL
amount    REAL NOT NULL
type      TEXT NOT NULL  -- 'CR' | 'DR' | 'TR'
datetime  TEXT NOT NULL  -- ISO 8601
note      TEXT NOT NULL
created_at TEXT
updated_at TEXT
```

### `seeder_state`
```
id        INTEGER PRIMARY KEY AUTOINCREMENT
name      TEXT UNIQUE NOT NULL
executed_at TEXT
```

---

## 5. All Screens & Features

### 5.1 Onboarding (3-Step Wizard)
- **Welcome step**: 3 feature highlights with icons (Fast capture, Built-in analytics, Private by design)
- **Profile step**: Name input with validation (required, 2-30 chars), currency picker (device-detected default, 160+ currencies)
- **Post-setup**: Creates default "Cash" account, seeds 44 default categories (8 income + 35 expense + 1 transfer), enables daily reminder prompt

### 5.2 Dashboard (Home)
- Time-greeted header with date
- Header icons: Search (Pro), Analytics, Settings
- **Hero Balance Card**: Gradient glow, primary-colored, shows total balance (40px), income/expense breakdown with success/danger colors, flow bar (green/red ratio)
- **Insights Carousel (Pro)**: Horizontal auto-scrolling cards with dot indicators, 4s interval, 6 insight types (spending vs last week, income change, savings rate, category spike, weekly summary, month net), human-friendly text
- **Accounts Carousel**: Horizontal scroll of account cards (icon, name, masked number, currency, balance, in/out stats) with peek effect, "Add account" card at end
- **Top Expense Categories**: Ranked list with colored progress bars, percentages
- **Recent Transactions**: Last 6 transactions, tappable to edit
- **FAB**: Quick-add transaction button
- **Premium Upsell Sheet**: Shows every 3 days for free users, 5-second block before dismiss

### 5.3 Transactions List
- Infinite-scroll grouped by date
- Day headers with income/expense totals
- Each row: category icon, title, category · account, amount (colored by type), time
- Swipe to edit/delete
- Filter button → opens Advanced Filter Sheet
- KPI card at top (per-currency totals)
- Empty state with CTA

### 5.4 Transaction Form (Create/Edit)
- Type picker: Income / Expense / Transfer pills
- Amount input with currency prefix
- Account picker
- To-Account picker (only for Transfer type)
- Category picker (filtered by type)
- Date & Time pickers
- Note input
- Transfer balances adjust both accounts

### 5.5 Advanced Filters (Bottom Sheet)
- 3 type pills: Income / Expense / Transfer
- Date range: presets or custom with native date pickers
- Amount range: Min/Max text inputs
- Account multi-select with checkboxes
- Category multi-select chips
- Sort: Date/Amount, Newest/Oldest
- Apply button with result count

### 5.6 Analytics (Pro)
- Currency + time range (7D free, 30D/90D/12M Pro)
- Net position + savings rate metric tiles
- Spending trend area chart
- Period flow bar chart
- Category breakdown rows with progress bars
- Account split rows with progress bars
- Spending by weekday heatmap
- Behavioral insights KPIs (daily burn, runway, in/out ratio, active days)

### 5.7 Accounts Management
- Vertical list of account cards with full details
- Three-dot menu per account → Edit / Delete
- Tap card → filtered transactions
- FAB → Add account
- Account form: name, holder, number, icon picker, color picker, currency picker

### 5.8 Categories Management
- Type tabs: Expense / Income / Transfer
- 2-column grid of category cards
- Long-press → Edit / Delete
- Category form: name, type, icon picker, color picker

### 5.9 Global Search (Pro)
- Search input with clear button
- 300ms debounce, min 2 chars
- SectionList: Transactions, Accounts, Categories
- Transaction rows tappable → edit
- Account rows → filtered transactions
- Category rows → filtered transactions
- Empty + no-results states

### 5.10 CSV Export (Pro)
- Date presets or custom range
- Account filter with checkmarks
- Type pills: All / Income / Expense / Transfer
- Live transaction count preview
- Export button → CSV generation
- Save to Files / Share options
- Warning if 0 results

### 5.11 Settings
- Profile hero card with monogram + name + plan status
- Plan section: Upgrade to Pro / Active status
- Preferences: Daily reminder toggle, reminder time, display name, theme, default currency
- Data: Categories, Export CSV
- Legal: Privacy policy + Terms (external URLs)
- Danger zone: Factory reset (deletes all data)

### 5.12 Premium Purchase Page
- Hero with primary gradient, headline, pricing
- Bento grid: 8 feature tiles in 2-column layout
- "Get lifetime access" CTA
- Restore purchase + Terms links
- IAP via store SKU

### 5.13 Developer Tools
- PIN-gated (`32159`)
- Premium override toggle
- Seed 12 months dummy data
- Notification debugger
- System info

---

## 6. Premium Gating Matrix

| Feature | Gate |
|---|---|
| Dashboard Insights | Pro only |
| Analytics 30D/90D/12M | Pro only |
| Period Flow chart | Pro only |
| Category Breakdown | Pro only |
| Account Split | Pro only |
| Weekday Heatmap | Pro only |
| Behavioral Insights | Pro only |
| Global Search | Pro only |
| CSV Export | Pro only |
| Everything else | Free |

**Pricing**: One-time lifetime purchase, SKU: `com.luno.lifetime` / `luno_lifetime`

---

## 7. Key UX Patterns

- **Page background**: Subtle gradient (`background → primary@6% → transparent`)
- **All dialogs**: `colors.surface` card, `radius('2xl')`, `borderWidth: 0.5` + subtle border
- **Bottom sheets**: Drag handle, overlay dim
- **FAB**: Positioned bottom-right, `radius('full')`, `colors.text` bg
- **Pills/chips**: `radius('md')`, surface bg, solid text bg when active
- **Empty states**: Icon + friendly message in a surface card
- **Loading states**: Surface card with subtle text
- **All `Text` widgets**: Explicit `fontFamily` from theme — no global defaults
- **Transfer rows**: Meta shows `Category · Account A → Account B`
- **Transfer transactions adjust both account balances**

---

## 8. Seed Data (Dev Only)

- 12 months of transactions per account
- Monthly salary, rent, random daily expenses
- Inter-account transfers if 2+ accounts
- Runs once via `seeder_state` table
- Accessible from Developer screen

---

## 9. App States to Handle

| State | All screens |
|---|---|
| Loading | Surface placeholder or shimmer |
| Empty | Icon + message card |
| Error | ErrorBoundary fallback or inline error |
| Free/Premium | `PremiumGuard` wrapper or route gate |

---

## 10. Build & Deploy

```bash
flutter build ipa --release          # iOS
flutter build appbundle --release    # Android
fastlane deliver / supply            # Submit to stores
```
