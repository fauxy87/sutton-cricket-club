const confirmed2027={
 '1st':{name:'CCA Junior League 2 North',url:'https://cambhuntpremierleague.play-cricket.com/website/division/143915',teams:['Fen Ditton CC','Telugu Association of Cambridge CC','Cam Kerala CC','Sutton CC, Cambs','Cambridge NCI CC','Cam Valley CC','Coton CC','Fordham CC','Milton CC, Cambs']},
 '2nd':{name:'CCA Junior League 4 North',url:'https://cambhuntpremierleague.play-cricket.com/website/division/143938',teams:['Sutton CC, Cambs','City of Ely CC','Cherry Hinton CC','St Ives Town & Warboys CC','Burwell & Exning CC','Wimblington CC','Cottenham CC','Isleham CC','Milton CC, Cambs']}
};
function show2027Preseason(box,team){
 const division=confirmed2027[team];
 const rows=division.teams.map((name,i)=>`<tr class="${name.startsWith('Sutton CC')?'sutton-row':''}"><td><span class="league-position-badge">${i+1}</span></td><td>${ltEscape(name)}</td><td>0</td><td>0</td><td>0</td><td>0</td></tr>`).join('');
 box.innerHTML=`<article class="league-table-card"><div class="league-table-head"><div><p class="eyebrow dark">2027 · Pre-season table</p><h3>${ltEscape(division.name)}</h3><p>Cambridgeshire &amp; Huntingdonshire Premier League</p></div><span class="tag">All teams start on 0 points</span></div><div class="league-table-wrap"><table class="league-table"><thead><tr><th>Pos*</th><th>Team</th><th>P</th><th>W</th><th>L</th><th>Pts</th></tr></thead><tbody>${rows}</tbody></table></div><div class="league-table-note">*The order is the published pre-season listing, not a sporting ranking. No matches have been played. <a href="${division.url}" target="_blank" rel="noopener noreferrer">View official Play-Cricket table →</a></div></article>`;
}
function ltEscape(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

async function loadLeagueTable(){
  const box=document.getElementById('league-table');
  if(!box)return;
  const team=document.body.dataset.teamPage;
  if(team!=='1st'&&team!=='2nd')return;
  const now=new Date();
  const activeSeason=window.SUTTON_CC?.currentSeason || (now.getMonth()>=2?now.getFullYear():now.getFullYear()-1);
  // Show the published 2027 allocations throughout the winter, without relabelling 2026 results.
  if(activeSeason<2027){show2027Preseason(box,team);return;}
  try{
    const res=await fetch(`data/league-tables.json?v=${Date.now()}`,{cache:'no-store'});
    if(!res.ok)throw new Error('League table data has not synced yet');
    const data=await res.json();
    const table=(data.tables||{})[team];
    const expectedSeason=activeSeason;
    if(Number(data.season)!==Number(expectedSeason)){
      if(expectedSeason===2027){show2027Preseason(box,team);return;}
      box.innerHTML=`<article class="league-table-card"><div class="league-table-loading"><h3>${expectedSeason} standings coming soon</h3><p>Waiting for the current season's league table data.</p></div></article>`;
      return;
    }
    if(!table||table.error){if(expectedSeason===2027){show2027Preseason(box,team);return;}throw new Error(table?.error||'League table not found');}
    const headings=table.headings||{};
    const values=table.values||[];
    const cols=Object.keys(headings).sort((a,b)=>Number(a.split('_')[1])-Number(b.split('_')[1]));
    const rows=values.map(row=>{
      const isSutton=String(row.team_id||'')===(team==='1st'?'63723':'63724')||String(row.column_1||'').toLowerCase().includes('sutton');
      return `<tr class="${isSutton?'sutton-row':''}"><td><span class="league-position-badge">${ltEscape(row.position||'')}</span></td>${cols.map(c=>`<td>${ltEscape(row[c]??'')}</td>`).join('')}</tr>`;
    }).join('');
    const stamp=data.generated_at?new Date(data.generated_at).toLocaleString('en-GB'):'recently';
    box.innerHTML=`<article class="league-table-card"><div class="league-table-head"><div><p class="eyebrow dark">Live standings</p><h3>${ltEscape(table.name||table.target||'League table')}</h3><p>${ltEscape(table.league_name||'Play-Cricket')}</p></div><span class="tag">Updated ${ltEscape(stamp)}</span></div><div class="league-table-wrap"><table class="league-table"><thead><tr><th>Pos</th>${cols.map(c=>`<th>${ltEscape(headings[c])}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div>${table.key?`<div class="league-table-note">${table.key}</div>`:''}</article>`;
  }catch(err){
    box.innerHTML=`<article class="league-table-card"><div class="league-table-loading"><h3>League table syncing</h3><p>${ltEscape(err.message)}. The table will appear automatically after the Play-Cricket league-table sync completes.</p></div></article>`;
  }
}
loadLeagueTable();