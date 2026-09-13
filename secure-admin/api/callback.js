import { clearStateCookie, readStateCookie, sessionCookie, signSession } from '../lib/session.js';

export default async function handler(req, res) {
  try {
    const { code, state } = req.query || {};
    const expectedState = readStateCookie(req);
    if (!code || !state || !expectedState || state !== expectedState) {
      res.status(400).send('Login could not be verified. Please try again.');
      return;
    }

    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    const appUrl = process.env.APP_URL;
    if (!clientId || !clientSecret || !appUrl) {
      res.status(500).send('GitHub login is not configured yet.');
      return;
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, state })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) throw new Error('GitHub did not return an access token');

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${tokenData.access_token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'Sutton-CC-Admin'
      }
    });
    if (!userResponse.ok) throw new Error('Could not read GitHub account');
    const user = await userResponse.json();
    const allowed = (process.env.ALLOWED_GITHUB_LOGIN || 'fauxy87').toLowerCase();
    if (String(user.login || '').toLowerCase() !== allowed) {
      res.status(403).send('This GitHub account is not authorised for Sutton Cricket Club admin.');
      return;
    }

    const expires = Date.now() + 8 * 60 * 60 * 1000;
    const session = signSession({ login: user.login, id: user.id, avatar: user.avatar_url, exp: expires });
    res.setHeader('Set-Cookie', [sessionCookie(session), clearStateCookie()]);
    res.redirect('/api/dashboard');
  } catch (error) {
    res.status(500).send('GitHub login failed. Please return to the login page and try again.');
  }
}
