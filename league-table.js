function ltEscape(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}

async function loadLeagueTable(){
  const box=document.getElementById('league-table');
  if(!box)return;
  const team=document.body.dataset.teamPage;
  if(team!=='1st'&&team!=='2nd')return;
  try{
    const res=await fetch(`data/league-tables.json?v=${Date.now()}`,{cache:'no-store'});
    if(!res.ok)throw new Error('League table data has not synced yet');
    const data=await res.json();
    const table=(data.tables||{})[team];
    if(!table||table.error)throw new Error(table?.error||'League table not found');
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