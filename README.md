# Fintraq

Private, offline-first personal finance tracker for Android and iOS — accounts, transactions, categories, people & loans, analytics, and encrypted Google Drive backup.

## Develop

```bash
npm install
npx expo run:android   # or run:ios — requires a dev client (native modules)
npx expo start         # after the dev client is installed
```

## Scripts

| Command | What it does |
|---|---|
| `npx tsc --noEmit` | Type-check |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a Drizzle migration from `data/db/schema.ts` |
| `npm run db:studio` | Inspect the local database |

## Docs

- [Architecture & coding style](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md) — live catalogue in-app: Settings → tap the footer 10× → Developer → Design gallery
- [Feature access matrix](docs/features.md)
