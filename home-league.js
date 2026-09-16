(() => {
  const host = document.getElementById('home-league-positions');
  if (!host) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const teamIds = { '1st': '63723', '2nd': '63724' };
  const teamLabels = { '1st': '1st XI', '2nd': '2nd XI' };
  const teamPages = { '1st': 'team-1st-xi.html', '2nd': 'team-2nd-xi.html' };

  function loadSeasonConfig() {
    if (window.SUTTON_CC?.currentSeason) return Promise.resolve();

    return new Promise(resolve => {
      const existing = document.querySelector('script[data-sutton-season-config]');
      if (existing) {
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
  }

  function updateSeasonLabels(fallbackSeason) {
    const season = window.SUTTON_CC?.currentSeason || fallbackSeason;
    if (!season) return;

    document.querySelectorAll('.section-heading').forEach(heading => {
      const title = heading.querySelector('h2')?.textContent.trim();
      const eyebrow = heading.querySelector('.eyebrow');
      if (!eyebrow) return;
      if (title === 'League positions') eyebrow.textContent = `${season} standings`;
      if (title === 'Player leaders') eyebrow.textContent = `${season} statistics`;
    });
  }

  function findColumn(headings, wanted) {
    const entries = Object.entries(headings || {});
    const match = entries.find(([, label]) => String(label || '').trim().toLowerCase() === wanted.toLowerCase());
    return match ? match[0] : null;
  }

  function renderCard(key, table) {
    if (!table || table.error) {
      return `<article class="season-stat"><span>${teamLabels[key]}</span><strong>—</strong><span>League position syncing</span></article>`;
    }

    const row = (table.values || []).find(item => String(item.team_id || '') === teamIds[key]);
    if (!row) {
      return `<article class="season-stat"><span>${teamLabels[key]}</span><strong>—</strong><span>${esc(table.name || 'League table')}</span></article>`;
    }

    const playedKey = findColumn(table.headings, 'p');
    const pointsKey = findColumn(table.headings, 'Pts');
    const played = playedKey ? row[playedKey] : '';
    const points = pointsKey ? row[pointsKey] : '';
    const meta = [played ? `${played} played` : '', points ? `${points} pts` : ''].filter(Boolean).join(' · ');

    return `<a class="season-stat" href="${teamPages[key]}"><span>${teamLabels[key]}</span><strong>${esc(row.position || '—')}</strong><span>${esc(table.name || '')}</span>${meta ? `<small>${esc(meta)}</small>` : ''}<b>View full table →</b></a>`;
  }

  function hasPublishedTable(data) {
    return ['1st', '2nd'].some(key => {
      const table = data.tables?.[key];
      return table && !table.error && Array.isArray(table.values) && table.values.length > 0;
    });
  }

  function renderPreSeason(season) {
    const safeSeason = esc(season || 'New season');
    host.innerHTML = `<div class="season-stat"><strong>${safeSeason} season</strong><span>League tables will appear here automatically when Play-Cricket publishes them.</span></div>`;
  }

  async function load() {
    try {
      const [res] = await Promise.all([
        fetch(`data/league-tables.json?v=${Date.now()}`, { cache: 'no-store' }),
        loadSeasonConfig()
      ]);
      if (!res.ok) throw new Error('League data unavailable');
      const data = await res.json();
      const currentSeason = window.SUTTON_CC?.currentSeason || data.season;
      updateSeasonLabels(currentSeason);

      if (String(data.season || '') !== String(currentSeason || '') || !hasPublishedTable(data)) {
        renderPreSeason(currentSeason);
        return;
      }

      host.innerHTML = ['1st', '2nd'].map(key => renderCard(key, data.tables?.[key])).join('');
    } catch (err) {
      updateSeasonLabels();
      const season = window.SUTTON_CC?.currentSeason;
      host.innerHTML = `<div class="season-stat"><strong>${esc(season ? `${season} season` : 'League positions')}</strong><span>Latest standings will appear here automatically when they are available.</span></div>`;
    }
  }

  load();
})();
