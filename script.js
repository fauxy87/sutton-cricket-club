const button = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

if (button && nav) {
  button.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
  });
  document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    });
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const SUTTON_SITE_ID = '6168';

function teamKey(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('1st xi') || n === '1st') return '1st';
  if (n.includes('2nd xi') || n === '2nd') return '2nd';
  if (n.includes('development') || n.includes('sunday')) return 'development';
  if (n.includes('u14') || n.includes('under 14')) return 'u14';
  if (n.includes('women') || n.includes('womens') || n.includes("women's") || n.includes('girls')) return 'women';
  return 'other';
}

function suttonTeamName(item = {}) {
  if (String(item.home_club_id || '') === SUTTON_SITE_ID) return item.home_team_name || '';
  if (String(item.away_club_id || '') === SUTTON_SITE_ID) return item.away_team_name || '';
  return '';
}

function itemTeamKey(item = {}) {
  return teamKey(suttonTeamName(item));
}

function activateTeamFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  if (!filterButtons.length) return;
  filterButtons.forEach(btn => {
    btn.onclick = () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const selected = btn.dataset.team;
      document.querySelectorAll('[data-team]:not(.filter-btn)').forEach(item => {
        item.hidden = selected !== 'all' && item.dataset.team !== selected;
      });
    };
  });
}
activateTeamFilters();

const newsFilters = document.querySelectorAll('.news-filter');
if (newsFilters.length) {
  const newsCards = document.querySelectorAll('[data-news-card]');
  newsFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      newsFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.news;
      newsCards.forEach(card => { card.hidden = cat !== 'all' && card.dataset.newsCard !== cat; });
    });
  });
}

