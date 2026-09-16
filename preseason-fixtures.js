/* Sutton CC pre-season fixture messaging.
 *
 * This is intentionally separate from script.js so the core Play-Cricket
 * renderer remains untouched. It only intervenes when the live data file
 * belongs to a different season from the website's current season.
 */
(() => {
  async function getCurrentSeason() {
    if (window.SUTTON_CC?.currentSeason) return window.SUTTON_CC.currentSeason;

    try {
      await new Promise(resolve => {
        const existing = document.querySelector('script[data-sutton-season-config]');
        if (existing) {
          if (window.SUTTON_CC?.currentSeason) return resolve();
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', resolve, { once: true });
          return;
        }
        const script = document.createElement('script');
        script.src = 'season-config.js';
        script.dataset.suttonSeasonConfig = 'true';
        script.onload = resolve;
        script.onerror = resolve;
        document.head.appendChild(script);
      });
    } catch (_) {}

    return window.SUTTON_CC?.currentSeason || new Date().getFullYear();
  }

  function fixtureMessage(season) {
    return `<article class="result-card"><h3>${season} fixtures coming soon</h3><p>Fixtures will appear here automatically when they are published on Play-Cricket.</p></article>`;
  }

  function resultMessage(season) {
    return `<article class="result-card"><h3>${season} results coming soon</h3><p>Results will appear here automatically once the new season gets under way.</p></article>`;
  }

  function applyPreSeason(season) {
    const fixtureBox = document.getElementById('live-fixtures');
    const resultBox = document.getElementById('live-results');
    const teamFixtures = document.getElementById('team-next-fixtures');
    const teamResults = document.getElementById('team-recent-results');
    const homeNext = document.getElementById('home-next-match');
    const homeResult = document.getElementById('home-latest-result');
    const homeSnapshot = document.getElementById('home-season-snapshot');
    const teamSnapshot = document.getElementById('team-season-snapshot');

    if (fixtureBox) fixtureBox.innerHTML = fixtureMessage(season);
    if (resultBox) resultBox.innerHTML = resultMessage(season);
    if (teamFixtures) teamFixtures.innerHTML = fixtureMessage(season);
    if (teamResults) teamResults.innerHTML = resultMessage(season);

    if (homeNext) {
      homeNext.innerHTML = `<div class="fixture-top"><span class="tag">Next match</span><span>${season}</span></div><h3>Fixtures coming soon</h3><p class="versus">New-season fixtures will appear automatically when Play-Cricket publishes them.</p>`;
    }
    if (homeResult) {
      homeResult.innerHTML = `<div class="fixture-top"><span class="tag">Recent result</span><span>${season}</span></div><h3>New season coming soon</h3><p class="versus">Results will appear here once the ${season} season gets under way.</p>`;
    }
    if (homeSnapshot) {
      homeSnapshot.innerHTML = `<div class="season-stat"><strong>${season}</strong><span>Season data coming soon</span></div>`;
    }
    if (teamSnapshot) {
      teamSnapshot.innerHTML = `<div class="season-stat"><strong>${season}</strong><span>Season data coming soon</span></div>`;
    }

    const statusIds = ['play-cricket-status', 'home-play-cricket-status', 'team-play-cricket-status'];
    statusIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = `${season} Play-Cricket data will appear automatically when published.`;
    });
  }

  async function check() {
    const relevant = document.getElementById('live-fixtures') ||
      document.getElementById('live-results') ||
      document.getElementById('home-next-match') ||
      document.getElementById('team-next-fixtures');
    if (!relevant) return;

    try {
      const [season, response] = await Promise.all([
        getCurrentSeason(),
        fetch(`data/play-cricket.json?v=${Date.now()}`, { cache: 'no-store' })
      ]);
      if (!response.ok) return;
      const data = await response.json();
      if (String(data.season || '') === String(season || '')) return;

      // script.js also loads asynchronously. Apply after it has had time to
      // render, then once more shortly afterwards so stale previous-season
      // content cannot win a race and reappear.
      setTimeout(() => applyPreSeason(season), 150);
      setTimeout(() => applyPreSeason(season), 900);
    } catch (_) {
      // Leave script.js's existing unavailable-data handling in control.
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', check, { once: true });
  } else {
    check();
  }
})();
