import crypto from 'node:crypto';

const COOKIE_NAME = 'sutton_admin_session';

function b64url(input) {
  return Buffer.from(input).toString('base64url');
}

export function signSession(payload) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  const body = b64url(JSON.stringify(payload));
  const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifySession(value) {
  try {
    if (!value) return null;
    const secret = process.env.SESSION_SECRET;
    if (!secret) return null;
    const [body, sig] = value.split('.');
    if (!body || !sig) return null;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function readCookie(req, name = COOKIE_NAME) {
  const header = req.headers.cookie || '';
  const entry = header.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`));
  return entry ? decodeURIComponent(entry.slice(name.length + 1)) : '';
}

export function sessionCookie(value, maxAge = 60 * 60 * 8) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function stateCookie(value, maxAge = 600) {
  return `sutton_admin_state=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function readStateCookie(req) {
  return readCookie(req, 'sutton_admin_state');
}

export function clearStateCookie() {
  return 'sutton_admin_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
}
