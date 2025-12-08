// functions/maps/index.ts
console.log('Apple Maps Edge Function booting…');

import { cors } from 'https://deno.land/x/hono@v4.2.9/middleware/cors/index.ts';
import { Hono } from 'https://deno.land/x/hono@v4.2.9/mod.ts';
import {
  SignJWT,
  importPKCS8,
} from 'https://deno.land/x/jose@v4.14.4/index.ts';

/*──────────────────────────────────────────────────────────────
  Apple Maps Constants
──────────────────────────────────────────────────────────────*/
const APPLE = 'https://maps-api.apple.com/v1';

/*──────────────────────────────────────────────────────────────
  ENV VARS
──────────────────────────────────────────────────────────────*/
const TEAM_ID = Deno.env.get('APPLE_MAPS_TEAM_ID')!; // iss
const KEY_ID = Deno.env.get('APPLE_MAPS_KEY_ID')!; // kid
const PRIVATE_KEY_PEM = Deno.env.get('APPLE_MAPS_PRIVATE_KEY')!;

/*──────────────────────────────────────────────────────────────
  CORS Allowed Origins
──────────────────────────────────────────────────────────────*/
const ORIGINS = [
  'http://localhost:5173',
  'http://localhost',
  'https://cup-trail.github.io',
  'capacitor://localhost',
];

/*──────────────────────────────────────────────────────────────
  CACHE — SIGNING JWT (7 days) + ACCESS TOKEN (30 mins)
──────────────────────────────────────────────────────────────*/

// 7-day signing JWT
let cachedSigningJWT: string | null = null;
let signingExp: number | null = null;

// 30-minute access token
let cachedAccessToken: string | null = null;
let accessTokenExp: number | null = null;

/*──────────────────────────────────────────────────────────────
  Create 7-day signing JWT
──────────────────────────────────────────────────────────────*/
async function getSigningJWT(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedSigningJWT && signingExp && now < signingExp) {
    return cachedSigningJWT;
  }

  console.log('Generating new signing JWT…');

  const key = await importPKCS8(PRIVATE_KEY_PEM, 'ES256');

  const jwt = await new SignJWT({
    iss: TEAM_ID,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
    origin: '*',
  })
    .setProtectedHeader({
      alg: 'ES256',
      kid: KEY_ID,
      typ: 'JWT',
    })
    .sign(key);

  // decode exp
  const [, payloadB64] = jwt.split('.');
  const payload = JSON.parse(
    atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
  );

  cachedSigningJWT = jwt;
  signingExp = payload.exp;

  console.log('Signing JWT valid until:', new Date(signingExp * 1000));

  return jwt;
}

/*──────────────────────────────────────────────────────────────
  Exchange signing JWT → access token (valid 30 minutes)
──────────────────────────────────────────────────────────────*/
async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedAccessToken && accessTokenExp && now < accessTokenExp) {
    return cachedAccessToken;
  }

  console.log('Fetching new 30-minute access token…');

  const signingJWT = await getSigningJWT();

  const res = await fetch(`${APPLE}/token`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${signingJWT}` },
  });

  if (!res.ok) {
    console.error('Unable to fetch access token:', await res.text());
    throw new Error('Failed to get access token');
  }

  const data = await res.json();

  cachedAccessToken = data.accessToken;
  accessTokenExp = Math.floor(Date.now() / 1000) + data.expiresInSeconds;

  console.log('Access token valid for', data.expiresInSeconds, 'seconds');

  return cachedAccessToken!;
}

/*──────────────────────────────────────────────────────────────
  Helper: Proxy Apple Maps with correct Bearer token
──────────────────────────────────────────────────────────────*/
async function appleFetch(path: string) {
  const token = await getAccessToken();
  const url = `${APPLE}${path}`;
  console.log('[➡ Apple API]', url);

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  console.log('[⬅ Apple Response]', res.status);

  if (!res.ok) {
    console.error('Apple Error:', await res.text());
  }

  return res;
}

/*──────────────────────────────────────────────────────────────
  Hono Setup
──────────────────────────────────────────────────────────────*/
const app = new Hono().basePath('/maps');

// CORS
app.use(
  '*',
  cors({
    origin: ORIGINS,
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['authorization', 'content-type', 'x-client-info'],
  })
);

// Logging
app.use('*', async (c, next) => {
  console.log(`🌐 ${c.req.method} ${c.req.path}`, c.req.query());
  await next();
});

/*──────────────────────────────────────────────────────────────
  ROUTES
──────────────────────────────────────────────────────────────*/

// /maps/autocomplete?q=latte&userLocation=37.77,-122.41
app.get('/autocomplete', async c => {
  const q = c.req.query('q');
  const bias = c.req.query('userLocation');

  if (!q) return c.json({ error: 'Missing q' }, 400);

  let path =
    `/searchAutocomplete?q=${encodeURIComponent(q)}` +
    `&includePoiCategories=Restaurant,Cafe`;

  if (bias) path += `&userLocation=${encodeURIComponent(bias)}`;

  const res = await appleFetch(path);
  return c.json(await res.json(), res.status);
});

// /maps/details?id=IC123
app.get('/details', async c => {
  const id = c.req.query('id');
  if (!id) return c.json({ error: 'Missing id' }, 400);

  const res = await appleFetch(`/place/${encodeURIComponent(id)}`);
  return c.json(await res.json(), res.status);
});

// /maps/geocode?q=San Francisco
app.get('/geocode', async c => {
  const q = c.req.query('q');
  if (!q) return c.json({ error: 'Missing q' }, 400);

  const res = await appleFetch(`/geocode?q=${encodeURIComponent(q)}`);
  return c.json(await res.json(), res.status);
});

// Default
app.get('/', c =>
  c.json({
    ok: true,
    message: 'Apple Maps proxy running',
    endpoints: ['/maps/autocomplete', '/maps/details', '/maps/geocode'],
  })
);

Deno.serve(app.fetch);
