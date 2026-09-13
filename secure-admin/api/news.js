import { readCookie, verifySession } from '../lib/session.js';

const REPO = 'fauxy87/sutton-cricket-club';
const BRANCH = 'main';
const NEWS_PATH = 'data/news.json';
const API = `https://api.github.com/repos/${REPO}/contents`;

const categoryLabels = {
  club: 'Club News',
  match: 'Match Report',
  community: 'Community',
  juniors: 'Juniors',
  women: 'Women & Girls',
  event: 'Events'
};

function ghHeaders() {
  const token = process.env.GITHUB_PUBLISH_TOKEN;
  if (!token) throw new Error('Publishing is not configured yet');
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Sutton-CC-Admin'
  };
}

async function getFile(path) {
  const response = await fetch(`${API}/${path}?ref=${BRANCH}`, { headers: ghHeaders(), cache: 'no-store' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`GitHub could not read ${path}`);
  return response.json();
}

async function putFile(path, base64Content, message, sha) {
  const body = { message, content: base64Content, branch: BRANCH };
  if (sha) body.sha = sha;
  const response = await fetch(`${API}/${path}`, {
    method: 'PUT',
    headers: { ...ghHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`GitHub publish failed: ${response.status} ${detail.slice(0, 180)}`);
  }
  return response.json();
}

function decodeJson(file) {
  const text = Buffer.from(String(file.content || '').replace(/\n/g, ''), 'base64').toString('utf8');
  return JSON.parse(text);
}

function safeSlug(value) {
  return String(value || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70);
}

function defaultLinks(category) {
  if (category === 'match') return [{ label: 'Fixtures & results', href: 'fixtures.html' }, { label: 'Player statistics', href: 'honours.html' }];
  if (category === 'juniors') return [{ label: 'Junior cricket', href: 'juniors.html' }, { label: 'Contact the club', href: 'join.html' }];
  if (category === 'women') return [{ label: 'Women’s cricket', href: 'team-women.html' }, { label: 'Contact the club', href: 'join.html' }];
  return [{ label: 'More club news', href: 'news.html' }, { label: 'Contact the club', href: 'join.html' }];
}

function cleanArticle(input, existing, id) {
  const category = Object.hasOwn(categoryLabels, input.category) ? input.category : 'club';
  const article = {
    id,
    title: String(input.title || '').trim().slice(0, 120),
    date: String(input.date || '').trim(),
    category,
    category_label: categoryLabels[category],
    summary: String(input.summary || '').trim().slice(0, 280),
    lead: String(input.lead || '').trim(),
    body: Array.isArray(input.body) ? input.body.map(v => String(v).trim()).filter(Boolean) : [],
    links: existing?.links || defaultLinks(category)
  };
  const team = String(input.team || '').trim();
  if (team) article.team = team.slice(0, 80);
  if (existing?.image && !input.remove_image) article.image = existing.image;
  if (existing?.image_alt && !input.remove_image) article.image_alt = existing.image_alt;
  if (input.image_alt && !input.remove_image) article.image_alt = String(input.image_alt).trim().slice(0, 160);
  if (!article.title || !/^\d{4}-\d{2}-\d{2}$/.test(article.date) || !article.summary || !article.lead) {
    throw new Error('Headline, date, summary and opening paragraph are required');
  }
  return article;
}

function parseImage(image, articleId) {
  if (!image) return null;
  const type = String(image.type || '').toLowerCase();
  const allowed = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
  const ext = allowed[type];
  if (!ext) throw new Error('Picture must be JPG, PNG or WebP');
  const data = String(image.data || '').replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  if (!data || data.length > 3_500_000) throw new Error('Picture is too large');
  return { path: `assets/news/${articleId}.${ext}`, data };
}

export default async function handler(req, res) {
  const session = verifySession(readCookie(req));
  if (!session) {
    res.status(401).json({ error: 'Please sign in again.' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const file = await getFile(NEWS_PATH);
      if (!file) throw new Error('News file was not found');
      const data = decodeJson(file);
      res.status(200).json({ articles: Array.isArray(data.articles) ? data.articles : [], updated_at: data.updated_at || '' });
      return;
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const file = await getFile(NEWS_PATH);
    if (!file) throw new Error('News file was not found');
    const data = decodeJson(file);
    const articles = Array.isArray(data.articles) ? data.articles : [];

    if (payload.action === 'delete') {
      const id = String(payload.id || '');
      const existing = articles.find(a => a.id === id);
      if (!existing) throw new Error('Story was not found');
      const next = articles.filter(a => a.id !== id);
      const output = { updated_at: new Date().toISOString().slice(0, 10), articles: next };
      await putFile(NEWS_PATH, Buffer.from(JSON.stringify(output, null, 2) + '\n').toString('base64'), `Delete news: ${existing.title}`, file.sha);
      res.status(200).json({ ok: true, message: 'Story deleted and website update started.' });
      return;
    }

    if (payload.action !== 'save') throw new Error('Unknown publishing action');

    const originalId = String(payload.original_id || '');
    const existing = originalId ? articles.find(a => a.id === originalId) : null;
    let id = existing?.id || safeSlug(payload.article?.title);
    if (!id) id = `news-${Date.now()}`;
    if (!existing) {
      const used = new Set(articles.map(a => a.id));
      const base = id;
      let suffix = 2;
      while (used.has(id)) id = `${base}-${suffix++}`;
    }

    const article = cleanArticle(payload.article || {}, existing, id);
    const image = parseImage(payload.image, id);
    if (image) {
      const existingImageFile = await getFile(image.path);
      await putFile(image.path, image.data, `Upload news image: ${article.title}`, existingImageFile?.sha);
      article.image = image.path;
      article.image_alt = String(payload.article?.image_alt || article.title).trim().slice(0, 160);
    }

    const next = existing
      ? articles.map(a => a.id === originalId ? article : a)
      : [article, ...articles];
    const output = { updated_at: new Date().toISOString().slice(0, 10), articles: next };
    await putFile(NEWS_PATH, Buffer.from(JSON.stringify(output, null, 2) + '\n').toString('base64'), `${existing ? 'Update' : 'Publish'} news: ${article.title}`, file.sha);
    res.status(200).json({ ok: true, article, message: existing ? 'Story updated. The website will refresh shortly.' : 'Story published. The website will refresh shortly.' });
  } catch (error) {
    res.status(500).json({ error: error.message || 'Publishing failed' });
  }
}
