// functions/maps/index.ts
import { cors } from 'https://deno.land/x/hono@v4.2.9/middleware/cors/index.ts';
import { Hono } from 'https://deno.land/x/hono@v4.2.9/mod.ts';
import { generateAppleMapsJWT } from './jwt.ts';

const APPLE_MAPS_BASE = 'https://maps-api.apple.com/v1';

// CORS origins allowed
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://cup-trail.github.io',
  'capacitor://localhost',
  'http://localhost',
];

// Token cache (in-memory)
let cachedToken: string | null = null;
let cachedExpiry: number | null = null;

/**
 * Load JWT (cached for 7 days per Apple rules)
 */
async function getAppleMapsToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);

  if (cachedToken && cachedExpiry && now < cachedExpiry) {
    return cachedToken;
  }

  const jwt = await generateAppleMapsJWT();

  // Decode expiration
  const [, payloadB64] = jwt.split('.');
  const json = JSON.parse(
    atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
  );

  cachedToken = jwt;
  cachedExpiry = json.exp;

  return jwt;
}

/**
 * Shared fetch helper
 */
async function appleFetch(path: string, token: string) {
  const url = `${APPLE_MAPS_BASE}${path}`;
  console.log('[AppleMaps] →', url);

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    console.error('[AppleMaps Error]', res.status, await res.text());
  }

  return res;
}

// ------------------------------
// Hono Setup
// ------------------------------
const app = new Hono();

// Enable CORS
app.use(
  '*',
  cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'OPTIONS'],
    allowHeaders: ['authorization', 'content-type', 'x-client-info'],
  })
);

// ------------------------------
// Routes
// ------------------------------

/**
 * /autocomplete
 * ?search_text=latte&user_coord=37.77,-122.41
 */
app.get('/autocomplete', async c => {
  const q = c.req.query('search_text');
  const userCoord = c.req.query('user_coord'); // optional location bias

  if (!q) return c.json({ error: 'Missing search_text' }, 400);

  const token = await getAppleMapsToken();

  let path = `/searchAutocomplete?q=${encodeURIComponent(q)}&includePoiCategories=Restaurant,Cafe`;

  if (userCoord) {
    path += `&userLocation=${encodeURIComponent(userCoord)}`;
  }

  const res = await appleFetch(path, token);
  return c.json(await res.json());
});

/**
 * /details
 * ?place_id=IC123...
 */
app.get('/details', async c => {
  const placeId = c.req.query('place_id');
  if (!placeId) return c.json({ error: 'Missing place_id' }, 400);

  const token = await getAppleMapsToken();

  const res = await appleFetch(`/place/${encodeURIComponent(placeId)}`, token);
  return c.json(await res.json());
});

/**
 * /geocode
 * ?search_text=San Francisco
 */
app.get('/geocode', async c => {
  const q = c.req.query('search_text');
  if (!q) return c.json({ error: 'Missing search_text' }, 400);

  const token = await getAppleMapsToken();

  const res = await appleFetch(`/geocode?q=${encodeURIComponent(q)}`, token);
  return c.json(await res.json());
});

// Default route
app.get('/', c =>
  c.json({
    message: 'Apple Maps API proxy for autocomplete/details/geocode.',
    endpoints: ['/autocomplete', '/details', '/geocode'],
  })
);

// Export for Supabase Edge Function
Deno.serve(app.fetch);
