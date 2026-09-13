import crypto from 'node:crypto';
import { stateCookie } from '../lib/session.js';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const appUrl = process.env.APP_URL;
  if (!clientId || !appUrl) {
    res.status(500).send('GitHub login is not configured yet.');
    return;
  }

  const canonical = new URL(appUrl);
  const forwardedHost = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  if (forwardedHost && forwardedHost.toLowerCase() !== canonical.host.toLowerCase()) {
    res.redirect(302, `${canonical.origin}/api/login`);
    return;
  }

  const state = crypto.randomBytes(24).toString('hex');
  const callback = `${canonical.origin}/api/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  res.setHeader('Set-Cookie', stateCookie(state));
  res.redirect(url.toString());
}
