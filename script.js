const button = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

if (button && nav) {
  button.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
  });
  const closeNav = () => {
    nav.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  };
  document.querySelectorAll('.main-nav a').forEach(link => link.addEventListener('click', closeNav));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && nav.classList.contains('open')) {
      closeNav();
      button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (nav.classList.contains('open') && !nav.contains(event.target) && !button.contains(event.target)) closeNav();
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const SUTTON_SITE_ID = '6168';
const SUTTON_TEAM_IDS = new Set(['63723','63724','277600','408696','395536','413277']);

function teamKey(name = '') {
  const n = String(name).trim().toLowerCase();

  if (n.includes('development') || n.includes('sunday')) return 'development';
  if (n.includes('u14') || n.includes('under 14')) return 'u14';
  if (
    n.includes('women') ||
    n.includes('womens') ||
    n.includes("women's") ||
    n.includes('girls') ||
    n.includes('hardball') ||
    n.includes('softball')
  ) return 'women';
  if (n.includes('1st xi') || n === '1st') return '1st';
  if (n.includes('2nd xi') || n === '2nd') return '2nd';

  return 'other';
}

function suttonTeamName(item = {}) {
  const homeTeamId = String(item.home_team_id || item.home_team?.id || '');
  const awayTeamId = String(item.away_team_id || item.away_team?.id || '');

  if (String(item.home_club_id || '') === SUTTON_SITE_ID || SUTTON_TEAM_IDS.has(homeTeamId)) {
    return item.home_team_name || '';
  }
  if (String(item.away_club_id || '') === SUTTON_SITE_ID || SUTTON_TEAM_IDS.has(awayTeamId)) {
    return item.away_team_name || '';
  }

  const homeClub = String(item.home_club_name || '').trim().toLowerCase();
  const awayClub = String(item.away_club_name || '').trim().toLowerCase();
  const homeTeam = String(item.home_team_name || '').trim().toLowerCase();
  const awayTeam = String(item.away_team_name || '').trim().toLowerCase();
  const clubLooksLikeSutton = value => value.includes('sutton cc') || value.includes('sutton cricket club');
  const teamLooksLikeSutton = value => /^sutton(?:\s+cc)?(?:|\s|&)/.test(value);

  if (clubLooksLikeSutton(homeClub) || teamLooksLikeSutton(homeTeam)) return item.home_team_name || '';
  if (clubLooksLikeSutton(awayClub) || teamLooksLikeSutton(awayTeam)) return item.away_team_name || '';

  return '';
}

function itemTeamKey(item = {}) { return teamKey(suttonTeamName(item)); }

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
  const direct = r[`${side}_team_score`] ?? r[`${side}_score`] ?? r[`${side}_innings_score`];
  if (direct !== undefined && direct !== null && String(direct).trim() !== '') return String(direct).trim();

  const runs = r[`${side}_team_runs`] ?? r[`${side}_runs`] ?? r[`${side}_innings_runs`];
  const wickets = r[`${side}_team_wickets`] ?? r[`${side}_wickets`] ?? r[`${side}_innings_wickets`];
  const overs = r[`${side}_team_overs`] ?? r[`${side}_overs`] ?? r[`${side}_innings_overs`];
  if (runs === undefined || runs === null || runs === '') return '';

  let s = String(runs).trim();
  if (wickets !== undefined && wickets !== null && String(wickets).trim() !== '') s += `/${String(wickets).trim()}`;
  if (overs !== undefined && overs !== null && String(overs).trim() !== '') s += ` (${String(overs).trim()})`;
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
  box.innerHTML = `<div class="fixture-top"><span class="tag">Recent result</span><span>${escapeHtml(r.match_date || '')}</span></div><h3>${escapeHtml(resultDescription(r) || 'Latest result')}</h3><p class="versus">${escapeHtml(home)}${hs ? ' ' + escapeHtml(hs) : ''} <strong>—</strong> ${escapeHtml(away)}${as ? ' ' + escapeHtml(as) : ''}</p><p class="fixture-meta">Synced from Play-Cricket</p>`;
}

