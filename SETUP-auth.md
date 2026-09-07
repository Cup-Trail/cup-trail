# Auth & Security Setup

How Cup Trail's auth and data-security layer is wired, and the steps to bring it
up on a fresh/blank environment. Introduced on the `sign-up` branch.

## Model in one paragraph

The browser never writes to Postgres directly. Reads are public (RLS +
`SELECT`-only grants); **all writes go through the `api` edge function**, which
verifies the caller's JWT and calls a `SECURITY DEFINER` rpc per operation (the
transaction boundary). Auth is passkey-based: "sign up" silently creates a
Supabase **anonymous** user, links a placeholder email server-side to make it
permanent, then registers a **passkey**. An anonymous session counts as *logged
out*; it is just the transient shell of sign-up. `avg_rating` is computed by a
DB trigger, never by clients.

## Components

| Piece | Location |
|---|---|
| RLS + grant lockdown | `supabase/migrations/20260809000000_rls_hardening.sql` |
| Write-layer RPCs + `avg_rating` trigger | `supabase/migrations/20260809000100_write_layer.sql` |
| Stale-account cleanup (`pg_cron`) | `supabase/migrations/20260809000200_anon_cleanup.sql` |
| Drop `users.password` | `supabase/migrations/20260809000300_drop_users_password.sql` |
| Write API (Hono) | `supabase/functions/api/index.ts` |
| Client auth state machine | `apps/web/app/context/AuthContext.tsx` |
| Sign-in / create screen | `apps/web/app/routes/auth.tsx` |

## Local development (self-contained, recommended)

Everything auth needs is configured as code in `supabase/config.toml`
(anonymous sign-ins, manual linking, passkeys with RP `localhost` /
`http://localhost:33718`), so **no dashboard and no cloud project are required.**

One-time prereqs: `brew install colima docker supabase`.

- **`pnpm db:up`**: starts Colima + the local Supabase stack, applies all
  migrations + `seed.sql`, and writes `apps/web/.env.development` pointing the
  web app at local Supabase.
- **`pnpm dev:web`**: serves the app on `http://localhost:33718` (matches the
  passkey RP origin).
- **`pnpm db:down`** (`--all` also stops the Colima VM) and **`pnpm db:reset`**
  (rebuild the DB from migrations + seed).

Local Studio / API URLs: `supabase status`. Local edge functions are served at
`http://127.0.0.1:54321/functions/v1/<name>` automatically.

Café/city autocomplete works offline too: the `maps` function serves a small
built-in **mock** dataset (see `MOCK_PLACES` / `MOCK_CITIES` in
`supabase/functions/maps/index.ts`) whenever the `APPLE_MAPS_*` secrets are
absent. To use the real Apple Maps API locally instead, set those secrets and
the same function switches to live automatically. Add fixtures by editing the
mock arrays.

---

## Provisioning a cloud environment (production)

The steps below apply to a hosted Supabase project. Local dev is self-contained
(above), so the cloud project is effectively production.

### 1. Apply the database migrations

```bash
supabase link --project-ref <ref>
supabase db push          # needs the DB password (canonical path)
```

No Docker / DB password? Apply each file's SQL via the Management API instead:

```bash
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c 'import json,sys;print(json.dumps({"query":open(sys.argv[1]).read()}))' path/to/migration.sql)" \
  "https://api.supabase.com/v1/projects/<ref>/database/query"
```

### 2. Deploy the edge functions

```bash
supabase functions deploy api maps --project-ref <ref>
```

They read `SUPABASE_SERVICE_ROLE_KEY` (auto-injected) with a `SECRET_KEY`
fallback, plus `SUPABASE_URL`. CORS allows any `localhost` port (dev),
`*.cup-trail.pages.dev`, and `cup-trail.github.io`.

### 3. Dashboard settings (Authentication, owner only)

The Management API returns 403 on auth config for non-owner tokens, so set these
in the dashboard:

- **Anonymous sign-ins**: enable
- **Manual linking**: enable
- **URL configuration**: Site URL `https://cup-trail.pages.dev`; redirect
  allow-list `https://cup-trail.pages.dev/**` and `https://*.cup-trail.pages.dev/**`
- **Passkeys (beta)**: enable, then set the relying party:
  - Display name: `Cup Trail`
  - RP ID: `cup-trail.pages.dev`
  - RP origins (up to 5, no wildcards):
    - `https://cup-trail.pages.dev`
    - `https://preview.cup-trail.pages.dev`

Passkeys are cryptographically scoped to the RP ID, so a credential is valid
across any `*.cup-trail.pages.dev` subdomain at the browser level. The real
limiter is this origins list: Supabase validates each ceremony's exact origin
against it, and wildcards are not supported. List the fixed origins you test on.

### Preview deploys and passkeys

Cloudflare Pages gives each deploy a random `<hash>.cup-trail.pages.dev` URL
(not usable for passkeys, since the origin changes every deploy) plus a stable
**branch alias** `<branch>.cup-trail.pages.dev`. We keep a long-lived
**`preview`** branch whose alias `https://preview.cup-trail.pages.dev` is
registered as an RP origin above. To test any branch on that stable URL with
working passkeys, point `preview` at it and push:

```bash
git push -f origin <branch>:preview
```

Cloudflare redeploys the same alias and the registered origin keeps working.
Random per-commit preview URLs will not have passkeys.

### 4. Environment (`apps/web/.env` / Cloudflare Pages vars)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...      # anon/publishable key
```

Production reads these from the Cloudflare Pages project settings; local dev
overrides them via `apps/web/.env.development` (written by `pnpm db:up`).

### 5. Smoke test

- Add a review while logged out, get redirected to `/auth`, **Create account
  with passkey**, complete the prompt, and the review saves.
- **Sign out**, then **Sign in with passkey**.
- Start "Create account", **cancel** the passkey prompt, and the shell account
  is deleted (also covered by the cleanup sweep for non-clean exits).

## Notes / TODO

- **Turnstile:** Supabase flags the anonymous endpoint as a DB-bloat abuse
  vector. Add a Turnstile/CAPTCHA token in `AuthContext.createAccount` (marked
  `TODO`) before any real launch.
- **Placeholder email domain:** `users.cup-trail.com` in
  `supabase/functions/api/index.ts` (`FAKE_EMAIL_DOMAIN`). Use a domain you
  control with no MX records so stray mail bounces.
- **supabase-js:** must be >= `2.111` for `registerPasskey`/`signInWithPasskey`
  (repo is on `2.112.2`).
- **Cleanup sweep:** `sweep-stale-accounts` runs every 30 min; deletes
  anonymous + placeholder-email-no-passkey accounts older than 24h that hold no
  reviews.
