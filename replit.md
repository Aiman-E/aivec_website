# [Project name]

_Replace the heading above with the project's name, and this line with one sentence describing what this app does for users._

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

_Populate as you build — short repo map plus pointers to the source-of-truth file for DB schema, API contracts, theme files, etc._

## Architecture decisions

_Populate as you build — non-obvious choices a reader couldn't infer from the code (3-5 bullets)._

## Product

_Describe the high-level user-facing capabilities of this app once they exist._

## Data portability (running off Replit)

This project is **not locked to Replit**. Everything user-facing lives in services you control:

- **User accounts** — Every user that signs in has their `clerkId`, email, first/last name, role, and join date written to the `users` table in your Postgres database (see `lib/db/src/schema/auth.ts` and `getOrCreateLocalUser` in `artifacts/api-server/src/lib/auth.ts`). Admin → Users has an **Export CSV** button to back this up at any time.
- **All content** (pages, events, news, blog, sponsors, contact submissions, scientific researches, site settings, admin accounts) — lives in the same Postgres DB. A `pg_dump` of `DATABASE_URL` is a full backup.
- **Uploaded files** (hero images, sponsor logos, scientific paper PDFs) — live in the configured object storage bucket. On Replit this is App Storage; on another host, point `DEFAULT_OBJECT_STORAGE_BUCKET_ID` / `PRIVATE_OBJECT_DIR` / `PUBLIC_OBJECT_SEARCH_PATHS` at any S3-compatible bucket.
- **Passwords** — Clerk handles password verification on its own servers. Your DB never sees plaintext passwords, and Clerk does not share password hashes. If you ever drop Clerk, users will need to set a new password with the replacement auth provider; their **identities (email, name, role) remain in your DB**.

To run the app off Replit, point these env vars at your own infrastructure:

- `DATABASE_URL` — your Postgres
- `VITE_CLERK_PUBLISHABLE_KEY` + Clerk secret key — your Clerk account (works on any host; not Replit-tied)
- `DEFAULT_OBJECT_STORAGE_BUCKET_ID`, `PRIVATE_OBJECT_DIR`, `PUBLIC_OBJECT_SEARCH_PATHS` — your object storage
- `AIVEC_ADMIN_EMAILS` — comma-separated emails auto-promoted to admin on first sign-in
- `ADMIN_INITIAL_USERNAME` / `ADMIN_INITIAL_PASSWORD` — initial admin-panel credentials (see Admin access)

## Admin access

- Admin panel: `/<lang>/admin` (e.g. `/en/admin`) — separate from public Clerk login.
- Default seeded login on first run: **username `admin` / password `admin`** (change immediately via Admin → Admin Accounts).
- Override the initial seed via env: `ADMIN_INITIAL_USERNAME`, `ADMIN_INITIAL_PASSWORD`.
- In production (`NODE_ENV=production`), the seed will refuse to run unless `ADMIN_INITIAL_PASSWORD` is at least 12 characters.
- Sessions are httpOnly cookies (`aivec_admin_session`), 7-day TTL.
- Server invariants: cannot delete or disable your own account; at least one active admin must always remain.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