function uniqueCompetitionCount(items) {
  return new Set(items.map(x => x.competition_name).filter(Boolean)).size;
}

function renderSnapshot(el, results, upcoming, teams, teamPage = false) {
  if (!el) return;
  const competitions = uniqueCompetitionCount([...results, ...upcoming]);
  const thirdCard = teamPage
    ? `<div class="season-stat"><strong>${results.length + upcoming.length}</strong><span>Matches listed</span></div>`
    : `<div class="season-stat"><strong>${teams}</strong><span>Active teams</span></div>`;
  el.innerHTML = `
    <div class="season-stat"><strong>${results.length}</strong><span>Results recorded</span></div>
    <div class="season-stat"><strong>${upcoming.length}</strong><span>Fixtures remaining</span></div>
    ${thirdCard}
    <div class="season-stat"><strong>${competitions}</strong><span>Competitions</span></div>`;
}

function unavailableCard(title = 'Play-Cricket data unavailable') {
  return `<article class="result-card"><h3>${escapeHtml(title)}</h3><p>Please try again shortly. The website will refresh automatically after the next successful sync.</p></article>`;
}

async function loadPlayCricket() {
  const fixtureBox = document.getElementById('live-fixtures');
  const resultBox = document.getElementById('live-results');
  const homeNext = document.getElementById('home-next-match');
  const homeResult = document.getElementById('home-latest-result');
  const teamPageKey = document.body.dataset.teamPage;
  const teamFixtures = document.getElementById('team-next-fixtures');
  const teamResults = document.getElementById('team-recent-results');
  const homeSnapshot = document.getElementById('home-season-snapshot');
  const teamSnapshot = document.getElementById('team-season-snapshot');
  if (!fixtureBox && !resultBox && !homeNext && !homeResult && !teamPageKey && !homeSnapshot) return;

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

    if (fixtureBox) fixtureBox.innerHTML = allUpcoming.length ? allUpcoming.slice(0, 18).map(fixtureCard).join('') : '<article class="result-card"><h3>No upcoming fixtures found</h3><p>There are no future fixtures currently published in Play-Cricket.</p></article>';
    if (resultBox) resultBox.innerHTML = allResults.length ? allResults.slice(0, 18).map(resultCard).join('') : '<article class="result-card"><h3>No results found</h3><p>No completed results are currently published in Play-Cricket.</p></article>';

    if (homeNext) {
      if (allUpcoming[0]) formatHomeFixture(allUpcoming[0]);
      else homeNext.innerHTML = '<div class="fixture-top"><span class="tag">Next match</span><span>Play-Cricket</span></div><h3>No upcoming fixture</h3><p class="versus">No future fixture is currently published.</p>';
    }
    if (homeResult) {
      if (allResults[0]) formatHomeResult(allResults[0]);
      else homeResult.innerHTML = '<div class="fixture-top"><span class="tag">Recent result</span><span>Play-Cricket</span></div><h3>No recent result</h3><p class="versus">No completed result is currently published.</p>';
    }

    const activeTeams = new Set([...(data.matches || []), ...allResults].map(itemTeamKey).filter(k => k !== 'other')).size;
    renderSnapshot(homeSnapshot, allResults, allUpcoming, activeTeams);

    const stamp = data.generated_at ? new Date(data.generated_at).toLocaleString('en-GB') : 'recently';
    const status = document.getElementById('play-cricket-status');
    if (status) status.innerHTML = `<span class="status-dot"></span>Synced from Play-Cricket · ${escapeHtml(stamp)}`;
    const homeStatus = document.getElementById('home-play-cricket-status');
    if (homeStatus) homeStatus.textContent = `Fixtures and results last synced from Play-Cricket: ${stamp}`;

    if (teamPageKey) {
      const upcoming = allUpcoming.filter(m => itemTeamKey(m) === teamPageKey);
      const results = allResults.filter(r => itemTeamKey(r) === teamPageKey);
      if (teamFixtures) teamFixtures.innerHTML = upcoming.length ? upcoming.slice(0,3).map(fixtureCard).join('') : '<article class="result-card"><h3>No upcoming fixtures</h3><p>No future fixtures are currently published for this team.</p></article>';
      if (teamResults) teamResults.innerHTML = results.length ? results.slice(0,3).map(resultCard).join('') : '<article class="result-card"><h3>No recent results</h3><p>No results are currently available for this team.</p></article>';
      renderSnapshot(teamSnapshot, results, upcoming, 1, true);
      const teamStatus = document.getElementById('team-play-cricket-status');
      if (teamStatus) teamStatus.textContent = `Play-Cricket data · last synced ${stamp}`;
    }

    activateTeamFilters();
  } catch (err) {
    if (fixtureBox) fixtureBox.innerHTML = unavailableCard();
    if (resultBox) resultBox.innerHTML = unavailableCard();
    if (teamFixtures) teamFixtures.innerHTML = unavailableCard();
    if (teamResults) teamResults.innerHTML = unavailableCard();
    if (homeNext) homeNext.innerHTML = '<div class="fixture-top"><span class="tag">Next match</span><span>Play-Cricket</span></div><h3>Fixture data unavailable</h3><p class="versus">Please try again shortly.</p>';
    if (homeResult) homeResult.innerHTML = '<div class="fixture-top"><span class="tag">Recent result</span><span>Play-Cricket</span></div><h3>Result data unavailable</h3><p class="versus">Please try again shortly.</p>';
    if (homeSnapshot) homeSnapshot.innerHTML = '<div class="season-stat"><strong>—</strong><span>Season data temporarily unavailable</span></div>';
    if (teamSnapshot) teamSnapshot.innerHTML = '<div class="season-stat"><strong>—</strong><span>Season data temporarily unavailable</span></div>';

    const status = document.getElementById('play-cricket-status');
    if (status) status.textContent = 'Play-Cricket data is temporarily unavailable.';
    const homeStatus = document.getElementById('home-play-cricket-status');
    if (homeStatus) homeStatus.textContent = 'Play-Cricket data is temporarily unavailable.';
    const teamStatus = document.getElementById('team-play-cricket-status');
    if (teamStatus) teamStatus.textContent = 'Play-Cricket data is temporarily unavailable.';

    console.info('Play-Cricket sync not active yet:', err.message);
  }
}
loadPlayCricket();

