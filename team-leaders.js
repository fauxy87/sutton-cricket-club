(() => {
  const host = document.getElementById('team-player-leaders');
  if (!host) return;

  const page = document.body.dataset.teamPage;
  const teamIds = { '1st': '63723', '2nd': '63724' };
  const teamId = teamIds[page];
  if (!teamId) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const playerLink = (id, name) => `<a href="player.html?id=${encodeURIComponent(id)}">${esc(name)}</a>`;
  const numScore = score => parseInt(String(score || '0').replace(/\D/g, ''), 10) || 0;

  function innings(detail) {
    const md = Array.isArray(detail?.match_details) ? detail.match_details[0] : detail?.match_details;
    return Array.isArray(md?.innings) ? md.innings : Array.isArray(detail?.innings) ? detail.innings : [];
  }

  function battingTeamId(inn) {
    return String(inn?.team_batting_id ?? inn?.batting_team_id ?? '');
  }

  function oppositionTeamId(inn) {
    return String(inn?.team_bowling_id ?? inn?.bowling_team_id ?? '');
  }

  async function load() {
    try {
      const res = await fetch(`data/play-cricket-scorecards.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Scorecards unavailable');
      const cache = await res.json();
      const batting = new Map();
      const bowling = new Map();

      Object.values(cache || {}).forEach(item => {
        const detail = item?.detail || item;
        innings(detail).forEach(inn => {
          if (battingTeamId(inn) === teamId) {
            (inn.bat || []).forEach(row => {
              const id = String(row.batsman_id || row.player_id || '');
              if (!id) return;
              const p = batting.get(id) || { id, name: row.batsman_name || row.name || 'Player', runs: 0, high: 0, highText: '0' };
              const runs = Number(row.runs) || 0;
              p.runs += runs;
              if (runs > p.high) {
                p.high = runs;
                const notOut = String(row.how_out || '').toLowerCase() === 'no';
                p.highText = `${runs}${notOut ? '*' : ''}`;
              }
              batting.set(id, p);
            });
          }
          if (oppositionTeamId(inn) === teamId || (battingTeamId(inn) && battingTeamId(inn) !== teamId)) {
            (inn.bowl || []).forEach(row => {
              const id = String(row.bowler_id || row.player_id || '');
              if (!id) return;
              const p = bowling.get(id) || { id, name: row.bowler_name || row.name || 'Player', wickets: 0 };
              p.wickets += Number(row.wickets) || 0;
              bowling.set(id, p);
            });
          }
        });
      });

      const topRuns = [...batting.values()].sort((a,b) => b.runs - a.runs)[0];
      const topWickets = [...bowling.values()].sort((a,b) => b.wickets - a.wickets)[0];
      const highScore = [...batting.values()].sort((a,b) => b.high - a.high)[0];
      if (!topRuns && !topWickets && !highScore) throw new Error('No team stats found');

      const card = (label, player, value) => `<article class="season-stat player-leader-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><p>${player ? playerLink(player.id, player.name) : '—'}</p></article>`;
      host.innerHTML = [
        card('Leading run scorer', topRuns, topRuns ? `${topRuns.runs} runs` : '—'),
        card('Leading wicket taker', topWickets, topWickets ? `${topWickets.wickets} wickets` : '—'),
        card('Highest score', highScore, highScore ? highScore.highText : '—')
      ].join('');
    } catch (err) {
      host.innerHTML = '<div class="season-stat"><strong>Stats syncing</strong><span>Team player leaders will appear here automatically.</span></div>';
    }
  }

  load();
})();
