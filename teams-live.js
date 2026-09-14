(() => {
  const host = document.getElementById('teams-live-snapshot');
  if (!host) return;

  const teams = [
    { key:'1st', name:'1st XI', href:'team-1st-xi.html', ids:['63723'] },
    { key:'2nd', name:'2nd XI', href:'team-2nd-xi.html', ids:['63724'] },
    { key:'development', name:'Development XI', href:'team-development.html', ids:['277600'] },
    { key:'women', name:'Women’s Cricket', href:'team-women.html', ids:['395536','413277'] },
    { key:'u14', name:'U14s', href:'team-u14.html', ids:['408696'] }
  ];

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const rows = data => Array.isArray(data) ? data : Array.isArray(data?.matches) ? data.matches : Array.isArray(data?.result_summary) ? data.result_summary : Array.isArray(data?.results) ? data.results : [];
  const val = (m, ...keys) => keys.map(k => m?.[k]).find(v => v !== undefined && v !== null && String(v).trim() !== '');
  const id = v => String(v ?? '');
  const matchId = m => id(val(m,'id','match_id'));
  const teamIds = m => [val(m,'home_team_id','home_club_team_id'), val(m,'away_team_id','away_club_team_id')].map(id);
  const dateValue = m => val(m,'match_date','date','match_date_time','start_date') || '';
  const dateObj = m => {
    const raw = String(dateValue(m) || '').trim();
    const uk = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (uk) return new Date(Number(uk[3]), Number(uk[2]) - 1, Number(uk[1]));
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  };
  const resultText = m => val(m,'result','result_description','result_text','match_result','result_summary') || 'Result recorded';
  const opposition = (m, ids) => {
    const homeId = id(val(m,'home_team_id','home_club_team_id'));
    const awayId = id(val(m,'away_team_id','away_club_team_id'));
    const home = val(m,'home_team_name','home_team','home_club_name') || 'Home';
    const away = val(m,'away_team_name','away_team','away_club_name') || 'Away';
    if (ids.includes(homeId)) return away;
    if (ids.includes(awayId)) return home;
    return `${home} v ${away}`;
  };
  const formatDate = m => { const d = dateObj(m); return d ? d.toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : ''; };
  const dedupe = items => {
    const map = new Map();
    items.forEach(item => {
      const key = matchId(item) || [dateValue(item), ...teamIds(item)].join('|');
      const previous = map.get(key);
      if (!previous || resultText(item) !== 'Result recorded') map.set(key,item);
    });
    return [...map.values()];
  };

  async function load() {
    try {
      const res = await fetch(`data/play-cricket.json?v=${Date.now()}`, {cache:'no-store'});
      if (!res.ok) throw new Error('Play-Cricket data unavailable');
      const data = await res.json();
      const matches = dedupe([...rows(data.matches), ...rows(data.results), ...rows(data.result_summary)]);
      const today = new Date();
      today.setHours(0,0,0,0);

      host.innerHTML = teams.map(team => {
        const relevant = matches.filter(m => teamIds(m).some(x => team.ids.includes(x)));
        const completed = relevant.filter(m => resultText(m) !== 'Result recorded' || /result|won|lost|tied|abandon|cancel/i.test(String(val(m,'status','match_status')||'')));
        const future = relevant.filter(m => { const d=dateObj(m); return d && d >= today && resultText(m) === 'Result recorded'; }).sort((a,b)=>dateObj(a)-dateObj(b));
        const past = completed.filter(m => { const d=dateObj(m); return !d || d < today || resultText(m) !== 'Result recorded'; }).sort((a,b)=>(dateObj(b)?.getTime()||0)-(dateObj(a)?.getTime()||0));
        const latest = past[0];
        const next = future[0];
        const played = past.length;

        return `<a class="team-live-card" href="${team.href}">
          <div class="team-live-head"><span class="team-live-dot" aria-hidden="true"></span><strong>${esc(team.name)}</strong><b aria-hidden="true">→</b></div>
          <div class="team-live-metrics"><div><span>Results</span><strong>${played}</strong></div><div><span>${next ? 'Next' : 'Latest'}</span><strong>${esc(next ? formatDate(next) : latest ? formatDate(latest) : '—')}</strong></div></div>
          <p>${next ? `Next: ${esc(opposition(next,team.ids))}` : latest ? `${esc(opposition(latest,team.ids))} · ${esc(resultText(latest))}` : 'Season data will appear here when available.'}</p>
          <span class="team-live-link">Open team dashboard</span>
        </a>`;
      }).join('');
    } catch (err) {
      host.innerHTML = teams.map(team => `<a class="team-live-card" href="${team.href}"><div class="team-live-head"><span class="team-live-dot" aria-hidden="true"></span><strong>${esc(team.name)}</strong><b aria-hidden="true">→</b></div><p>Open the team page for fixtures, results and season information.</p><span class="team-live-link">Open team dashboard</span></a>`).join('');
    }
  }
  load();
})();