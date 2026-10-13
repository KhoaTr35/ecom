<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project: ATELIER (CO3027 BTL)

Next.js App Router, full-stack, hybrid: **Server Components read, REST Route
Handlers write**. No Server Actions for writes. See the plan doc at
`Implementation Plan – Website TMĐT cho chủ đề X (CO3027).md` for the full spec —
this file is the condensed version for day-to-day coding.

### Stack

TypeScript (strict) · Next.js App Router · Tailwind v4 + shadcn/ui (Base UI
primitives — use the `render` prop for polymorphism, not `asChild`) · React
Hook Form + Zod · PostgreSQL + Prisma 7 (driver adapter, `lib/db.ts`) · Better
Auth (email/password + role, JWT plugin for Bearer clients) · VNPay sandbox +
COD · pnpm.

### Agent skills

Project-local Claude/Codex/Cursor skills live in `.agents/skills/` (symlinked
into `.claude/skills/` for Claude Code). Installed via the official shadcn
skills registry:

```bash
pnpm dlx skills add shadcn/ui
```

Installed: `shadcn` (component docs, `components.json`-aware, CLI usage) and
`migrate-radix-to-base` (unused here — this project is already on Base UI, kept
for reference). Re-run the command above to update after a shadcn skill release.
Commit `.agents/` and `.claude/skills/` so every agent working on this repo gets
them, same as `AGENTS.md` itself.

### Commands

- `pnpm dev` — start the app
- `pnpm db:migrate` — create/apply a migration (dev)
- `pnpm db:deploy` — apply migrations (production, no shadow DB)
- `pnpm db:seed` — load `prisma/seed-data.json`
- `pnpm test` — Vitest unit tests (`tests/unit`)
- `pnpm build` / `pnpm lint` / `pnpm exec tsc --noEmit`

### Structure

Business logic lives only in `lib/*`. `app/` (pages) and `app/api/*` (REST)
are thin callers into `lib/`. Each `lib/<domain>` maps to one concern:
`auth`, `catalog`, `cart`, `order`, `payment`, `pricing`, `shipping`,
`recommend`, `analytics`, `validation`.

### Conventions

- Money: always `Int` VNĐ. Format only in the UI with `Intl.NumberFormat("vi-VN")`.
- Time: store UTC; business functions take `now: Date` as a parameter (testable).
- IDs: `cuid()`; URLs use `slug`.
- Errors: `lib/` throws `AppError(code, message)`; routes return it via `apiError()`.
- Every client input is validated with Zod (`lib/validation/*`) before reaching `lib/`.
- Price is never trusted from the client — the server recomputes with `calculatePrice`.

### Hard rules

- Never trust price, amount, or role sent by the client.
- Every write endpoint goes through `withAuth` (`lib/auth/with-auth.ts`); never use
  Server Actions for writes.
- Never edit an already-merged migration — create a new one for schema changes.
- Never commit secrets; never log amounts next to personal data.
- New code in `lib/pricing`, `lib/order`, `lib/payment`, `lib/auth` needs tests.
- Don't hardcode product/category names — they come from the DB or `seed-data.json`.


### Design system

Monochrome editorial minimalism — the visual rules are enforced by tokens, not
per-page classes:

- All colour comes from CSS variables in `app/globals.css` (light + dark). Never
  hardcode a hex in a component.
- `--radius: 0` — nothing is rounded. Don't add `rounded-*` to new UI.
- No shadows. Depth is expressed with `border-border` hairlines or by inverting
  foreground/background.
- Fonts: `font-heading` (Instrument Serif) for display text, default sans (Inter)
  for everything else. Hierarchy comes from size, not weight.
- `label-eyebrow` (custom utility) is the recurring uppercase micro-label.
- Storefront nav lives in `components/shop/nav-links.ts` — header, mobile sheet
  and footer all read from it.
