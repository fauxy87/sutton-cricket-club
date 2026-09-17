(() => {
  const host = document.getElementById('team-player-leaders');
  if (!host) return;

  const page = document.body.dataset.teamPage;
  const teamIds = {
    '1st': ['63723'],
    '2nd': ['63724'],
    'development': ['277600'],
    'women': ['395536', '413277'],
    'u14': ['408696']
  };
  const selectedTeamIds = teamIds[page] || [];
  if (!selectedTeamIds.length) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const playerLink = (id, name) => `<a class="text-link" href="player.html?id=${encodeURIComponent(id)}">${esc(name)}</a>`;
  const isSelectedTeam = value => selectedTeamIds.includes(String(value ?? ''));

  function matchDetails(detail) {
    return Array.isArray(detail?.match_details) ? detail.match_details[0] : (detail?.match_details || detail || {});
  }

  function innings(detail) {
    const md = matchDetails(detail);
    return Array.isArray(md?.innings) ? md.innings : Array.isArray(detail?.innings) ? detail.innings : [];
  }

  function battingTeamId(inn) {
    return String(inn?.team_batting_id ?? inn?.batting_team_id ?? '');
  }

  function matchInvolvesTeam(detail) {
    const md = matchDetails(detail);
    const ids = [md?.home_team_id, md?.away_team_id, md?.home_team?.id, md?.away_team?.id]
      .map(value => String(value ?? '')).filter(Boolean);
    if (ids.some(isSelectedTeam)) return true;
    return innings(detail).some(inn => isSelectedTeam(battingTeamId(inn)));
  }

  function isNotOut(row) {
    const howOut = String(row?.how_out || '').trim().toLowerCase();
    return howOut === 'no' || howOut.includes('not out') || howOut.includes('retired not out');
  }

  function oversToBalls(value) {
    const text = String(value ?? '0');
    const [whole, part = '0'] = text.split('.');
    return (parseInt(whole, 10) || 0) * 6 + (parseInt(part, 10) || 0);
  }

  function ballsToOvers(balls) { return `${Math.floor(balls / 6)}.${balls % 6}`; }

  async function load() {
    try {
      const res = await fetch(`data/play-cricket-scorecards.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Scorecards unavailable');
      const cache = await res.json();
      const scorecards = cache?.matches && typeof cache.matches === 'object' ? cache.matches : cache;
      const batting = new Map();
      const bowling = new Map();

      Object.values(scorecards || {}).forEach(item => {
        const detail = item?.detail || item;
        if (!matchInvolvesTeam(detail)) return;

        innings(detail).forEach(inn => {
          const battingId = battingTeamId(inn);
          if (isSelectedTeam(battingId)) {
            (inn.bat || []).forEach(row => {
              const id = String(row.batsman_id || row.player_id || '');
              if (!id) return;
              const p = batting.get(id) || { id, name: row.batsman_name || row.name || 'Player', runs:0, innings:0, notOuts:0, balls:0, high:0, highText:'0' };
              const runs = Number(row.runs) || 0;
              const balls = Number(row.balls) || 0;
              const notOut = isNotOut(row);
              p.runs += runs; p.innings += 1; p.balls += balls; if (notOut) p.notOuts += 1;
              if (runs > p.high || (runs === p.high && notOut && !p.highText.endsWith('*'))) { p.high = runs; p.highText = `${runs}${notOut ? '*' : ''}`; }
              batting.set(id, p);
            });
          } else if (battingId) {
            (inn.bowl || []).forEach(row => {
              const id = String(row.bowler_id || row.player_id || '');
              if (!id) return;
              const p = bowling.get(id) || { id, name:row.bowler_name || row.name || 'Player', wickets:0, runs:0, balls:0, bestWickets:-1, bestRuns:999, best:'—' };
              const wickets = Number(row.wickets) || 0;
              const runs = Number(row.runs) || 0;
              const balls = oversToBalls(row.overs);
              p.wickets += wickets; p.runs += runs; p.balls += balls;
              if (wickets > p.bestWickets || (wickets === p.bestWickets && runs < p.bestRuns)) { p.bestWickets=wickets; p.bestRuns=runs; p.best=`${wickets}-${runs}`; }
              bowling.set(id, p);
            });
          }
        });
      });

      const batters = [...batting.values()].map(p => { const dismissals=Math.max(0,p.innings-p.notOuts); return {...p,average:dismissals?(p.runs/dismissals).toFixed(2):'—',strikeRate:p.balls?((p.runs/p.balls)*100).toFixed(1):'—'}; });
      const bowlers = [...bowling.values()].map(p => ({...p,overs:ballsToOvers(p.balls),average:p.wickets?(p.runs/p.wickets).toFixed(2):'—',economy:p.balls?(p.runs/(p.balls/6)).toFixed(2):'—'}));
      const topRuns=batters.slice().sort((a,b)=>b.runs-a.runs||b.high-a.high)[0];
      const topWickets=bowlers.slice().sort((a,b)=>b.wickets-a.wickets||a.bestRuns-b.bestRuns)[0];
      const highScore=batters.slice().sort((a,b)=>b.high-a.high||b.runs-a.runs)[0];
      if (!topRuns && !topWickets && !highScore) throw new Error('No team stats found');

      const card=(label,player,value,detail)=>`<article class="season-stat player-leader-card"><span>${esc(label)}</span><strong>${esc(value)}</strong><p>${player?playerLink(player.id,player.name):'—'}</p>${detail?`<small>${esc(detail)}</small>`:''}</article>`;
      host.innerHTML=[
        card('Leading run scorer',topRuns,topRuns?`${topRuns.runs} runs`:'—',topRuns?`${topRuns.innings} inns · Avg ${topRuns.average} · HS ${topRuns.highText}`:''),
        card('Leading wicket taker',topWickets,topWickets?`${topWickets.wickets} wickets`:'—',topWickets?`${topWickets.overs} overs · Avg ${topWickets.average} · Best ${topWickets.best}`:''),
        card('Highest score',highScore,highScore?highScore.highText:'—',highScore?`${highScore.runs} season runs · SR ${highScore.strikeRate}`:'')
      ].join('');
    } catch (err) {
      host.innerHTML='<div class="season-stat"><strong>Stats syncing</strong><span>Team player leaders will appear here automatically.</span></div>';
      console.info('Team player leaders unavailable:',err.message);
    }
  }
  load();
})();
