# Screens and flows

Every screen of the rebooted app, where it lives, how people reach it, and the
main journeys through it. Routes are Expo Router paths under `app/`; each
route file only re-exports a screen from `features/<feature>/screens/`.

## Shape of the app

Four places and one action in the tab bar. Everything else is pushed on top
of a tab or presented as a task.

| Tab | Its one job |
| --- | --- |
| **Home** | Where you stand now, and the next thing to do |
| **Activity** | Everything that happened, findable |
| **Add** (centre) | Record something. Opens a task, is not a place |
| **Plan** | What is coming: money owed and owing, repeating items, budgets, goals |
| **Insights** | Why the numbers are what they are |

Settings is not a tab. It opens from the profile icon in Home's header, as in
the reference. Accounts are a section of Home with their own list behind "See
all".

```mermaid
flowchart TD
  launch([Launch]) --> lock{App lock on?}
  lock -- yes --> unlock[Unlock]
  lock -- no --> first{First run?}
  unlock --> first
  first -- yes --> welcome[Welcome]
  first -- no --> tabs

  subgraph tabs [Tab bar]
    home[Home]
    activity[Activity]
    add((Add))
    plan[Plan]
    insights[Insights]
  end

  home --> accounts[Accounts] --> account[Account]
  home --> settings[Settings]
  home --> search[Search · Pro]
  home --> tx
  activity --> tx[Transaction] --> txEdit[Edit transaction]
  activity --> search
  add --> entry[Add transaction]
  add --> loanNew[New loan]
  plan --> people[People] --> person[Person]
  plan --> loan[Loan] --> repay[Record repayment]
  plan --> recurring[Repeating items · Next]
  plan --> budget[Budget · Next]
  plan --> goal[Goal · Later]
  insights --> categoriesBreak[Category breakdown · Pro]
  insights --> paywall
  settings --> categories[Categories]
  settings --> backup[Backup]
  settings --> security[App lock]
  settings --> export[Export · Pro]
  settings --> paywall[Fintraq Pro]
  settings --> about[About]
```

## Screen inventory

Presentation: **tab**, **push** (slides in, back arrow), **task** (rises over
the screen with a serif title and a close button; used for anything you fill
in and finish).

### Start

| Route | Screen | Feature | Shows as | Plan |
| --- | --- | --- | --- | --- |
| `/welcome` | Welcome: start fresh or restore | `onboarding` | full screen | Free |
| `/welcome/setup` | Name, currency, first account, as stacked cards | `onboarding` | task | Free |
| `/welcome/restore` | Pick a backup file or connect Google Drive | `onboarding` | task | File free, Drive Pro |
| `/welcome/reminder` | Offer the daily reminder | `onboarding` | full screen | Free |
| (overlay) | Unlock: PIN pad or biometrics | `lock` | over everything | Free |

### Tabs

| Route | Screen | Feature | Plan |
| --- | --- | --- | --- |
| `/` | Home | `home` | Free |
| `/activity` | Activity: transactions by day, filter chips | `activity` | Free |
| `/plan` | Plan: upcoming, people and loans, budgets, goals | `plan` | Free, with Pro sections |
| `/insights` | Insights: period summary, top categories, findings | `insights` | Free, with Pro sections |

### Money

| Route | Screen | Feature | Shows as | Plan |
| --- | --- | --- | --- | --- |
| `/add` | Add transaction (expense, income, transfer) | `transactions` | task | Free |
| `/transactions/[id]` | Transaction, as a receipt | `transactions` | push | Free |
| `/transactions/[id]/edit` | Edit transaction | `transactions` | task | Free |
| `/accounts` | Accounts and net worth | `accounts` | push | Free |
| `/accounts/[id]` | Account: balance, its activity | `accounts` | push | Free |
| `/accounts/new`, `/accounts/[id]/edit` | Account form | `accounts` | task | Free |
| `/categories` | Categories | `categories` | push | Free |
| `/categories/new`, `/categories/[id]/edit` | Category form | `categories` | task | Free |
| `/search` | Search | `search` | push | Pro |

### Plan

| Route | Screen | Feature | Shows as | Plan |
| --- | --- | --- | --- | --- |
| `/people` | People and balances | `people` | push | Free up to 10 |
| `/people/[id]` | Person: balance, loans, shared activity | `people` | push | Free |
| `/people/new`, `/people/[id]/edit` | Person form | `people` | task | Free |
| `/loans/[id]` | Loan, as a timeline | `loans` | push | Free |
| `/loans/new`, `/loans/[id]/edit` | Loan form | `loans` | task | Free up to 3 active |
| `/loans/[id]/repay` | Record repayment, slide to confirm | `loans` | task | Free |
| `/recurring`, `/recurring/[id]` | Repeating items | `recurring` | push, task | Next. Free up to 2 |
| `/budgets/[id]`, `/budgets/new` | Budget | `budgets` | push, task | Next. Free up to 1 |
| `/goals/[id]`, `/goals/new` | Goal | `goals` | push, task | Later. Free up to 1 |

### Settings and Pro

| Route | Screen | Feature | Shows as | Plan |
| --- | --- | --- | --- | --- |
| `/settings` | Settings: profile, currency, language, appearance, reminder | `settings` | push | Free |
| `/settings/security` | App lock: PIN, biometrics | `lock` | push | Free |
| `/settings/backup` | Backup: file (free), automatic cloud (Pro) | `backup` | push | Mixed |
| `/settings/export` | Spreadsheet export | `export` | push | Pro |
| `/settings/about` | Version, privacy, terms, usage-data switch | `settings` | push | Free |
| `/pro` | Paywall: pillars, three plans, lifetime first | `pro` | task | n/a |
| `/pro/welcome` | Purchase complete | `pro` | task | n/a |

