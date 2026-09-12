(() => {
  const board = document.getElementById('milestone-board');
  if (!board) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

  const label = kind => ({
    '50': '50',
    '100': '100',
    '4W': '4 wickets',
    '5W': '5 wickets'
  }[kind] || kind || 'Milestone');

  function playerName(item) {
    if (!item.player_id) return esc(item.player || 'Player');
    return `<a href="player.html?id=${encodeURIComponent(item.player_id)}">${esc(item.player || 'Player')}</a>`;
  }

  function matchLink(item) {
    const opponent = item.opponent ? ` v ${esc(item.opponent)}` : '';
    const date = item.date ? ` · ${esc(item.date)}` : '';
    if (!item.match_id) return `${opponent}${date}`;
    return ` <a class="milestone-match-link" href="match.html?id=${encodeURIComponent(item.match_id)}">${opponent}${date}</a>`;
  }

  async function load() {
    try {
      const res = await fetch(`data/milestones.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Milestone data unavailable');
      const data = await res.json();
      const items = Array.isArray(data.milestones) ? data.milestones : [];

      if (!items.length) {
        board.innerHTML = '<div class="board-row"><span>No 50s, 100s or 4+ wicket hauls found yet</span><strong>2026</strong></div>';
        return;
      }

      board.innerHTML = items.map(item => `
        <div class="board-row milestone-row">
          <span>
            <strong>${playerName(item)}</strong>
            <small>${esc(item.team || 'Sutton CC')}${matchLink(item)}</small>
          </span>
          <strong class="milestone-value"><span>${esc(label(item.kind))}</span>${esc(item.value || '')}</strong>
        </div>`).join('');
    } catch (err) {
      console.info('Detailed milestones not active yet:', err.message);
    }
  }

  load();
})();
