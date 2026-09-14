import crypto from 'node:crypto';
import { stateCookie } from '../lib/session.js';

const PUBLIC_ORIGIN = 'https://www.suttoncambscc.co.uk';

export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    res.status(500).send('GitHub login is not configured yet.');
    return;
  }

  const state = crypto.randomBytes(24).toString('hex');
  const callback = `${PUBLIC_ORIGIN}/api/callback`;
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('redirect_uri', callback);
  url.searchParams.set('scope', 'read:user');
  url.searchParams.set('state', state);
  res.setHeader('Set-Cookie', stateCookie(state));
  res.redirect(url.toString());
}
