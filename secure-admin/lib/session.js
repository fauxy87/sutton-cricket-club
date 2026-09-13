import crypto from 'node:crypto';

const COOKIE_NAME = 'sutton_admin_session';

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not configured');
  return crypto.createHash('sha256').update(secret).digest();
}

export function signSession(payload) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const plaintext = Buffer.from(JSON.stringify(payload), 'utf8');
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString('base64url'), encrypted.toString('base64url'), tag.toString('base64url')].join('.');
}

export function verifySession(value) {
  try {
    if (!value) return null;
    const [ivPart, dataPart, tagPart] = String(value).split('.');
    if (!ivPart || !dataPart || !tagPart) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(ivPart, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagPart, 'base64url'));
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataPart, 'base64url')),
      decipher.final()
    ]);
    const payload = JSON.parse(decrypted.toString('utf8'));
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