function parseUKDate(value) {
  if (!value) return new Date(0);
  const bits = String(value).split('/').map(Number);
  if (bits.length === 3) return new Date(bits[2], bits[1] - 1, bits[0]);
  return new Date(value);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function sideLabel(club, team) {
  const c = String(club || '').replace(' CC, Cambs', '').replace(' CC', '').trim();
  return [c, team].filter(Boolean).join(' ');
}

function scoreText(r, side) {
  const runs = r[`${side}_team_runs`] ?? r[`${side}_runs`];
  const wickets = r[`${side}_team_wickets`] ?? r[`${side}_wickets`];
  const overs = r[`${side}_team_overs`] ?? r[`${side}_overs`];
  if (runs === undefined || runs === null || runs === '') return '';
  let s = String(runs);
  if (wickets !== undefined && wickets !== null && wickets !== '') s += `/${wickets}`;
  if (overs !== undefined && overs !== null && overs !== '') s += ` (${overs})`;
  return s;
}

function resultDescription(r) {
  return r.result_description || r.result || r.result_text || r.result_summary || r.competition_name || '';
}

function fixtureCard(m) {
  const home = sideLabel(m.home_club_name, m.home_team_name);
  const away = sideLabel(m.away_club_name, m.away_team_name);
  const meta = [m.ground_name, m.competition_name].filter(Boolean).join(' · ') || 'Venue to be confirmed';
  return `<article class="result-card" data-team="${itemTeamKey(m)}"><span class="tag">${escapeHtml(m.match_date || '')}${m.match_time ? ' · ' + escapeHtml(m.match_time) : ''}</span><h3>${escapeHtml(home)} v ${escapeHtml(away)}</h3><p>${escapeHtml(meta)}</p></article>`;
}

function resultCard(r) {
  const home = sideLabel(r.home_club_name, r.home_team_name);
  const away = sideLabel(r.away_club_name, r.away_team_name);
  const hs = scoreText(r, 'home');
  const as = scoreText(r, 'away');
  const scoreline = `${home}${hs ? ' ' + hs : ''} — ${away}${as ? ' ' + as : ''}`;
  return `<article class="result-card" data-team="${itemTeamKey(r)}"><span class="tag">${escapeHtml(r.match_date || '')}</span><h3>${escapeHtml(scoreline)}</h3><p>${escapeHtml(resultDescription(r))}</p></article>`;
}

function formatHomeFixture(m) {
  const box = document.getElementById('home-next-match');
  if (!box || !m) return;
  const home = sideLabel(m.home_club_name, m.home_team_name);
  const away = sideLabel(m.away_club_name, m.away_team_name);
  const team = suttonTeamName(m) || 'Sutton CC';
  box.innerHTML = `<div class="fixture-top"><span class="tag">Next match</span><span>${escapeHtml(m.match_date || '')}</span></div><h3>${escapeHtml(team)}</h3><p class="versus">${escapeHtml(home)} <strong>v</strong> ${escapeHtml(away)}</p><p class="fixture-meta">${escapeHtml([m.ground_name, m.match_time].filter(Boolean).join(' · ') || m.competition_name || 'Details on Play-Cricket')}</p>`;
}

function formatHomeResult(r) {
  const box = document.getElementById('home-latest-result');
  if (!box || !r) return;
  const home = sideLabel(r.home_club_name, r.home_team_name);
  const away = sideLabel(r.away_club_name, r.away_team_name);
  const hs = scoreText(r, 'home');
  const as = scoreText(r, 'away');
  box.innerHTML = `<div class="fixture-top"><span class="tag">Recent result</span><span>${escapeHtml(r.match_date || '')}</span></div><h3>${escapeHtml(resultDescription(r) || 'Latest result')}</h3><p class="versus">${escapeHtml(home)}${hs ? ' ' + escapeHtml(hs) : ''} <strong>—</strong> ${escapeHtml(away)}${as ? ' ' + escapeHtml(as) : ''}</p><p class="fixture-meta">Live from Play-Cricket</p>`;
}

async function loadPlayCricket() {
  const fixtureBox = document.getElementById('live-fixtures');
  const resultBox = document.getElementById('live-results');
  const homeNext = document.getElementById('home-next-match');
  const homeResult = document.getElementById('home-latest-result');
  const teamPageKey = document.body.dataset.teamPage;
  const teamFixtures = document.getElementById('team-next-fixtures');
  const teamResults = document.getElementById('team-recent-results');
  if (!fixtureBox && !resultBox && !homeNext && !homeResult && !teamPageKey) return;

  try {
    const res = await fetch(`data/play-cricket.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No synced data yet');
    const data = await res.json();
    const today = new Date();
    today.setHours(0,0,0,0);

    const allUpcoming = (data.matches || [])
      .filter(m => String(m.status || '').toLowerCase() !== 'deleted' && parseUKDate(m.match_date) >= today)
      .sort((a,b) => parseUKDate(a.match_date) - parseUKDate(b.match_date));
    const allResults = (data.results || [])
      .filter(r => String(r.status || '').toLowerCase() !== 'deleted')
      .sort((a,b) => parseUKDate(b.match_date) - parseUKDate(a.match_date));

    if (fixtureBox) {
      fixtureBox.innerHTML = allUpcoming.length ? allUpcoming.slice(0, 18).map(fixtureCard).join('') : '<article class="result-card"><h3>No upcoming fixtures found</h3><p>There are no future fixtures currently published in Play-Cricket.</p></article>';
    }
    if (resultBox && allResults.length) resultBox.innerHTML = allResults.slice(0, 18).map(resultCard).join('');

    if (homeNext) {
      if (allUpcoming[0]) formatHomeFixture(allUpcoming[0]);
      else homeNext.innerHTML = '<div class="fixture-top"><span class="tag">Next match</span><span>Play-Cricket</span></div><h3>No upcoming fixture</h3><p class="versus">No future fixture is currently published.</p>';
    }
    if (homeResult && allResults[0]) formatHomeResult(allResults[0]);

    const stamp = data.generated_at ? new Date(data.generated_at).toLocaleString('en-GB') : 'recently';
    const status = document.getElementById('play-cricket-status');
    if (status) status.innerHTML = `<span class="status-dot"></span>Live from Play-Cricket · ${escapeHtml(stamp)}`;
    const homeStatus = document.getElementById('home-play-cricket-status');
    if (homeStatus) homeStatus.textContent = `Fixtures and results last synced from Play-Cricket: ${stamp}`;

    if (teamPageKey) {
      const upcoming = allUpcoming.filter(m => itemTeamKey(m) === teamPageKey).slice(0, 3);
      const results = allResults.filter(r => itemTeamKey(r) === teamPageKey).slice(0, 3);
      if (teamFixtures) teamFixtures.innerHTML = upcoming.length ? upcoming.map(fixtureCard).join('') : '<article class="result-card"><h3>No upcoming fixtures</h3><p>No future fixtures are currently published for this team.</p></article>';
      if (teamResults) teamResults.innerHTML = results.length ? results.map(resultCard).join('') : '<article class="result-card"><h3>No recent results</h3><p>No results are currently available for this team.</p></article>';
      const teamStatus = document.getElementById('team-play-cricket-status');
      if (teamStatus) teamStatus.textContent = `Live Play-Cricket data · last synced ${stamp}`;
    }

    activateTeamFilters();
  } catch (err) {
    console.info('Play-Cricket sync not active yet:', err.message);
  }
}
loadPlayCricket();