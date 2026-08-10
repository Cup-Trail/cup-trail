// functions/api/index.ts
// Authoritative write API. The browser never writes to Postgres directly
// (RLS is read-public / write-none); every mutation goes through here.
//
// This layer: verifies the caller's JWT, validates input, and calls a single
// SECURITY DEFINER rpc per operation (the transaction boundary — see
// supabase/migrations/20260809000100_write_layer.sql). Reads stay direct-client.
console.log('Cup Trail write API booting…');

import { cors } from 'https://deno.land/x/hono@v4.2.9/middleware/cors/index.ts';
import { Hono } from 'https://deno.land/x/hono@v4.2.9/mod.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SECRET_KEY = Deno.env.get('SECRET_KEY')!; // service_role key (same name as maps fn)

// Service-role client: bypasses RLS and is the only thing allowed to call the
// write RPCs. Never exposed to the browser.
const admin = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/*──────────────────────── CORS (shared with maps fn) ───────────────────────*/
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost',
  'https://cup-trail.github.io',
  'capacitor://localhost',
];
function isAllowedOrigin(origin?: string) {
  return (
    !!origin &&
    (ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.cup-trail.pages.dev'))
  );
}

const app = new Hono().basePath('/api');

app.use(
  '*',
  cors({
    origin: origin => (isAllowedOrigin(origin) ? origin : null),
    allowMethods: ['GET', 'POST', 'PATCH', 'PUT', 'OPTIONS'],
    allowHeaders: ['authorization', 'content-type', 'x-client-info', 'apikey'],
  })
);

/*──────────────────────── Auth: verify the caller's JWT ────────────────────*/
// Populates c.get('userId') with the verified user id (works for anonymous
// sign-in too — anon users still carry a real JWT).
app.use('*', async (c, next) => {
  const authz = c.req.header('Authorization') ?? '';
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  c.set('userId', data.user.id);
  await next();
});

// Map a Postgres error to a sensible HTTP status.
function rpcError(c: any, error: { message: string; code?: string }) {
  const status = error.code === '42501' || error.code === '28000' ? 403 : 400;
  return c.json({ error: error.message }, status);
}

/*──────────────────────────────── ROUTES ───────────────────────────────────*/

// Create a shop (get-or-insert). canonical_key computed client-side.
app.post('/shops', async c => {
  const b = await c.req.json();
  const { data, error } = await admin.rpc('get_or_insert_shop', {
    p_name: b.name,
    p_address: b.address,
    p_latitude: b.latitude,
    p_longitude: b.longitude,
    p_apple_place_id: b.applePlaceId ?? null,
    p_canonical_key: b.canonicalKey,
  });
  return error ? rpcError(c, error) : c.json(data);
});

app.post('/shops/:id/archive', async c => {
  const { data, error } = await admin.rpc('archive_shop', {
    p_shop_id: c.req.param('id'),
  });
  return error ? rpcError(c, error) : c.json(data);
});

// Create a review (atomic: drink + shop_drink + review + avg via trigger).
app.post('/reviews', async c => {
  const b = await c.req.json();
  const { data, error } = await admin.rpc('submit_review', {
    p_user_id: c.get('userId'),
    p_shop_id: b.shopId,
    p_drink_name: b.drinkName,
    p_rating: b.rating,
    p_comment: b.comment ?? '',
  });
  if (error) return rpcError(c, error);
  // Shape to the client's ReviewInsertRef: { id, shop_drinks: { id } }
  return c.json({ id: data.id, shop_drinks: { id: data.shop_drink_id } });
});

// Owner-scoped partial update (rating / comment / media_urls).
app.patch('/reviews/:id', async c => {
  const patch = await c.req.json();
  const { data, error } = await admin.rpc('update_review', {
    p_user_id: c.get('userId'),
    p_review_id: c.req.param('id'),
    p_patch: patch,
  });
  return error ? rpcError(c, error) : c.json(data);
});

// Update shop_drink price / cover (never avg_rating).
app.patch('/shop-drinks/:id', async c => {
  const b = await c.req.json();
  const { data, error } = await admin.rpc('update_shop_drink_fields', {
    p_shop_drink_id: c.req.param('id'),
    p_price: b.price ?? null,
    p_cover_photo_url: b.cover_photo_url ?? null,
  });
  return error ? rpcError(c, error) : c.json(data);
});

// Replace a shop_drink's category mappings.
app.put('/shop-drinks/:id/categories', async c => {
  const b = await c.req.json();
  const { error } = await admin.rpc('set_shop_drink_categories', {
    p_shop_drink_id: c.req.param('id'),
    p_slugs: b.slugs ?? [],
  });
  return error ? rpcError(c, error) : c.json({ ok: true });
});

/*──────────────────────────── ACCOUNT LIFECYCLE ────────────────────────────*/
// Placeholder email domain used to convert anonymous users to permanent ones
// without ever sending mail. Use a domain you control that has no MX records
// so any stray delivery bounces.
const FAKE_EMAIL_DOMAIN = 'users.cup-trail.com';

// Convert the caller's anonymous account to a permanent one by linking a
// placeholder, pre-confirmed email. Must be done with the admin API +
// email_confirm so Supabase does not try to send a confirmation message.
// After this the client can call registerPasskey().
app.post('/account/complete', async c => {
  const userId = c.get('userId');
  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const currentEmail = existing.user?.email ?? '';

  // Already converted (has a non-placeholder email) → nothing to do.
  if (currentEmail && !currentEmail.endsWith(`@${FAKE_EMAIL_DOMAIN}`)) {
    return c.json({ ok: true, alreadyPermanent: true });
  }

  const { error } = await admin.auth.admin.updateUserById(userId, {
    email: `${userId}@${FAKE_EMAIL_DOMAIN}`,
    email_confirm: true,
  });
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

// Self-delete: only permitted for accounts that are still anonymous or are
// placeholder-email "ghosts" that never finished passkey setup. A caller can
// only ever target their own id (derived from their verified JWT).
app.post('/account/abandon', async c => {
  const userId = c.get('userId');
  const { data: existing } = await admin.auth.admin.getUserById(userId);
  const email = existing.user?.email ?? '';
  const isAnon = Boolean(existing.user?.is_anonymous);
  const isGhost = email.endsWith(`@${FAKE_EMAIL_DOMAIN}`);

  if (!isAnon && !isGhost) {
    return c.json({ error: 'refusing to delete a completed account' }, 403);
  }

  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return c.json({ error: error.message }, 400);
  return c.json({ ok: true });
});

app.get('/', c =>
  c.json({
    message: 'Cup Trail write API',
    endpoints: [
      'POST /api/shops',
      'POST /api/shops/:id/archive',
      'POST /api/reviews',
      'PATCH /api/reviews/:id',
      'PATCH /api/shop-drinks/:id',
      'PUT /api/shop-drinks/:id/categories',
      'POST /api/account/complete',
      'POST /api/account/abandon',
    ],
  })
);

Deno.serve(app.fetch);
