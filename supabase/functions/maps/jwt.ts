export async function generateAppleMapsJWT() {
  const privateKeyPem = Deno.env.get('APPLE_MAPS_PRIVATE_KEY')!;
  const teamId = Deno.env.get('APPLE_MAPS_TEAM_ID')!; // iss
  const keyId = Deno.env.get('APPLE_MAPS_KEY_ID')!; // kid
  const mapsId = Deno.env.get('APPLE_MAPS_MAP_ID')!; // sub
  // Convert PEM → CryptoKey
  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKeyPem),
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 7 * 24 * 60 * 60, // 7 days
    sub: mapsId,
    aud: 'https://maps-api.apple.com',
  };

  const header = {
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT',
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));

  const toSign = `${encodedHeader}.${encodedPayload}`;

  const signature = await crypto.subtle.sign(
    {
      name: 'ECDSA',
      hash: 'SHA-256',
    },
    privateKey,
    new TextEncoder().encode(toSign)
  );

  const jwt = `${toSign}.${base64urlEncode(signature)}`;
  return jwt;
}

// helpers
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s/g, '');
  const raw = atob(b64);
  const buffer = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; ++i) buffer[i] = raw.charCodeAt(i);
  return buffer.buffer;
}

function base64urlEncode(data: string | ArrayBuffer): string {
  let bytes: Uint8Array;

  if (typeof data === 'string') {
    bytes = new TextEncoder().encode(data);
  } else {
    bytes = new Uint8Array(data);
  }

  let base64 = btoa(String.fromCharCode(...bytes));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
