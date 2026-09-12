(() => {
  const host = document.getElementById('home-league-positions');
  if (!host) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const teamIds = { '1st': '63723', '2nd': '63724' };
  const teamLabels = { '1st': '1st XI', '2nd': '2nd XI' };
  const teamPages = { '1st': 'team-1st-xi.html', '2nd': 'team-2nd-xi.html' };

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

  async function load() {
    try {
      const res = await fetch(`data/league-tables.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('League data unavailable');
      const data = await res.json();
      host.innerHTML = ['1st', '2nd'].map(key => renderCard(key, data.tables?.[key])).join('');
    } catch (err) {
      host.innerHTML = '<div class="season-stat"><strong>League positions syncing</strong><span>Latest standings will appear here automatically.</span></div>';
    }
  }

  load();
})();
