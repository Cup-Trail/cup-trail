// functions/maps/index.ts
console.log('Apple Maps Edge Function booting…');

import { cors } from 'https://deno.land/x/hono@v4.2.9/middleware/cors/index.ts';
import { Hono } from 'https://deno.land/x/hono@v4.2.9/mod.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';

// JOSE — for signing the 7-day Apple JWT
import {
  SignJWT,
  importPKCS8,
} from 'https://deno.land/x/jose@v4.14.4/index.ts';

/*──────────────────────────────────────────────────────────────
  CONSTANTS + ENV
──────────────────────────────────────────────────────────────*/
const APPLE = 'https://maps-api.apple.com/v1';

const TEAM_ID = Deno.env.get('APPLE_MAPS_TEAM_ID')!;
const KEY_ID = Deno.env.get('APPLE_MAPS_KEY_ID')!;
const PRIVATE_KEY_PEM = Deno.env.get('APPLE_MAPS_PRIVATE_KEY')!;

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
// Local edge runtime injects SUPABASE_SERVICE_ROLE_KEY; the cloud also has SECRET_KEY.
const SECRET_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SECRET_KEY')!;

const db = createClient(SUPABASE_URL, SECRET_KEY);

// ── Local mock mode ─────────────────────────────────────────────────────────
// With no Apple credentials (local dev) serve a small fixed set of results so
// café/city autocomplete works offline; no Apple Developer account needed.
// In the cloud the creds are present, so the real Apple API is used.
const USE_MOCK = !TEAM_ID || !KEY_ID || !PRIVATE_KEY_PEM;
if (USE_MOCK) console.log('⚠️  maps: Apple creds absent, serving MOCK data');

const MOCK_PLACES = [
  { id: 'mock-trailhead', name: 'Trailhead Coffee',  address: '100 Summit Ave, Seattle, WA 98101',        latitude: 47.6062, longitude: -122.3321 },
  { id: 'mock-fogfoam',   name: 'Fog & Foam',        address: '250 Marina Blvd, San Francisco, CA 94123', latitude: 37.806,  longitude: -122.423 },
  { id: 'mock-hazel',     name: 'Hazel & Oat',       address: '55 Pearl St, Portland, OR 97209',          latitude: 45.5231, longitude: -122.6765 },
  { id: 'mock-lantern',   name: 'Lantern Tea House',  address: '900 Clement St, San Francisco, CA 94118',  latitude: 37.7825, longitude: -122.468 },
  { id: 'mock-daybreak',  name: 'Daybreak Espresso',  address: '12 Beacon St, Boston, MA 02108',           latitude: 42.3585, longitude: -71.0636 },
];
const MOCK_CITIES = [
  { name: 'Seattle, WA',       latitude: 47.6062, longitude: -122.3321 },
  { name: 'San Francisco, CA', latitude: 37.7749, longitude: -122.4194 },
  { name: 'Portland, OR',      latitude: 45.5152, longitude: -122.6784 },
];
const mockMatch = (s: string, q: string) => s.toLowerCase().includes(q.toLowerCase());

/*──────────────────────────────────────────────────────────────
  CORS
──────────────────────────────────────────────────────────────*/
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost',
  'https://cup-trail.github.io',
  'capacitor://localhost',
];

function isAllowedOrigin(origin?: string) {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.endsWith('.cup-trail.pages.dev')) return true;
  // Dev: allow any localhost / 127.0.0.1 port (vite dev server uses 33718).
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}
/*──────────────────────────────────────────────────────────────
  DATABASE HELPERS
──────────────────────────────────────────────────────────────*/

async function loadCache(key: string) {
  const { data, error } = await db
    .from('apple_maps_token_cache')
    .select('value, expires_at')
    .eq('key', key)
    .maybeSingle();

  if (error) {
    console.error('❌ loadCache error:', error);
    return null;
  }

  if (!data) return null;

  const expiresAtMs = Date.parse(data.expires_at);
  if (Number.isNaN(expiresAtMs)) {
    console.error('❌ Invalid expires_at:', data.expires_at);
    return null;
  }

  return {
    value: data.value,
    expiresAt: expiresAtMs / 1000,
  };
}

async function saveCache(key: string, value: string, expiresAtUnix: number) {
  const expiresISO = new Date(expiresAtUnix * 1000).toISOString();

  const { error } = await db.from('apple_maps_token_cache').upsert({
    key,
    value,
    expires_at: expiresISO,
  });

  if (error) {
    console.error('❌ saveCache error:', key, error);
  }
}

/*──────────────────────────────────────────────────────────────
  SIGNING JWT (valid 7 days)
──────────────────────────────────────────────────────────────*/