### Developer (hidden, development builds and PIN)

| Route | Screen | Feature |
| --- | --- | --- |
| `/design-gallery` | Design gallery | `gallery` |
| `/developer`, `/developer/logs` | Developer tools, logs | `developer` |

## Routes that must keep working

The shipped app has put these paths outside the app: in pinned launcher
shortcuts, scheduled notifications and store links. Each stays as a route
file that redirects, for good.

| Old path | Goes to |
| --- | --- |
| `/transactions/create?type=DR\|CR\|TR` (launcher shortcuts) | `/add?kind=expense\|income\|transfer` |
| `/(main)/loans/form` (launcher shortcut) | `/loans/new` |
| `/transactions/edit/[id]` | `/transactions/[id]/edit` |
| `/transactions?accountId=…`, `?categoryId=…` | `/activity` with the same filter |
| `/persons`, `/persons/[id]` | `/people`, `/people/[id]` |
| `/premium?feature=<old id>` | `/pro?feature=<id>` via `resolveProFeature` |
| `/analytics` | `/insights` |
| `/backup`, `/export` | `/settings/backup`, `/settings/export` |

## Flows

### First run

```mermaid
flowchart TD
  a[Welcome] -->|Let's get started| b[Setup · stacked cards]
  a -->|Restore from backup| r{Where from?}
  b --> b1[Your name] --> b2[Currency] --> b3[First account and balance] --> c[Reminder?]
  r -->|Backup file| rf[Pick file] --> rr[Restoring · please wait]
  r -->|Google Drive| pro{Pro?}
  pro -- yes --> rd[Connect Drive] --> rr
  pro -- no --> pw[Fintraq Pro] --> rd
  rr --> c
  c -->|Turn on| perm[System permission] --> home[Home]
  c -->|Maybe later| home
```

### Add a transaction

```mermaid
flowchart TD
  s([Add tab · Home card action · launcher shortcut]) --> kind[Kind: expense, income or transfer]
  kind --> amount[How much? · keypad, quick amounts]
  amount --> acct[Which account?]
  acct --> isT{Transfer?}
  isT -- yes --> to[To which account?] --> details
  isT -- no --> cat[What was it for?] --> details[Anything to add? · note, date, person, repeat]
  details -->|Save| saved([Closes. Activity and Home show it at once])
  details -->|Repeat is on| rep{Within free allowance?}
  rep -- yes --> saved
  rep -- no --> pw[Fintraq Pro] --> saved
```

Each answered step stays visible as a tucked card and can be tapped to change
it. Save is disabled, with the reason shown, until there is an amount.

### Lend, borrow and settle

```mermaid
flowchart TD
  s([Plan · Add · person's page]) --> lim{Fewer than 3 active loans, or Pro?}
  lim -- no --> pw[Fintraq Pro]
  lim -- yes --> form[New loan: who, which way, how much, from which account, due date]
  pw --> form
  form --> loan[Loan · timeline]
  loan -->|Record repayment| amt[Amount] --> slide[Slide to confirm] --> loan
  loan --> full{Fully repaid?}
  full -- yes --> done([Marked settled. Reminders cancelled])
  full -- no --> loan
```

### Reaching Pro and buying

```mermaid
flowchart TD
  g1([A locked section in Insights or Plan]) --> pw
  g2([A free limit reached]) --> pw
  g3([Search or Export opened]) --> pw
  g4([Settings]) --> pw
  pw[Paywall · opens on the feature that brought you] --> plan{Plan}
  plan -->|Lifetime · preselected| buy
  plan -->|Yearly| buy
  plan -->|Monthly| buy
  buy[Store purchase sheet] --> res{Result}
  res -- paid --> ok[You're in · returns to where you were]
  res -- pending --> pend[Payment pending · unlocks when confirmed]
  res -- cancelled --> pw
  res -- failed --> err[What went wrong and what to do] --> pw
  pw -->|Restore purchases| rest{Found?}
  rest -- yes --> ok
  rest -- no --> none[No purchase on this store account] --> pw
```

### Backup and restore

```mermaid
flowchart TD
  b[Settings · Backup] --> file[Save a backup file · free] --> share[System share sheet]
  b --> auto{Automatic backup · Pro?}
  auto -- no --> pw[Fintraq Pro]
  auto -- yes --> conn[Connect Google Drive] --> on[On · last backup time shown]
  b --> restore[Restore]
  restore --> src{From}
  src -->|File| pick[Pick file]
  src -->|Drive| conn2[Choose backup]
  pick --> confirm
  conn2 --> confirm[Replace everything on this phone? · dialog]
  confirm -->|Restore| wait[Please wait] --> done([Home, with restored data])
  confirm -->|Keep what I have| b
```

### Unlocking

```mermaid
flowchart TD
  open([App opened or brought back]) --> on{App lock on?}
  on -- no --> app([App])
  on -- yes --> bio{Biometrics set?}
  bio -- yes --> scan[System prompt]
  scan -- ok --> app
  scan -- failed or cancelled --> pin
  bio -- no --> pin[PIN pad]
  pin -- right --> app
  pin -- wrong --> tries{Too many?}
  tries -- no --> pin
  tries -- yes --> wait[Locked for a while · time shown] --> pin
```

## States every screen designs

Loading (placeholders in the shape of the content), empty (what will be here
and the first step), error (what happened and what to do), and for anything
Pro, the locked state. A control that cannot work yet is disabled with the
reason beside it; it is never left to fail on tap.
