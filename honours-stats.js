(() => {
  const leaders = document.getElementById('stats-leaders');
  if (!leaders) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const number = value => Number(value || 0);
  const scoreNumber = value => Number(String(value || '0').replace(/[^0-9].*$/, '')) || 0;
  const bestParts = value => {
    const match = String(value || '').match(/(\d+)\s*[-/]\s*(\d+)/);
    return match ? { wickets:Number(match[1]), runs:Number(match[2]) } : { wickets:0, runs:9999 };
  };
  const player = p => p?.player_id
    ? `<a class="player-profile-link" href="player.html?id=${encodeURIComponent(p.player_id)}">${esc(p.name || 'Player')}</a>`
    : esc(p?.name || 'Player');
  const card = (label, value, p, note='Play-Cricket scorecards') => `
    <article class="record-feature">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
      <h3>${player(p)}</h3>
      <p>${esc(note)}</p>
    </article>`;

  async function load() {
    try {
      const res = await fetch(`data/player-stats.json?v=${Date.now()}`, {cache:'no-store'});
      if (!res.ok) throw new Error('Player statistics unavailable');
      const data = await res.json();
      const batting = Array.isArray(data.batting) ? data.batting : [];
      const bowling = Array.isArray(data.bowling) ? data.bowling : [];
      const fielding = Array.isArray(data.fielding) ? data.fielding : [];
      if (!batting.length && !bowling.length) throw new Error('No player statistics');

      const runScorer = batting.slice().sort((a,b) => number(b.runs)-number(a.runs))[0];
      const wicketTaker = bowling.slice().sort((a,b) => number(b.wickets)-number(a.wickets))[0];
      const highestScore = batting.slice().sort((a,b) => scoreNumber(b.high_score)-scoreNumber(a.high_score))[0];
      const bestBowling = bowling.slice().sort((a,b) => {
        const A=bestParts(a.best), B=bestParts(b.best);
        return B.wickets-A.wickets || A.runs-B.runs;
      })[0];
      const mostSixes = batting.slice().sort((a,b) => number(b.sixes)-number(a.sixes) || number(b.runs)-number(a.runs))[0];
      const mostFours = batting.slice().sort((a,b) => number(b.fours)-number(a.fours) || number(b.runs)-number(a.runs))[0];
      const mostDismissals = fielding.slice().sort((a,b) => number(b.dismissals)-number(a.dismissals) || number(b.catches)-number(a.catches))[0];
      const battingAverage = batting
        .filter(p => number(p.innings)-number(p.not_outs) >= 5 && Number.isFinite(Number(p.average)))
        .sort((a,b) => number(b.average)-number(a.average) || number(b.runs)-number(a.runs))[0];
      const bowlingAverage = bowling
        .filter(p => number(p.wickets) >= 10 && Number.isFinite(Number(p.average)))
        .sort((a,b) => number(a.average)-number(b.average) || number(b.wickets)-number(a.wickets))[0];

      const cards = [
        card('Leading run scorer', runScorer?.runs ?? '—', runScorer, 'runs'),
        card('Leading wicket taker', wicketTaker?.wickets ?? '—', wicketTaker, 'wickets'),
        card('Highest individual score', highestScore?.high_score ?? '—', highestScore),
        card('Best bowling figures', bestBowling?.best ?? '—', bestBowling),
        card('Most sixes', mostSixes?.sixes ?? '—', mostSixes, 'sixes'),
        card('Most fours', mostFours?.fours ?? '—', mostFours, 'fours'),
        card('Best batting average', battingAverage?.average ?? '—', battingAverage, 'Minimum 5 dismissals'),
        card('Best bowling average', bowlingAverage?.average ?? '—', bowlingAverage, 'Minimum 10 wickets')
      ];
      if (mostDismissals) {
        const detail = `${number(mostDismissals.catches)} catches · ${number(mostDismissals.stumpings)} stumpings`;
        cards.push(card('Most dismissals', mostDismissals.dismissals ?? '—', mostDismissals, detail));
      } else {
        cards.push(`
          <article class="record-feature">
            <span>Most dismissals</span>
            <strong>—</strong>
            <h3>Fielding data unavailable</h3>
            <p>Waiting for the next fielding statistics sync.</p>
          </article>`);
      }
      leaders.innerHTML = cards.join('');
    } catch (err) {
      console.info('Expanded honours statistics unavailable:', err.message);
    }
  }

  load();
})();
