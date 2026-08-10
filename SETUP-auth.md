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
out* — it's just the transient shell of sign-up. `avg_rating` is computed by a
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

## 1. Apply the database migrations

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

## 2. Deploy the edge function

```bash
supabase functions deploy api --project-ref <ref>
```

Requires project secrets `SECRET_KEY` (service role) and `SUPABASE_URL` — these
already exist for the maps function. CORS allows `localhost:5173`,
`*.cup-trail.pages.dev`, and `cup-trail.github.io`.

## 3. Dashboard settings (Authentication)

The Management API does not reliably write these — do them in the dashboard:

- **Anonymous sign-ins** → enable
- **Manual linking** → enable
- **Passkeys (beta)** → enable, then set the relying party:
  - Display name: `Cup Trail`
  - **Local dev:** RP ID `localhost`, origin `http://localhost:5173`
  - **Production:** RP ID `cup-trail.pages.dev`, origin `https://cup-trail.pages.dev`
  - (One RP ID only — local and prod passkeys can't be shared; reconfigure when
    moving to prod or a custom domain.)

## 4. Environment (`apps/web/.env`)

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...      # anon/publishable key
```

## 5. Test locally

```bash
pnpm dev:web        # http://localhost:5173
```

- Add a review while logged out → redirected to `/auth` → **Create account with
  passkey** → passkey prompt → review saves.
- **Sign out**, then **Sign in with passkey**.
- Start "Create account", **cancel** the passkey prompt → the shell account is
  deleted (also covered by the cleanup sweep for non-clean exits).

## Notes / TODO

- **Turnstile:** Supabase flags the anonymous endpoint as a DB-bloat abuse
  vector. Add a Turnstile/CAPTCHA token in `AuthContext.createAccount` (marked
  `TODO`) before any real launch.
- **Placeholder email domain:** `users.cup-trail.com` in
  `supabase/functions/api/index.ts` (`FAKE_EMAIL_DOMAIN`). Use a domain you
  control with no MX records so stray mail bounces.
- **supabase-js:** must be ≥ `2.111` for `registerPasskey`/`signInWithPasskey`
  (repo is on `2.112.2`).
- **Cleanup sweep:** `sweep-stale-accounts` runs every 30 min; deletes
  anonymous + placeholder-email-no-passkey accounts older than 24h that hold no
  reviews.
