# Copilot instructions — Fintraq

Before generating code, follow:
- `docs/ARCHITECTURE.md` — where files go, dependency rules, coding style
- `docs/DESIGN_SYSTEM.md` — tokens, components and UI patterns

Essentials
- Build UI from `@/src/components/ui` (`Screen`, `Text`, `Button`, `ListGroup`/`ListItem`, `EmptyState`, …). Read tokens via `useTheme()`.
- No hex colours, raw font sizes or magic spacing numbers — use `colors`, `alpha()`, `<Text variant>`, `spacing()`, `radius()`.
- Data flows screen → `features/*/hooks` (React Query) → `features/*/api` → Drizzle. Local-only, no cloud except the user's own Google Drive backup.
- `@/src/…` imports; no `../`. Named exports; default export only in `app/` routes.
- All user-facing text through `t()`.
