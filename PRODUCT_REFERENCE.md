# Fintraq — Product, UX & Data Reference

> Complete reference for designers, product managers, QA engineers, and contributors.
> No technology stack details. Focus: user flows, UI anatomy, data model, feature behaviour.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Personas & Goals](#2-user-personas--goals)
3. [Onboarding Flow](#3-onboarding-flow)
4. [Navigation Architecture](#4-navigation-architecture)
5. [Screen Reference (Atomic UI + Flows)](#5-screen-reference)
6. [Component Library](#6-component-library)
7. [Data Architecture](#7-data-architecture)
8. [Feature Dependency Map](#8-feature-dependency-map)
9. [Freemium Model](#9-freemium-model)
10. [Global Application States](#10-global-application-states)

---

## 1. Product Overview

Fintraq is a personal finance tracker. Users log income, expenses, and transfers across multiple accounts and currencies. Analytics and insights surface spending patterns and financial health. All data lives on-device; no account or internet connection required.

**Tier split**

| Tier | What's included |
|------|----------------|
| Free | Transaction tracking, accounts, categories, up to 10 persons, basic dashboard |
| Pro (lifetime) | Full analytics, global search, CSV export, unlimited persons, behavioural insights |

**Design language**

- Card-based, modular layout ("Bento" grid).
- Generous rounding, soft shadows, breathing room between elements.
- Accent colors on icon avatars and status indicators.
- Sentence-case labels throughout. No all-caps.
- Premium features are never broken or empty — locked content is replaced by an elegant upsell overlay.

---

## 2. User Personas & Goals

### Persona A — The Tracker
Logs purchases immediately after they happen. Values speed above everything.

**Goals**
- Add a transaction in under 10 seconds.
- Know current account balance at a glance.
- See which category is eating the most money this month.

**Primary screens:** Dashboard, Transaction Form, Accounts.

---

### Persona B — The Analyser
Reviews finances weekly. Wants charts, ratios, and predictions.

**Goals**
- Identify spending patterns by weekday, category, and person.
- Know how many days of runway remain at current burn rate.
- Export raw data for custom spreadsheet analysis.

**Primary screens:** Analytics, Export CSV, Search.

---

### Persona C — The Multi-Account Manager
Holds several bank accounts across currencies.

**Goals**
- Track balances per account in their respective currencies.
- Record transfers between accounts without double-counting.
- See total net worth per currency on one screen.

**Primary screens:** Dashboard (currency switcher), Accounts, Transaction Form (Transfer type).

---

## 3. Onboarding Flow

Entry: First launch only. Skipped on all subsequent launches.

```
┌─────────────────────────────────────────────┐
│  Step 1 — Welcome                           │
│  • Hero illustration + greeting copy        │
│  • CTA: "Get started"                       │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Step 2 — Profile                           │
│  • Input: Display name                      │
│    (required · 1–30 characters)             │
│  • CTA: "Next"                              │
└──────────────────┬──────────────────────────┘
                   │
┌──────────────────▼──────────────────────────┐
│  Step 3 — Default Currency                  │
│  • Currency picker                          │
│    (auto-detects device locale; user can    │
│     override)                               │
│  • CTA: "Finish setup"                      │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────▼──────────┐
        │  Post-completion     │
        │  • Seed 31 default   │
        │    categories        │
        │  • Save profile      │
        └──────────┬──────────┘
                   │
        ┌──────────▼──────────────────────┐
        │  Dialog: Enable daily reminders? │
        │  ├─ "Yes" → request permission   │
        │  │          schedule 20:00 daily │
        │  │          → Dashboard          │
        │  └─ "Skip" → Dashboard           │
        └─────────────────────────────────┘
```

**Default categories seeded at completion**

| Type | Categories |
|------|-----------|
| Income | Salary, Freelance, Sales, Dividends, Interests, Gifts, Refunds, Other Income |
| Expense | Rent, Mortgage, Electricity, Water, Internet, Phone, Gas, Transport, Food, Shopping, Entertainment, Healthcare, Education, Insurance, Savings, Charity, Subscriptions, Other Expense |
| Transfer | Transfer |

Once completed, the onboarding gate is permanently bypassed. App always opens to Dashboard thereafter.

---

## 4. Navigation Architecture

### Screen Map

```
App
├── Onboarding  [first-launch only]
│   └── Welcome → Profile → Currency
│
└── Main App
    │
    ├── Tab Bar (always visible)
    │   ├── Home (Dashboard)
    │   ├── Accounts
    │   ├── Persons
    │   ├── Analytics
    │   └── Settings
    │
    ├── Stack Screens (push over tabs)
    │   ├── Account Form     (create / edit)
    │   ├── Category Manager
    │   ├── Category Form    (create / edit)
    │   ├── Person Form      (create / edit)
    │   └── Person Detail
    │
    ├── Overlay Screens (full-screen, separate stack)
    │   ├── Transaction List
    │   ├── Transaction Form (create / edit)
    │   ├── Search           [Pro gate]
    │   ├── Export CSV       [Pro gate]
    │   └── Premium / Paywall
    │
    └── Developer Screen    [easter egg: 10-tap Settings footer]
```

### Tab Bar

| Tab | Icon style | Label |
|-----|-----------|-------|
| 1 | Home outline | Home |
| 2 | Building/domain | Accounts |
| 3 | Group of people | Persons |
| 4 | Bar chart | Analytics |
| 5 | Gear/cog | Settings |

Active tab: pill-shaped highlight behind icon (brand color, low opacity).

### Navigation Patterns

| Pattern | When used |
|---------|-----------|
| Tab switch | Between the 5 root destinations |
| Stack push | Form screens, detail views, feature managers |
| Bottom sheet | Pickers (currency, icon, color, options menus), confirmation flows |
| Floating dialog | Alerts, confirmation prompts, single-field text edits |
| Deep-link with filter | Tapping an account card opens Transaction List pre-filtered to that account |

---

## 5. Screen Reference

---

### 5.1 Dashboard

**Purpose:** Central financial hub. Snapshot of wealth, recent activity, and top-level insights.

**Entry:** Home tab (default on launch).

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  Header                                  │
│  [Greeting text]         [Search icon]  │ ← Search: Pro only
├─────────────────────────────────────────┤
│  Currency Tab Row                        │
│  [USD]  [EUR]  [GBP]  …                 │ ← One pill per currency in use
├─────────────────────────────────────────┤
│  Hero Balance Card                       │
│  Net balance (large)                    │
│  [↑ Income total]   [↓ Expense total]   │
├─────────────────────────────────────────┤
│  Accounts Carousel  (horizontal scroll) │
│  [Card] [Card] [Card]  →                │
│                          [Manage link]  │
├─────────────────────────────────────────┤
│  Insights Section  ██████ [Pro lock]    │
├─────────────────────────────────────────┤
│  Top Expenses                            │
│  [Category] [Category] [Category]       │
│  [Category] [Category]                  │
├─────────────────────────────────────────┤
│  Top Persons (if any persons exist)     │
│  [Person row] [Person row]              │
├─────────────────────────────────────────┤
│  Recent Transactions (last 6)           │
│  [Tx row] [Tx row] [Tx row]  [See all] │
├─────────────────────────────────────────┤
│                               [+ FAB]   │
└─────────────────────────────────────────┘
```

---

#### Atomic Elements

**Header**
- Left: "Good morning, {name}" (greeting changes by time of day).
- Right: Search icon button.

**Currency Tab Row**
- Horizontal pill row. One pill per currency that has at least one account.
- Tapping a pill recalculates all figures on screen to that currency.
- Hidden if user has only one currency.

**Hero Balance Card**
- Large balance figure (net income minus expense for selected currency and selected period).
- Two smaller figures below: total income (green) and total expense (red).
- Card background: surface color with subtle shadow.

**Accounts Carousel**
- Horizontal scroll. Each account card:
  - Icon avatar (circle, account color).
  - Account name.
  - Balance (with currency symbol).
- "Manage" link (top right of section) → Accounts screen.
- Tapping a card → Transaction List filtered to that account.
- "+" card at end → New Account form.

**Insights Section** *(Pro only)*
- Blurred overlay with PremiumGuard on free tier.
- When unlocked: savings rate, trend prediction, contextual KPIs.

**Top Expenses**
- 2-column grid, up to 5 category cards.
- Each card: category icon avatar, category name, spend amount, % of total.

**Top Persons**
- Visible only if at least one transaction has a linked person.
- Ranked by total spend. Tap row → Person Detail.

**Recent Transactions**
- Last 6 transactions, most recent first.
- "See all" link → Transaction List.
- Tap any row → Transaction edit form.

**FAB** (Floating Action Button)
- Always visible, bottom-right corner.
- Opens Transaction create form.

---

#### States

| State | Behaviour |
|-------|-----------|
| Loading | Skeleton placeholders on balance card, carousel, transactions |
| No accounts | Hero card shows 0; carousel empty with "Add your first account" card |
| No transactions | Recent transactions section hidden |
| First-time user | Walkthrough tooltip overlay: highlights hero → accounts → FAB in sequence |
| Post-walkthrough (within 3 days) | Upsell bottom sheet shown once; dismissible |

---

#### User Flows from Dashboard

| Action | Destination |
|--------|------------|
| Tap Search (Pro) | Global Search screen |
| Tap Search (free) | Premium paywall |
| Tap FAB | Transaction create form |
| Tap account card | Transaction List (filtered: this account) |
| Tap "Manage" | Accounts screen |
| Tap transaction row | Transaction edit form |
| Tap "See all" (transactions) | Transaction List (no filter) |
| Tap "See all" (persons) | Persons screen |
| Tap person row | Person Detail |
| Tap Insights lock overlay | Premium paywall |

---

### 5.2 Accounts

**Purpose:** View and manage all bank/wallet accounts.

**Entry:** Accounts tab.

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  Header: "Accounts"                     │
├─────────────────────────────────────────┤
│  Account Card                           │
│  [Icon]  Name              [⋮ options] │
│          Account number (masked)        │
│          [Currency badge]               │
│          Balance: {amount}              │
│          [↑ Total in]  [↓ Total out]    │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│  (repeated per account)                 │
├─────────────────────────────────────────┤
│                               [+ FAB]   │
└─────────────────────────────────────────┘
```

---

#### Atomic Elements

**Account Card**
- Full-width card with:
  - Left: circular icon avatar (account color + icon).
  - Account name (bold), account number (muted, partial digits).
  - Currency badge pill.
  - Balance labeled "Available."
  - Two-stat row: "Total in" (all income) + "Total out" (all expenses) in that account.
  - Top-right: options menu icon (⋮).

**Options Menu (bottom sheet)**
- Edit → Account edit form.
- Delete → Confirmation dialog.

**Delete Confirmation Dialog**
- Warns: "All transactions in this account will also be permanently deleted."
- Destructive style (red confirm button).

---

#### States

| State | Behaviour |
|-------|-----------|
| Loading | Skeleton cards |
| Empty | Illustration + "No accounts yet" + hint to tap FAB |

---

#### User Flows

| Action | Destination |
|--------|------------|
| Tap account card | Transaction List (filtered: this account) |
| Tap ⋮ → Edit | Account edit form |
| Tap ⋮ → Delete | Confirmation dialog → delete (cascades transactions) |
| Tap FAB | Account create form |

---

### 5.3 Account Form

**Purpose:** Create a new account or edit an existing one.

**Entry:** FAB on Accounts screen (create) · Edit from options menu (edit).

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  [← Back]   "New Account" / "Edit"     │
├─────────────────────────────────────────┤
│  Account Name *                         │
│  [___________________________]          │
│  Holder Name                            │
│  [___________________________]          │
│  Account Number                         │
│  [___________________________ ]         │
│  (hint: IBAN or reference number)       │
│                                         │
│  Opening Balance    (create mode only)  │
│  [________]  Currency: [USD ▾]          │
├─────────────────────────────────────────┤
│  Appearance                             │
│  [Icon card]   [Color card]             │
├─────────────────────────────────────────┤
│  [        Save account       ]          │
└─────────────────────────────────────────┘
```

---

#### Fields & Validation

| Field | Required | Rule | Notes |
|-------|----------|------|-------|
| Account name | Yes | 2–50 characters | Shows autocomplete suggestions as user types |
| Holder name | No | Max 50 characters | — |
| Account number | No | Max 100 characters | — |
| Opening balance | Create only | Positive number or empty | Hidden on edit; sets initial balance |
| Currency | Yes | Valid currency code | Defaults to user's default currency |
| Icon | No | — | Opens icon picker sheet |
| Color | No | — | Opens color picker sheet |

**Save button:** Disabled until name is valid. Label: "Save account" (create) / "Update account" (edit).

---

#### User Flows

| Action | Behaviour |
|--------|-----------|
| Tap Currency | Opens currency picker bottom sheet |
| Tap Icon card | Opens icon picker bottom sheet |
| Tap Color card | Opens color picker bottom sheet |
| Tap Save | Saves → pops back to previous screen |
| Tap Back | Discards changes → pops stack |

---

### 5.4 Persons

**Purpose:** Browse and manage contacts linked to transactions.

**Entry:** Persons tab.

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  Header: "Persons"                      │
├─────────────────────────────────────────┤
│  [🔍 Search by name, email, phone…]    │
├─────────────────────────────────────────┤
│  [Free limit banner: "8/10 used — ↑"]  │ ← Free tier only
├─────────────────────────────────────────┤
│  [Avatar]  Name                         │
│            Designation · Company        │
├─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┤
│  (repeated per person)                  │
├─────────────────────────────────────────┤
│                               [+ FAB]   │ ← Lock icon if at limit (free)
└─────────────────────────────────────────┘
```

---

#### Atomic Elements

**Search bar:** Live filter across name, email, phone, company, designation.

**Limit banner (free tier):** Shows "X/10 persons — Upgrade for unlimited." Hidden on Pro.

**Person row:** Circular avatar (initials in person's color) + name + secondary text (designation/company or phone).

**FAB:** Shows lock icon when free user is at limit (10 persons). Tapping → Premium paywall.

---

#### States

| State | Behaviour |
|-------|-----------|
| Loading | Skeleton rows |
| Empty | "No persons yet" + instructional copy |
| Search no results | "No results for '{query}'" |
| At limit (free) | Banner shown; FAB shows lock |

---

#### User Flows

| Action | Destination |
|--------|------------|
| Tap person row | Person Detail |
| Tap FAB (under limit or Pro) | Person create form |
| Tap FAB (at limit, free) | Premium paywall |
| Type in search | Filters list live |
| Tap × on search | Clears search, restores full list |

---

### 5.5 Person Form

**Purpose:** Create or edit a contact record.

**Entry:** FAB on Persons screen (create) · Edit action from Person Detail (edit).

---

#### Fields & Validation

| Field | Required | Rule |
|-------|----------|------|
| Name | Yes | 2–50 characters |
| Email | No | — |
| Phone | No | — |
| Designation | No | — |
| Company | No | — |
| Color | No | Color picker |

**Avatar preview** updates live as name and color change (shows initials in selected color).

**Save button** disabled until name is valid.

**At-limit guard (free tier):** Alert blocks save if user already has 10 persons without Pro.

---

### 5.6 Person Detail

**Purpose:** Review a contact's relationship summary and all linked transactions.

**Entry:** Tap a person row from Persons screen or Dashboard "Top Persons" section.

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  [← Back]  {Person Name}   [Edit][Del] │
├─────────────────────────────────────────┤
│  Hero Card                              │
│  [Large avatar]                         │
│  Name (large)                           │
│  Designation · Company                  │
│  [email chip]  [phone chip]             │
├─────────────────────────────────────────┤
│  Currency pills                         │
│  [USD] [EUR] …                          │
├─────────────────────────────────────────┤
│  Stats Row                              │
│  Spent with: {amount}   Received: {amt} │
├─────────────────────────────────────────┤
│  Transactions (for selected currency)   │
│  [Tx row]                               │
│  [Tx row]                               │
│  …                                      │
└─────────────────────────────────────────┘
```

---

#### User Flows

| Action | Destination |
|--------|------------|
| Tap Edit | Person edit form |
| Tap Delete | Confirmation dialog → delete person (transactions kept; person link cleared) |
| Tap currency pill | Recalculate stats and filter transactions to that currency |
| Tap transaction row | Transaction edit form |

**Empty state:** "No transactions in {currency}" when selected currency has no linked transactions.

---

### 5.7 Analytics

**Purpose:** Deep financial insights through visualisations and behavioural analysis.

**Entry:** Analytics tab.

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  Header: "Analytics"                    │
├─────────────────────────────────────────┤
│  Currency pills (horizontal scroll)     │
│  [USD]  [EUR]  …                        │
├─────────────────────────────────────────┤
│  Date range pills                       │
│  [7D]  [30D 🔒]  [90D 🔒]  [12M 🔒]  │
│  {Start date} — {End date}              │
├─────────────────────────────────────────┤
│  Metrics Grid (2×2)                     │
│  [Net position]    [Savings rate]       │
│  [Total income]    [Total expense]      │
├─────────────────────────────────────────┤
│  Spending Trend (area chart)            │
│  Income vs. expense over time           │
├─────────────────────────────────────────┤
│  Period Flow (bar chart)  ████ [🔒]    │
├─────────────────────────────────────────┤
│  Category Breakdown       ████ [🔒]    │
├─────────────────────────────────────────┤
│  Person Breakdown         ████ [🔒]    │
├─────────────────────────────────────────┤
│  Account Split            ████ [🔒]    │
├─────────────────────────────────────────┤
│  Spending by Weekday      ████ [🔒]    │
├─────────────────────────────────────────┤
│  Behavioural Insights     ████ [🔒]    │
└─────────────────────────────────────────┘
```

---

#### Section Details

| Section | Visualisation | Free access | Pro access |
|---------|--------------|-------------|------------|
| Metrics grid | 4 KPI cards: net position, savings rate, income, expense | 7D only | All ranges |
| Spending trend | Area chart: income vs. expense over time | 7D | All ranges |
| Period flow | Bar chart: income/expense by period | Locked | ✓ |
| Category breakdown | Stacked bar + grid cards (icon, name, amount, %) | Locked | ✓ |
| Person breakdown | Same layout as category | Locked | ✓ |
| Account split | Balance distribution pie | Locked | ✓ |
| Spending by weekday | Bar chart coloured low/mid/high | Locked | ✓ |
| Behavioural insights | KPI grid: daily burn, runway (days), in/out ratio, active days | Locked | ✓ |

**Lock behaviour:** Locked sections show blurred content with a PremiumGuard overlay. Tapping a locked range pill or a locked section navigates to Premium paywall.

---

#### User Flows

| Action | Behaviour |
|--------|-----------|
| Tap currency pill | Recalculate all visualisations for that currency |
| Tap 30D / 90D / 12M (free) | Navigate to Premium paywall |
| Tap locked section overlay | Navigate to Premium paywall |

---

### 5.8 Transaction List

**Purpose:** Paginated, filterable history of all transactions.

**Entry:** "See all" from Dashboard · Tap account card (pre-filtered) · FAB from any screen.

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  Header: "Transactions"    [Filter ⚙]  │
├─────────────────────────────────────────┤
│  KPI Bar (sticky)                       │
│  Net: {amt}  In: {amt}  Out: {amt}      │
├─────────────────────────────────────────┤
│  Section header: "Mon, 15 Jun 2025"     │
│  [Transaction row]  ← swipeable        │
│  [Transaction row]                      │
│                                         │
│  Section header: "Sun, 14 Jun 2025"     │
│  [Transaction row]                      │
│  …                                      │
├─────────────────────────────────────────┤
│  (Loading more…)  ← on scroll to bottom│
├─────────────────────────────────────────┤
│                               [+ FAB]   │
└─────────────────────────────────────────┘
```

---

#### Transaction Row (atomic)

```
[Category icon avatar]  {Category name}     {+/- Amount}
                        {Account name}      {Time}
                        {Note (if any)}
```

- Icon avatar: circle, category color + icon.
- Amount: green for income, red for expense, neutral for transfer.
- Swipe right: reveals "Edit" (blue) and "Delete" (red) actions.
- Full swipe: triggers delete confirmation.

---

#### Filter Bottom Sheet

| Filter | Type |
|--------|------|
| Transaction type | Multi-select: Income, Expense, Transfer |
| Date range | Start date + end date pickers |
| Accounts | Multi-select (all accounts listed) |
| Categories | Multi-select (all categories listed) |
| Sort by | Date (newest/oldest) or Amount (high/low) |

Applied filters shown as dismissible chips below the search bar.

---

#### States

| State | Behaviour |
|-------|-----------|
| Loading | Skeleton rows for first page |
| Empty (no data) | "No transactions yet" + hint to tap FAB |
| Empty (filter returns nothing) | "No transactions match your filters" + clear filters CTA |
| Loading more (scroll) | Spinner at bottom of list |
| All loaded | No spinner; list ends |

---

#### User Flows

| Action | Destination |
|--------|------------|
| Tap filter icon | Filter bottom sheet |
| Tap transaction row | Transaction edit form |
| Swipe row → Edit | Transaction edit form |
| Swipe row → Delete | Confirmation dialog → delete |
| Tap FAB | Transaction create form |

---

### 5.9 Transaction Form

**Purpose:** Log a new transaction or correct an existing one.

**Entry:** FAB (create) · Edit from Transaction List or swipe action (edit).

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  [← Back]  "New Transaction" / "Edit"  │
├─────────────────────────────────────────┤
│  Type Selector                          │
│  [Expense]  [Income]  [Transfer]        │
├─────────────────────────────────────────┤
│  From Account *   [Picker ▾]            │
│  To Account *     [Picker ▾]            │ ← Transfer only
│  Category *       [Picker ▾]            │ ← Expense/Income only
│  Person           [Picker ▾]            │ ← Optional (all types)
├─────────────────────────────────────────┤
│  Amount *                               │
│  [_______]  {currency from account}     │
├─────────────────────────────────────────┤
│  Date & Time *                          │
│  [date picker]  [time picker]           │
├─────────────────────────────────────────┤
│  Note                                   │
│  [________________________________]     │
├─────────────────────────────────────────┤
│  [          Save transaction          ] │
└─────────────────────────────────────────┘
```

---

#### Fields & Validation

| Field | Required | Visible when | Rule |
|-------|----------|-------------|------|
| Type | Yes | Always | Expense / Income / Transfer |
| From account | Yes | Always | Must select one |
| To account | Yes | Transfer only | Must differ from From account |
| Category | Yes | Expense, Income | Filtered to match selected type |
| Person | No | Always | Optional link to a contact |
| Amount | Yes | Always | Positive number |
| Date & time | Yes | Always | User-selected; defaults to now |
| Note | No | Always | Free text |

**Type change behaviour:** Switching type clears Category and To Account selections.

**Currency display:** Shown from the selected From Account — not a user-editable field.

**Save button** disabled until all required fields are valid.

---

#### User Flows

| Action | Behaviour |
|--------|-----------|
| Tap type pill | Switches type; clears incompatible fields |
| Tap From/To Account | Opens account picker sheet |
| Tap Category | Opens category picker sheet (filtered by type) |
| Tap Person | Opens person picker sheet |
| Tap Date / Time | Opens date/time picker |
| Tap Save | Saves → pops back |
| Tap Back | Discards → pops back (no confirmation) |

---

### 5.10 Categories

**Purpose:** Manage the taxonomy used to classify transactions.

**Entry:** Settings → Categories.

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  Header: "Categories"                   │
├─────────────────────────────────────────┤
│  Type tabs: [Expense] [Income] [Transfer]│
├─────────────────────────────────────────┤
│  [Icon]  Category Name                  │
│  [Icon]  Category Name                  │
│  …                                      │
├─────────────────────────────────────────┤
│                               [+ FAB]   │
└─────────────────────────────────────────┘
```

---

#### User Flows

| Action | Destination |
|--------|------------|
| Tap type tab | Filter grid to that type |
| Long-press category | Options sheet: Edit, Delete |
| Edit | Category form (edit mode) |
| Delete | Confirmation → delete (linked transactions lose category reference) |
| Tap FAB | Category create form |

**Delete warning:** "Transactions using this category will lose their category label but will not be deleted."

---

### 5.11 Category Form

**Purpose:** Create or edit a category.

**Entry:** FAB on Categories screen · Edit from options menu.

---

#### Fields & Validation

| Field | Required | Rule |
|-------|----------|------|
| Type | Yes | Expense / Income / Transfer selector |
| Name | Yes | 2–50 characters |
| Icon | No | Icon picker |
| Color | No | Color picker |

---

### 5.12 Settings

**Purpose:** Preferences, security, data management, plan status.

**Entry:** Settings tab.

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  Header: "Settings"                     │
├─────────────────────────────────────────┤
│  [Monogram avatar]                      │
│  {Display Name}                         │
│  {Plan: Free / Pro}   v{app version}    │
├─────────────────────────────────────────┤
│  ── Plan ──                             │
│  Upgrade to Pro / Pro Active            │
├─────────────────────────────────────────┤
│  ── Preferences ──                      │
│  Daily reminder            [toggle]     │
│  Reminder time             [20:00]      │ ← only if reminder enabled
│  Default currency          [USD]        │
│  Display name              [{name}]     │
│  Theme                     [System ▾]   │
├─────────────────────────────────────────┤
│  ── Security ──                         │
│  App lock                  [toggle]     │
│  Change PIN                             │ ← only if PIN mode active
├─────────────────────────────────────────┤
│  ── Data ──                             │
│  Categories                [→]          │
│  Export CSV                [→]          │ ← Pro only
├─────────────────────────────────────────┤
│  ── Legal ──                            │
│  Privacy policy            [→]          │
│  Terms of service          [→]          │
├─────────────────────────────────────────┤
│  ── Danger Zone ──                      │
│  Factory reset             [button]     │
├─────────────────────────────────────────┤
│  {App name}  ·  {version}               │ ← 10-tap → Developer screen
└─────────────────────────────────────────┘
```

---

#### Settings Detail

| Setting | Control | Behaviour |
|---------|---------|-----------|
| Daily reminder | Toggle | Requests notification permission on enable; cancels on disable |
| Reminder time | Time picker | Shown only when reminder is enabled |
| Default currency | Currency picker sheet | Applies to new transactions and dashboard default view |
| Display name | Text input dialog (max 30 chars) | Updates header greeting |
| Theme | Options sheet | Light / Dark / Follow system |
| App lock | Toggle | Enabling prompts biometric setup or PIN setup; disabling requires auth |
| Change PIN | Button | Opens PIN setup modal; only visible when PIN lock active |
| Categories | Row | Navigates to Categories manager |
| Export CSV | Row | Navigates to Export screen (Pro) or Paywall (free) |
| Privacy / Terms | Row | Opens external page |
| Factory reset | Button | Confirmation dialog → wipes all data + preferences permanently |

---

#### Factory Reset Confirmation

> **Warning:** This will permanently delete all your accounts, transactions, categories, persons, and settings. This action cannot be undone.

Confirm button: destructive style. Two-step: type "RESET" or tap twice before proceeding.

---

### 5.13 Premium / Paywall

**Purpose (free user):** Convert to Pro lifetime purchase.
**Purpose (Pro user):** View active plan status; restore entitlement if needed.

---

#### Free User Layout

```
┌─────────────────────────────────────────┐
│  [← Back]                               │
├─────────────────────────────────────────┤
│  [Hero icon]                            │
│  "Fintraq Pro"  (headline)              │
│  Short description                      │
├─────────────────────────────────────────┤
│  Feature list                           │
│  [✦ icon]  Full analytics & insights   │
│  [✦ icon]  Global search               │
│  [✦ icon]  CSV export                  │
│  [✦ icon]  Unlimited persons            │
│  …                                      │
├─────────────────────────────────────────┤
│  Price: {amount}  ~~{original}~~        │
│  [     Purchase Pro — lifetime     ]    │
│  Restore previous purchase              │
│  (Fine print: terms, refund policy)     │
└─────────────────────────────────────────┘
```

---

#### Pro User Layout

```
┌─────────────────────────────────────────┐
│  [← Back]                               │
├─────────────────────────────────────────┤
│  [✓ icon]  "Pro Active"                 │
│  Lifetime license  ·  Active            │
│  Linked to {App Store / Play Store}     │
├─────────────────────────────────────────┤
│  Feature list (all with ✓ green)        │
├─────────────────────────────────────────┤
│  [   Restore purchase   ]               │
└─────────────────────────────────────────┘
```

---

#### User Flows

| Action | Behaviour |
|--------|-----------|
| Tap "Purchase Pro" | Initiates store purchase flow; shows result alert on success/failure |
| Tap "Restore" | Re-validates entitlement with store; shows alert with result |
| Tap Back | Returns to originating screen |

---

### 5.14 Global Search *(Pro only)*

**Purpose:** Instantly locate any transaction, account, category, or person.

**Free user:** Full-screen gate showing feature description + "Upgrade to Pro" CTA.

---

#### Pro User Layout

```
┌─────────────────────────────────────────┐
│  [← Back]  [🔍 Search…]                │
├─────────────────────────────────────────┤
│  Transactions                           │
│  [Tx row]   [Tx row]                    │
├─────────────────────────────────────────┤
│  Accounts                               │
│  [Account row]                          │
├─────────────────────────────────────────┤
│  Categories                             │
│  [Category row]                         │
├─────────────────────────────────────────┤
│  Persons                                │
│  [Person row]                           │
└─────────────────────────────────────────┘
```

**Debounce:** Results update 300ms after user stops typing. Minimum 2 characters to trigger search.

| State | Behaviour |
|-------|-----------|
| < 2 characters typed | No results shown |
| Searching | Subtle loading indicator in search bar |
| No results | "No results for '{query}'" message |

**Deep-link on tap:**
- Transaction result → Transaction edit form.
- Account result → Transaction List filtered to that account.
- Category/Person result → Transaction List filtered to that entity.

---

### 5.15 Export CSV *(Pro only)*

**Purpose:** Export filtered transactions to a spreadsheet-compatible file.

**Entry:** Settings → Export CSV (Pro) · Settings → Export CSV → Paywall (free).

---

#### UI Anatomy

```
┌─────────────────────────────────────────┐
│  [← Back]  "Export CSV"                │
├─────────────────────────────────────────┤
│  Date Range                             │
│  [This Month ▾]                         │
│  (or custom: [Start date] [End date])   │
├─────────────────────────────────────────┤
│  Accounts       [All ▾ / multi-select] │
│  Categories     [All ▾ / multi-select] │
│  Types          [✓ Income] [✓ Expense] [✓ Transfer] │
├─────────────────────────────────────────┤
│  [         Export {n} transactions    ] │
└─────────────────────────────────────────┘
```

**Date range presets:** This Month, Last 3 Months, This Year, All Time, Custom.

**Export behaviour by platform:**
- Android: Native folder picker opens → user selects destination folder → file saved.
- iOS: Share sheet opens → user chooses "Save to Files," AirDrop, or other destination.

**Output columns:** Date, Time, Type, Amount, Currency, Account, Category, Person, Note.

---

## 6. Component Library

### Layout & Container

| Component | Purpose | Key Variants |
|-----------|---------|-------------|
| Card | Elevated surface container | — |
| Page Background | Full-screen background gradient | Adapts to light/dark theme |
| Section Header | Labelled row divider with optional right-side link | `noPadding` |

### Actions

| Component | Purpose | Key Variants |
|-----------|---------|-------------|
| Button | All tappable call-to-action surfaces | primary · secondary · outline · danger · ghost · loading state |
| BentoPressable | Scale-animated pressable (for cards and custom elements) | `scaleOnPress` · `disabled` |
| FAB | Floating action button (circular, always visible) | — |

### Data Display

| Component | Purpose | Notes |
|-----------|---------|-------|
| MoneyText | Formatted currency value with sign | Color-coded by type: green (income), red (expense), neutral (transfer) |
| KPI Card | Single metric: label + value | Used in grids (Dashboard, Analytics, Transaction List KPI bar) |
| Transaction Row | Single transaction in a list | Shows icon avatar, category, account, amount, time, optional note |
| Icon Avatar | Circular badge with icon inside | Variants: subtle (tinted bg) · solid (filled bg) · size-configurable |

### Inputs

| Component | Purpose | Key Variants |
|-----------|---------|-------------|
| Input | Text entry field | default · minimal · filled; sizes: sm / md / lg |
| Type Selector | Pill group for mutually exclusive choices (e.g., Expense/Income/Transfer) | — |
| Toggle (Switch) | Boolean setting control | — |
| Date/Time Picker | Date and time selection | Separate date and time controls |

### Pickers (Bottom Sheet variants)

| Component | Purpose |
|-----------|---------|
| Currency Picker | Searchable list of currencies |
| Icon Picker | Grid of icons grouped by category; accent color preview |
| Color Picker | Palette grid of swatches |
| Account Picker | List of accounts (used in Transaction Form) |
| Category Picker | List of categories filtered by type |
| Person Picker | List of persons |
| Options Menu | Contextual action list (Edit / Delete / etc.) |

### Feedback & Overlay

| Component | Purpose | Key Variants |
|-----------|---------|-------------|
| Confirm Dialog | Two-button confirmation modal | destructive (red) · normal |
| Alert Dialog | Informational modal with icon | info · success · error · warning |
| Text Input Dialog | Inline single-field edit in a modal | `maxLength` · `placeholder` |
| Bottom Sheet | Generic bottom sheet wrapper | Configurable snap points |
| Premium Guard | Locks content for free users; shows upsell overlay | small · medium · large (determines overlay size and copy) |
| Error Boundary | Catches catastrophic UI errors; shows "Try again" fallback | — |

### Navigation

| Component | Purpose |
|-----------|---------|
| Header | Screen app bar with back button and optional right action |
| Tab Bar | 5-tab bottom navigation; active tab has pill highlight |

---

## 7. Data Architecture

### Core Entities

```
accounts ──────────────────────┐
     │                          │ (to_account_id)
     │                          ▼
     └──────── payments ──────────────── categories
                    │
                    └──────── persons
```

---

### Entity: Account

An account represents a financial container — a bank account, wallet, or cash envelope.

| Attribute | Description | Rules |
|-----------|-------------|-------|
| Name | Display name | 2–50 characters, required |
| Holder name | Name of account owner | Optional |
| Account number | IBAN, reference, or masked number | Optional |
| Icon | Visual identifier | Chosen from icon library |
| Color | Avatar color | Chosen from palette |
| Currency | ISO currency code | Required; defaults to user's default currency |
| Balance | Running current balance | Updated automatically on transaction mutations |
| Total income | Sum of all credit transactions | Updated automatically |
| Total expense | Sum of all debit transactions | Updated automatically |
| Default | Whether this is the primary account | Boolean; one account may be marked default |

**Lifecycle:** Created by user. Balance is a computed running total (not user-editable after initial creation). Deleting an account permanently removes all linked transactions.

---

### Entity: Category

A category classifies a transaction by purpose (e.g., Rent, Salary, Transfer).

| Attribute | Description | Rules |
|-----------|-------------|-------|
| Name | Display label | 2–50 characters, required |
| Type | Income / Expense / Transfer | Required; determines which transactions can use it |
| Icon | Visual identifier | — |
| Color | Avatar color | — |

**Lifecycle:** 31 records seeded at onboarding. User may add, edit, or delete. Deleting a category clears the category reference on linked transactions — those transactions remain, unclassified.

**Type filtering:** Category picker in Transaction Form only shows categories matching the selected transaction type.

---

### Entity: Transaction (Payment)

A transaction is a single financial event.

| Attribute | Description | Rules |
|-----------|-------------|-------|
| Type | Income (CR) / Expense (DR) / Transfer (TR) | Required |
| From account | Account debited or credited | Required |
| To account | Destination account (transfers only) | Required when type = Transfer |
| Category | Classification | Required for Income and Expense; not applicable for Transfer |
| Person | Linked contact | Optional |
| Amount | Value of the event | Required; positive number |
| Currency | Inherited from the From account | Not user-editable on this field |
| Date & time | When the event occurred | Required; user-selected; defaults to now |
| Note | Free-text memo | Optional |

**Type semantics:**
- **Income (CR):** Money received into the account. Balance increases.
- **Expense (DR):** Money spent from the account. Balance decreases.
- **Transfer (TR):** Money moved from one account to another. No net change in total wealth; From account decreases, To account increases.

**Lifecycle:** Created and edited by user. Deleting an account cascades and deletes all its transactions. Deleting a person or category clears the reference on linked transactions (transaction itself is retained).

---

### Entity: Person

A person represents a contact linked to transactions (e.g., a landlord, employer, or friend).

| Attribute | Description | Rules |
|-----------|-------------|-------|
| Name | Contact name | 2–50 characters, required; indexed for search |
| Email | Contact email | Optional |
| Phone | Contact phone | Optional |
| Designation | Job title | Optional |
| Company | Company name | Optional |
| Color | Avatar color | Chosen from palette |

**Lifecycle:** Created by user. Deleting a person clears the person reference on linked transactions — those transactions remain, unlinked.

**Limit:** Free tier caps at 10 persons. Pro is unlimited.

---

### Cascade & Referential Integrity

| Source action | Effect on linked data |
|--------------|----------------------|
| Delete account | All transactions belonging to that account are permanently deleted |
| Delete category | Transactions lose their category reference; they are not deleted |
| Delete person | Transactions lose their person reference; they are not deleted |
| Delete to-account (transfer) | Transfer transactions lose their to-account reference |
| Factory reset | All accounts, transactions, categories, persons, and user preferences permanently erased |

---

### Entity Relationship Diagram

```
┌───────────────┐        ┌─────────────────────────┐
│   accounts    │        │       payments           │
│───────────────│        │─────────────────────────│
│ id            │◄───────│ account_id          (FK) │
│ name          │        │ to_account_id       (FK) │──┐
│ holder_name   │◄───────┘                          │  │ (same table)
│ account_number│        │ category_id         (FK) │──┼──► categories
│ icon          │        │ person_id           (FK) │──┼──► persons
│ color         │        │ type (CR/DR/TR)          │  │
│ currency      │        │ amount                   │  │
│ balance       │        │ datetime                 │  │
│ income        │        │ note                     │  │
│ expense       │        └─────────────────────────-┘  │
│ is_default    │                                       │
└───────────────┘◄──────────────────────────────────────┘
        │
        │ (referenced by to_account_id)

┌───────────────┐
│  categories   │
│───────────────│
│ id            │
│ name          │
│ icon          │
│ color         │
│ type (CR/DR/TR│
└───────────────┘

┌───────────────┐
│   persons     │
│───────────────│
│ id            │
│ name          │
│ email         │
│ phone         │
│ designation   │
│ company       │
│ color         │
└───────────────┘
```

---

### Data Ownership

| Entity | Who creates | Who edits | Who deletes | Cascades to |
|--------|------------|-----------|-------------|-------------|
| Account | User | User | User | Transactions (hard delete) |
| Category | System (seed) + User | User | User | Transactions (clear reference) |
| Transaction | User | User | User (or cascade) | — |
| Person | User | User | User | Transactions (clear reference) |
| User Profile | System (onboarding) | User (Settings) | Factory reset | — |
| Premium state | Store (purchase) | Store (restore) | Factory reset | — |

---

### Offline Behaviour & Caching

- **All data is on-device.** No internet connection required for any core feature.
- **Real-time within session:** Mutations (create/edit/delete) immediately invalidate the relevant cached queries; UI updates without manual refresh.
- **Pagination:** Transaction List loads 20 items per page. Subsequent pages load on scroll.
- **Analytics:** All aggregations computed client-side against local data.
- **Premium entitlement:** Persisted locally after first store validation. Re-validated on each app launch and on Premium screen open.
- **User preferences:** Persisted on-device across app restarts. Cleared only on factory reset.
- **Backup/Restore:** User-initiated full data export to a single file (JSON format). Restore re-imports from that file with validation.

---

### Privacy Considerations

| Data category | Where it goes |
|---------------|--------------|
| Transactions, accounts, persons, categories | On-device only. Never transmitted. |
| User profile (name, currency, theme) | On-device only. |
| Crash reports | Anonymised stack trace sent to crash reporting service. No financial data included. |
| Analytics telemetry | Screen views and anonymised events (amounts are bucketed, not raw). No PII. |
| Backup files | Exported to user-chosen location. User is solely responsible for file security. |

---

## 8. Feature Dependency Map

```
Transaction (core atomic action)
  ├─ Requires:  Account (at least 1)
  ├─ Requires:  Category (for Income & Expense types)
  ├─ Optional:  Person link
  └─ Transfer:  Requires 2 accounts

Dashboard
  ├─ Depends:   Accounts, Transactions
  ├─ Locked:    Insights section (Pro)
  └─ Locked:    Search button (Pro)

Analytics
  ├─ Depends:   Transactions, Accounts, Categories, Persons
  ├─ Free:      7-day range, spending trend area chart
  └─ Locked:    All other ranges, all other chart sections (Pro)

Persons
  ├─ Links to:  Transactions (via person reference)
  └─ Free cap:  10 persons max

Person Detail
  └─ Depends:   Persons + Transactions (for stats and history)

Global Search
  ├─ Searches:  Transactions, Accounts, Categories, Persons
  └─ Locked:    Pro only

Export CSV
  ├─ Depends:   Transactions
  └─ Locked:    Pro only

Settings
  ├─ Manages:   Categories (navigates in-app)
  ├─ Triggers:  Export CSV
  └─ Danger:    Factory reset destroys all entities
```

---

## 9. Freemium Model

### Feature Access by Tier

| Feature | Free | Pro |
|---------|------|-----|
| Transactions | Unlimited | Unlimited |
| Accounts | Unlimited | Unlimited |
| Categories | Unlimited | Unlimited |
| Persons | Up to 10 | Unlimited |
| Dashboard — core metrics | ✓ | ✓ |
| Dashboard — insights section | ✗ | ✓ |
| Analytics — 7-day range | ✓ | ✓ |
| Analytics — 30D / 90D / 12M ranges | ✗ | ✓ |
| Analytics — all chart types | ✗ | ✓ |
| Analytics — behavioural insights | ✗ | ✓ |
| Global search | ✗ | ✓ |
| CSV export | ✗ | ✓ |

**Pro is a one-time lifetime purchase.** No subscription. No expiry.

---

### PremiumGuard Behaviour

**Rule:** Locked content is *never* shown partially or in a broken state.

| Scenario | What the user sees |
|----------|-------------------|
| Analytics chart (locked) | Blurred visual with PremiumGuard overlay card: feature name + "Upgrade" CTA |
| Analytics range pill (locked) | Pill shows 🔒 icon; tapping navigates to Paywall |
| Search (free user) | Full-screen gate: feature list + "Upgrade to Pro" CTA + "Not now" dismiss |
| Export CSV (free user) | Navigates to Paywall instead of Export screen |
| Persons FAB (at limit) | FAB shows 🔒 icon; tapping navigates to Paywall |
| Dashboard insights (locked) | Blurred overlay with PremiumGuard |

---

### Upsell Entry Points

| Where | Trigger |
|-------|---------|
| Dashboard search button | Tap (free user) |
| Dashboard insights section | Tap overlay |
| Analytics range pills (30D/90D/12M) | Tap (free user) |
| Analytics locked chart overlays | Tap |
| Persons FAB | Tap when at 10-person limit |
| Settings → Export CSV | Tap (free user) |
| Dashboard post-walkthrough | Auto-shown once within 3 days of completing walkthrough |

---

## 10. Global Application States

### App Launch Sequence

```
Launch
  │
  ├─ Run pending data migrations
  │
  ├─ Load user profile & premium state
  │
  ├─ Check onboarding gate
  │   ├─ Not completed → Onboarding flow
  │   └─ Completed → Continue
  │
  ├─ Check app lock
  │   ├─ Locked → Show lock screen (biometric / PIN prompt)
  │   └─ Unlocked → Continue
  │
  └─ Show Dashboard
```

### App Lock Behaviour

- **Modes:** Biometric (Face ID / fingerprint) or PIN.
- **Lock trigger:** App moves to background; grace period of 3 seconds before lock activates.
- **Lock screen:** Shown on top of all content. No underlying content visible until authenticated.
- **Enable/Disable:** Enabling requires setting up biometric or PIN. Disabling requires passing the current auth challenge.

### Theme

- Options: Light / Dark / Follow system.
- Applied globally. Every screen and component adapts.
- User sets via Settings → Theme.

### Daily Reminder Notification

- Opt-in during onboarding or from Settings.
- Default time: 20:00.
- User-adjustable time from Settings.
- Tapping notification opens app to Dashboard.
- Disabling from Settings cancels the scheduled notification.

---

*End of Fintraq Product Reference*
