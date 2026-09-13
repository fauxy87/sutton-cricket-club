(() => {
  const tableBody = document.getElementById('historical-honours-body');
  const search = document.getElementById('honours-search');
  const year = document.getElementById('honours-year');
  const type = document.getElementById('honours-type');
  const clear = document.getElementById('honours-clear');
  const count = document.getElementById('honours-count');
  const summary = document.getElementById('honours-summary');
  const leaderboard = document.getElementById('honours-leaderboard');
  const breakdown = document.getElementById('honours-breakdown');
  if (!tableBody) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const seasonFromDate = value => `20${String(value || '').slice(-2)}`;
  const performanceType = value => {
    const text = String(value || '');
    if (/Field Dismissals/i.test(text)) return 'fielding';
    if (/^\d+ for \d+$/i.test(text)) return 'bowling';
    if (/^\d+\*?$/.test(text)) return 'batting';
    return 'other';
  };

  let records = [];

  const playerCounts = () => {
    const counts = new Map();
    records.forEach(record => counts.set(record.name, (counts.get(record.name) || 0) + 1));
    return [...counts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  };

  const renderLeaderboard = () => {
    if (!leaderboard || !records.length) return;
    leaderboard.innerHTML = playerCounts().slice(0,10).map(([name, entries], index) => `
      <div class="honours-leader-row"><span class="honours-rank">${index + 1}</span><strong>${escapeHtml(name)}</strong><span>${entries} entr${entries === 1 ? 'y' : 'ies'}</span></div>`).join('');
  };

  const renderBreakdown = () => {
    if (!breakdown || !records.length) return;
    const totals = {batting:0,bowling:0,fielding:0};
    records.forEach(record => { const category = performanceType(record.performance); if (category in totals) totals[category] += 1; });
    breakdown.innerHTML = `
      <button type="button" data-type="batting"><strong>${totals.batting}</strong><span>Batting</span></button>
      <button type="button" data-type="bowling"><strong>${totals.bowling}</strong><span>Bowling</span></button>
      <button type="button" data-type="fielding"><strong>${totals.fielding}</strong><span>Fielding</span></button>`;
    breakdown.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
      if (type) type.value = button.dataset.type || 'all';
      render();
      document.getElementById('historical-records')?.scrollIntoView({behavior:'smooth',block:'start'});
    }));
  };

  const renderSummary = () => {
    if (!summary || !records.length) return;
    const entryCounts = new Map();
    const centuryCounts = new Map();
    let highestScore = null;
    let bestBowling = null;
    records.forEach(record => {
      entryCounts.set(record.name, (entryCounts.get(record.name) || 0) + 1);
      const batting = String(record.performance || '').match(/^(\d+)(\*)?$/);
      if (batting) {
        const runs = Number(batting[1]);
        if (!highestScore || runs > highestScore.runs) highestScore = {...record, runs};
        if (runs >= 100) centuryCounts.set(record.name, (centuryCounts.get(record.name) || 0) + 1);
      }
      const bowling = String(record.performance || '').match(/^(\d+) for (\d+)$/i);
      if (bowling) {
        const wickets = Number(bowling[1]);
        const runs = Number(bowling[2]);
        if (!bestBowling || wickets > bestBowling.wickets || (wickets === bestBowling.wickets && runs < bestBowling.runs)) bestBowling = {...record, wickets, runs};
      }
    });
    const topEntry = [...entryCounts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    const topCentury = [...centuryCounts.entries()].sort((a,b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    summary.innerHTML = `
      <article class="archive-summary-card"><span>Most honours entries</span><strong>${escapeHtml(topEntry?.[1] ?? '—')}</strong><p>${escapeHtml(topEntry?.[0] || 'No data')}</p></article>
      <article class="archive-summary-card"><span>Highest score</span><strong>${escapeHtml(highestScore?.performance || '—')}</strong><p>${escapeHtml(highestScore ? `${highestScore.name} v ${highestScore.opposition}` : 'No data')}</p></article>
      <article class="archive-summary-card"><span>Best bowling</span><strong>${escapeHtml(bestBowling?.performance || '—')}</strong><p>${escapeHtml(bestBowling ? `${bestBowling.name} v ${bestBowling.opposition}` : 'No data')}</p></article>
      <article class="archive-summary-card"><span>Most centuries</span><strong>${escapeHtml(topCentury?.[1] ?? '—')}</strong><p>${escapeHtml(topCentury?.[0] || 'No data')}</p></article>`;
  };

  const render = () => {
    const q = String(search?.value || '').trim().toLowerCase();
    const selectedYear = year?.value || 'all';
    const selectedType = type?.value || 'all';
    const filtered = records.filter(record => {
      const season = seasonFromDate(record.date);
      const category = performanceType(record.performance);
      const haystack = `${record.name} ${record.performance} ${record.opposition} ${record.date}`.toLowerCase();
      return (selectedYear === 'all' || season === selectedYear) && (selectedType === 'all' || category === selectedType) && (!q || haystack.includes(q));
    });
    if (count) count.textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'} shown`;
    if (clear) clear.hidden = !q && selectedYear === 'all' && selectedType === 'all';
    tableBody.innerHTML = filtered.length ? filtered.map(record => `
      <tr><td data-label="Year">${escapeHtml(seasonFromDate(record.date))}</td><td data-label="Player"><strong>${escapeHtml(record.name)}</strong></td><td data-label="Performance"><span class="honours-performance">${escapeHtml(record.performance)}</span></td><td data-label="Opposition">${escapeHtml(record.opposition)}</td><td data-label="Date">${escapeHtml(record.date)}</td></tr>`).join('') : '<tr><td colspan="5" class="honours-empty">No honours-board records match those filters.</td></tr>';
  };

  fetch(`data/honours-history.json?v=${Date.now()}`, {cache:'no-store'})
    .then(response => { if (!response.ok) throw new Error('Historical honours data unavailable'); return response.json(); })
    .then(data => {
      records = Array.isArray(data.records) ? data.records.slice() : [];
      records.sort((a,b) => { const [ad,am,ay] = a.date.split('/').map(Number); const [bd,bm,by] = b.date.split('/').map(Number); return new Date(2000 + by,bm-1,bd) - new Date(2000 + ay,am-1,ad); });
      renderSummary(); renderLeaderboard(); renderBreakdown(); render();
    })
    .catch(() => {
      tableBody.innerHTML = '<tr><td colspan="5" class="honours-empty">Historical honours records are temporarily unavailable.</td></tr>';
      if (count) count.textContent = 'Archive unavailable';
      if (summary) summary.innerHTML = '<p class="honours-empty">Archive summary temporarily unavailable.</p>';
      if (leaderboard) leaderboard.innerHTML = '<p class="honours-empty">Leaderboard temporarily unavailable.</p>';
    });

  search?.addEventListener('input', render);
  year?.addEventListener('change', render);
  type?.addEventListener('change', render);
  clear?.addEventListener('click', () => { if (search) search.value=''; if (year) year.value='all'; if (type) type.value='all'; render(); search?.focus(); });
})();
