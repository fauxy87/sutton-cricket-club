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

function teamKey(name = '') {
  const n = String(name).toLowerCase();
  if (n.includes('1st')) return '1st';
  if (n.includes('2nd')) return '2nd';
  if (n.includes('development') || n.includes('sunday')) return 'development';
  if (n.includes('women') || n.includes('womens') || n.includes("women's")) return 'women';
  if (n.includes('u14') || n.includes('under 14')) return 'u14';
  return 'all';
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
  return [club, team].filter(Boolean).join(' ');
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

async function loadPlayCricket() {
  const fixtureBox = document.getElementById('live-fixtures');
  const resultBox = document.getElementById('live-results');
  if (!fixtureBox && !resultBox) return;

  try {
    const res = await fetch(`data/play-cricket.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('No synced data yet');
    const data = await res.json();
    const now = new Date();
    now.setHours(0,0,0,0);

    if (fixtureBox) {
      const upcoming = (data.matches || [])
        .filter(m => String(m.status || '').toLowerCase() !== 'deleted' && parseUKDate(m.match_date) >= now)
        .sort((a,b) => parseUKDate(a.match_date) - parseUKDate(b.match_date))
        .slice(0, 12);

      fixtureBox.innerHTML = upcoming.length ? upcoming.map(m => {
        const home = sideLabel(m.home_club_name, m.home_team_name);
        const away = sideLabel(m.away_club_name, m.away_team_name);
        const key = teamKey(`${m.home_team_name || ''} ${m.away_team_name || ''}`);
        return `<article class="result-card" data-team="${key}"><span class="tag">${escapeHtml(m.match_date || '')}${m.match_time ? ' · ' + escapeHtml(m.match_time) : ''}</span><h3>${escapeHtml(home)} v ${escapeHtml(away)}</h3><p>${escapeHtml(m.ground_name || m.competition_name || 'Venue to be confirmed')}</p></article>`;
      }).join('') : '<article class="result-card"><h3>No upcoming fixtures found</h3><p>Play-Cricket is connected, but there are no future fixtures in the current season data.</p></article>';
    }

    if (resultBox) {
      const results = (data.results || [])
        .filter(r => String(r.status || '').toLowerCase() !== 'deleted')
        .sort((a,b) => parseUKDate(b.match_date) - parseUKDate(a.match_date))
        .slice(0, 12);

      if (results.length) {
        resultBox.innerHTML = results.map(r => {
          const home = sideLabel(r.home_club_name, r.home_team_name);
          const away = sideLabel(r.away_club_name, r.away_team_name);
          const hs = scoreText(r, 'home');
          const as = scoreText(r, 'away');
          const key = teamKey(`${r.home_team_name || ''} ${r.away_team_name || ''}`);
          const result = r.result_description || r.result || r.result_text || r.result_summary || '';
          const scoreline = `${home}${hs ? ' ' + hs : ''} — ${away}${as ? ' ' + as : ''}`;
          return `<article class="result-card" data-team="${key}"><span class="tag">${escapeHtml(r.match_date || '')}</span><h3>${escapeHtml(scoreline)}</h3><p>${escapeHtml(result || r.competition_name || '')}</p></article>`;
        }).join('');
      }
    }

    const status = document.getElementById('play-cricket-status');
    if (status) {
      const stamp = data.generated_at ? new Date(data.generated_at).toLocaleString('en-GB') : 'recently';
      status.innerHTML = `<span class="status-dot"></span>Live from Play-Cricket · ${escapeHtml(stamp)}`;
    }
    activateTeamFilters();
  } catch (err) {
    console.info('Play-Cricket sync not active yet:', err.message);
  }
}
loadPlayCricket();