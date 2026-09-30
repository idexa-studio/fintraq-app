# Fintraq app

Offline-first personal finance app (Expo / React Native, SQLite + Drizzle). Live on the stores — keep changes backward compatible with existing user data.

Read before changing code:
- `docs/ARCHITECTURE.md` — folder structure, dependency rules, coding style
- `docs/DESIGN_SYSTEM.md` — tokens, components, UI patterns, screen migration checklist

Key rules
- UI is built from `@/src/components/ui` (barrel). Tokens come from `useTheme()`. No hex literals, no bare `fontSize`.
- New or changed primitives get a specimen in the Design Gallery (`src/features/design-gallery/sections/`).
- Imports use the `@/src/…` alias; `./` only for same-folder siblings; never `../`.
- User-facing strings go through i18n (`src/i18n/locales/en.ts` is the typed source).
- Never edit `drizzle/` migrations by hand — `npm run db:generate`.

Checks: `npx tsc --noEmit`, `npx expo lint` and `npm test` must all be clean.