async function getSigningJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  // Try DB cached version
  const cached = await loadCache('signing_jwt');
  if (cached && cached.expiresAt > now + 60) {
    console.log('♻️ Using cached SIGNING JWT');
    return cached.value;
  }

  console.log('🔐 Generating NEW signing JWT…');

  const privateKey = await importPKCS8(PRIVATE_KEY_PEM, 'ES256');

  const jwt = await new SignJWT({
    iss: TEAM_ID,
    iat: now,
    exp: now + 7 * 86400,
  })
    .setProtectedHeader({
      alg: 'ES256',
      kid: KEY_ID,
      typ: 'JWT',
    })
    .sign(privateKey);

  // decode exp
  const [, payloadB64] = jwt.split('.');
  const payload = JSON.parse(
    atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
  );

  await saveCache('signing_jwt', jwt, payload.exp);

  console.log('🗝 New signing JWT expires:', new Date(payload.exp * 1000));

  return jwt;
}

/*──────────────────────────────────────────────────────────────
  ACCESS TOKEN (valid 30 minutes)
──────────────────────────────────────────────────────────────*/

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  const cached = await loadCache('access_token');
  console.log('🔎 EXPIRES AT:', cached.expiresAt, 'NOW+30:', now + 30);

  if (cached && cached.expiresAt > now + 30) {
    console.log('♻️ Using cached ACCESS TOKEN');
    return cached.value;
  }

  console.log('🔄 Fetching NEW Apple access token…');

  const signingJWT = await getSigningJWT();

  // MUST be POST — Apple's docs require POST
  const res = await fetch(`${APPLE}/token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${signingJWT}`,
    },
  });

  if (!res.ok) {
    console.error('❌ Failed to obtain access token:', await res.text());
    throw new Error('Apple token exchange failed');
  }

  const data = await res.json();

  const token = data.accessToken;
  const expiresAt = now + (data.expiresInSeconds ?? 1800);

  await saveCache('access_token', token, expiresAt);

  console.log('🔑 Access token expires:', new Date(expiresAt * 1000));

  return token;
}

/*──────────────────────────────────────────────────────────────
  PROXY CALLER
──────────────────────────────────────────────────────────────*/

async function appleFetch(path: string) {
  const token = await getAccessToken();
  const url = `${APPLE}${path}`;

  console.log('[➡ Apple Request]', url);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('[⬅ Apple Response]', res.status);

  if (!res.ok) {
    console.error('🛑 Apple error:', await res.text());
  }

  return res;
}

/*──────────────────────────────────────────────────────────────
  Hono Router
──────────────────────────────────────────────────────────────*/

const app = new Hono().basePath('/maps');

app.use(
  '*',
  cors({
    origin: origin => {
      return isAllowedOrigin(origin) ? origin : null;
    },
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['authorization', 'content-type', 'x-client-info'],
  })
);

// Supabase logs show this!
app.use('*', async (c, next) => {
  console.log(`🌐 ${c.req.method} ${c.req.path}`, c.req.query());
  await next();
});

/*──────────────────────────────────────────────────────────────
  ROUTES
──────────────────────────────────────────────────────────────*/

app.get('/autocomplete', async c => {
  const q = c.req.query('q');
  const bias = c.req.query('userLocation');

  if (!q) return c.json({ error: 'Missing q' }, 400);

  if (USE_MOCK) {
    const results = MOCK_PLACES.filter(
      p => mockMatch(p.name, q) || mockMatch(p.address, q)
    ).map(p => ({
      id: p.id,
      displayLines: [p.name, p.address],
      location: { latitude: p.latitude, longitude: p.longitude },
    }));
    return c.json({ results });
  }

  let path = `/searchAutocomplete?q=${encodeURIComponent(q)}&includePoiCategories=Restaurant,Cafe`;

  if (bias) path += `&userLocation=${encodeURIComponent(bias)}`;

  const res = await appleFetch(path);
  return c.json(await res.json(), res.status);
});

app.get('/details', async c => {
  const id = c.req.query('id');
  if (!id) return c.json({ error: 'Missing id' }, 400);

  if (USE_MOCK) {
    const p = MOCK_PLACES.find(x => x.id === id);
    if (!p) return c.json({ error: 'Not found' }, 404);
    return c.json({
      name: p.name,
      formattedAddressLines: [p.address],
      coordinate: { latitude: p.latitude, longitude: p.longitude },
    });
  }

  const res = await appleFetch(`/place/${encodeURIComponent(id)}`);
  return c.json(await res.json(), res.status);
});

app.get('/geocode', async c => {
  const q = c.req.query('q');
  if (!q) return c.json({ error: 'Missing q' }, 400);

  if (USE_MOCK) {
    const results = MOCK_CITIES.filter(ci => mockMatch(ci.name, q)).map(ci => ({
      name: ci.name,
      formattedAddressLines: [ci.name],
      coordinate: { latitude: ci.latitude, longitude: ci.longitude },
    }));
    return c.json({ results });
  }

  const res = await appleFetch(`/geocode?q=${encodeURIComponent(q)}`);
  return c.json(await res.json(), res.status);
});

app.get('/', c =>
  c.json({
    message: 'Apple Maps proxy running',
    endpoints: ['/maps/autocomplete', '/maps/details', '/maps/geocode'],
  })
);

Deno.serve(app.fetch);
