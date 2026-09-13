(() => {
  const target = document.getElementById('player-career-highlights');
  if (!target) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const id = new URLSearchParams(location.search).get('id');
  if (!id) return;

  Promise.all([
    fetch(`data/player-stats.json?v=${Date.now()}`, {cache:'no-store'}),
    fetch(`data/honours-history.json?v=${Date.now()}`, {cache:'no-store'})
  ]).then(async ([statsRes, honoursRes]) => {
    if (!statsRes.ok || !honoursRes.ok) return;
    const stats = await statsRes.json();
    const honours = await honoursRes.json();
    const allPlayers = [...(stats.batting || []), ...(stats.bowling || [])];
    const player = allPlayers.find(p => String(p.player_id || '') === String(id));
    const name = String(player?.name || '').trim();
    if (!name) return;

    const items = (honours.records || []).filter(r => String(r.name || '').trim().toLowerCase() === name.toLowerCase());
    if (!items.length) return;

    let highScore = null;
    let bestBowling = null;
    let centuries = 0;
    let fiveFors = 0;

    items.forEach(record => {
      const batting = String(record.performance || '').match(/^(\d+)(\*)?$/);
      if (batting) {
        const runs = Number(batting[1]);
        if (!highScore || runs > highScore.runs) highScore = {...record, runs};
        if (runs >= 100) centuries += 1;
      }

      const bowling = String(record.performance || '').match(/^(\d+) for (\d+)$/i);
      if (bowling) {
        const wickets = Number(bowling[1]);
        const runs = Number(bowling[2]);
        if (wickets >= 5) fiveFors += 1;
        if (!bestBowling || wickets > bestBowling.wickets || (wickets === bestBowling.wickets && runs < bestBowling.runs)) {
          bestBowling = {...record, wickets, runs};
        }
      }
    });

    const cards = [];
    if (highScore) cards.push(`<div><span>Honours high score</span><strong>${escapeHtml(highScore.performance)}</strong><small>v ${escapeHtml(highScore.opposition)}</small></div>`);
    if (bestBowling) cards.push(`<div><span>Honours best bowling</span><strong>${escapeHtml(bestBowling.performance)}</strong><small>v ${escapeHtml(bestBowling.opposition)}</small></div>`);
    if (centuries) cards.push(`<div><span>Centuries recorded</span><strong>${centuries}</strong><small>Honours-board hundreds</small></div>`);
    if (fiveFors) cards.push(`<div><span>Five-wicket hauls</span><strong>${fiveFors}</strong><small>5+ wickets recorded</small></div>`);

    if (!cards.length) return;
    target.innerHTML = `<div class="career-highlight-heading"><span>Historical career highlights</span></div><div class="career-highlight-grid">${cards.join('')}</div>`;
    target.hidden = false;
  }).catch(() => {});
})();
