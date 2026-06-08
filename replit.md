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

## Data portability

This project is designed to run from the Dokploy deployment for `aivec.org`.
Everything user-facing lives in services you control:

- **Admin accounts** — Admin login uses the native `admin_users` and `admin_sessions` tables. No external auth provider is required for the admin panel.
- **All content** (pages, events, news, blog, sponsors, contact submissions, scientific researches, site settings, admin accounts) — lives in the same Postgres DB. A `pg_dump` of `DATABASE_URL` is a full backup.
- **Uploaded files** (hero images, sponsor logos, form uploads) — live on the API container filesystem under `LOCAL_OBJECT_ROOT`, which should be mounted to persistent storage in Dokploy. For production this is `/app/uploads` in the container and `/srv/docker/dokploy/volumes/aivec/uploads` on the host.
- **Public user accounts** — The previous external public user-auth flow is disabled. Public viewing, admin login, admin content management, and local uploads do not require public user-auth credentials.

Production API env:

- `NODE_ENV=production`
- `PORT=3000`
- `DATABASE_URL` — your Postgres connection string
- `LOCAL_OBJECT_ROOT=/app/uploads`
- `ALLOWED_ORIGINS=https://aivec.org,http://aivec.org`
- `ADMIN_INITIAL_USERNAME` / `ADMIN_INITIAL_PASSWORD` — initial admin-panel credentials (see Admin access)

If the site is served from `www.aivec.org`, include those origins too:

- `ALLOWED_ORIGINS=https://aivec.org,http://aivec.org,https://www.aivec.org,http://www.aivec.org`

Production frontend env:

- `NODE_ENV=production`
- `PORT=3000`
- `BASE_PATH=/`

## Admin access

- Admin panel: `/<lang>/admin` (e.g. `/en/admin`) — uses native admin login.
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