function statValue(v, suffix='') {
  return (v === null || v === undefined || v === '') ? '—' : `${v}${suffix}`;
}

async function loadPlayerStats() {
  const battingBox = document.getElementById('batting-leaders');
  const bowlingBox = document.getElementById('bowling-leaders');
  const leadersBox = document.getElementById('stats-leaders');
  const milestoneBox = document.getElementById('milestone-board');
  const status = document.getElementById('stats-status');
  if (!battingBox && !bowlingBox && !leadersBox && !milestoneBox) return;

  try {
    const res = await fetch(`data/player-stats.json?v=${Date.now()}`, {cache:'no-store'});
    if (!res.ok) throw new Error('Statistics have not been generated yet');
    const data = await res.json();
    const batting = Array.isArray(data.batting) ? data.batting.slice() : [];
    const bowling = Array.isArray(data.bowling) ? data.bowling.slice() : [];
    const highScoreNumber = value => {
      const n = parseInt(String(value ?? '').replace(/[^0-9-]/g, ''), 10);
      return Number.isFinite(n) ? n : 0;
    };
    const numberValue = value => {
      const n = Number(value);
      return Number.isFinite(n) ? n : 0;
    };
    const averageValue = value => {
      const n = Number(value);
      return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
    };
    const battingByRuns = batting.slice().sort((a,b) => numberValue(b.runs) - numberValue(a.runs) || highScoreNumber(b.high_score) - highScoreNumber(a.high_score) || String(a.name || '').localeCompare(String(b.name || '')));
    const bowlingByWickets = bowling.slice().sort((a,b) => numberValue(b.wickets) - numberValue(a.wickets) || averageValue(a.average) - averageValue(b.average) || String(a.name || '').localeCompare(String(b.name || '')));
    const battingByHighScore = batting.slice().sort((a,b) => highScoreNumber(b.high_score) - highScoreNumber(a.high_score) || numberValue(b.runs) - numberValue(a.runs) || String(a.name || '').localeCompare(String(b.name || '')));

    if (leadersBox) {
      const topBat = battingByRuns[0];
      const topBowl = bowlingByWickets[0];
      const topHigh = battingByHighScore[0];
      leadersBox.innerHTML = `
        <article class="record-feature"><span>Leading run scorer</span><strong>${escapeHtml(topBat?.runs ?? '—')}</strong><h3>${escapeHtml(topBat?.name || 'No data yet')}</h3><p>High score ${escapeHtml(topBat?.high_score || '—')}</p></article>
        <article class="record-feature"><span>Leading wicket taker</span><strong>${escapeHtml(topBowl?.wickets ?? '—')}</strong><h3>${escapeHtml(topBowl?.name || 'No data yet')}</h3><p>Best ${escapeHtml(topBowl?.best || '—')}</p></article>
        <article class="record-feature"><span>Highest score</span><strong>${escapeHtml(topHigh?.high_score || '—')}</strong><h3>${escapeHtml(topHigh?.name || 'No data yet')}</h3><p>From synced scorecards</p></article>`;
    }

    if (battingBox) {
      battingBox.innerHTML = battingByRuns.slice(0,10).map((p,i)=>`<div class="stat-row"><span><strong>${i+1}. ${escapeHtml(p.name)}</strong><small>${p.innings} inns · HS ${escapeHtml(p.high_score)}</small></span><span><strong>${p.runs}</strong><small>Avg ${statValue(p.average)} · SR ${statValue(p.strike_rate)}</small></span></div>`).join('') || '<div class="stat-row"><span>No batting data yet</span></div>';
    }

    if (bowlingBox) {
      bowlingBox.innerHTML = bowlingByWickets.slice(0,10).map((p,i)=>`<div class="stat-row"><span><strong>${i+1}. ${escapeHtml(p.name)}</strong><small>${escapeHtml(p.overs)} overs · Best ${escapeHtml(p.best)}</small></span><span><strong>${p.wickets}</strong><small>Avg ${statValue(p.average)} · Econ ${statValue(p.economy)}</small></span></div>`).join('') || '<div class="stat-row"><span>No bowling data yet</span></div>';
    }

    if (milestoneBox) {
      const milestones = battingByHighScore.filter(p => highScoreNumber(p.high_score) >= 50).slice(0,8);
      milestoneBox.innerHTML = milestones.length ? milestones.map(p=>`<div class="board-row"><span>${escapeHtml(p.name)}</span><strong>${escapeHtml(p.high_score)} high score</strong></div>`).join('') : '<div class="board-row"><span>No 50+ scores found yet</span><strong>2026</strong></div>';
    }

    if (status) {
      const stamp = data.generated_at ? new Date(data.generated_at).toLocaleString('en-GB') : 'recently';
      status.textContent = `${data.scorecards_processed || 0} scorecards processed · updated ${stamp}`;
    }
  } catch (err) {
    if (status) status.textContent = 'Statistics will appear after the next Play-Cricket sync.';
    console.info('Player stats not active yet:', err.message);
  }
}
loadPlayerStats();

/* Sutton CC social links */
(() => {
  const footerContainer = document.querySelector('footer .container');
  if (!footerContainer || footerContainer.querySelector('.site-social-links')) return;
  const social = document.createElement('nav');
  social.className = 'site-social-links';
  social.setAttribute('aria-label', 'Sutton Cricket Club social media');
  social.innerHTML = '<a href="https://www.facebook.com/suttoncricketclub" target="_blank" rel="noopener">Facebook</a><a href="https://www.instagram.com/suttoncricketclub1887/" target="_blank" rel="noopener">Instagram</a><a href="https://x.com/SuttonCCcambs" target="_blank" rel="noopener">X</a>';
  footerContainer.appendChild(social);
})();
