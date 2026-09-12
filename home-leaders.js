function hlEsc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function hlPlayerLink(p){const id=encodeURIComponent(String(p?.player_id||''));const name=hlEsc(p?.name||'No data yet');return id?`<a href="player.html?id=${id}">${name}</a>`:name;}
async function loadHomeLeaders(){
  const box=document.getElementById('home-player-leaders');
  if(!box)return;
  try{
    const res=await fetch(`data/player-stats.json?v=${Date.now()}`,{cache:'no-store'});
    if(!res.ok)throw new Error('Player statistics are not available yet');
    const data=await res.json();
    const batting=data.batting||[];
    const bowling=data.bowling||[];
    const topBat=batting[0];
    const topBowl=bowling[0];
    const high=batting.slice().sort((a,b)=>parseInt(String(b.high_score||0))-parseInt(String(a.high_score||0)))[0];
    box.innerHTML=`
      <article class="record-feature home-leader-card"><span>Leading run scorer</span><strong>${hlEsc(topBat?.runs??'—')}</strong><h3>${hlPlayerLink(topBat)}</h3><p>${topBat?`Avg ${hlEsc(topBat.average??'—')} · HS ${hlEsc(topBat.high_score||'—')}`:'No batting data yet'}</p></article>
      <article class="record-feature home-leader-card"><span>Leading wicket taker</span><strong>${hlEsc(topBowl?.wickets??'—')}</strong><h3>${hlPlayerLink(topBowl)}</h3><p>${topBowl?`Best ${hlEsc(topBowl.best||'—')} · Econ ${hlEsc(topBowl.economy??'—')}`:'No bowling data yet'}</p></article>
      <article class="record-feature home-leader-card"><span>Highest score</span><strong>${hlEsc(high?.high_score||'—')}</strong><h3>${hlPlayerLink(high)}</h3><p>${high?`${hlEsc(high.runs??'—')} season runs`:'No batting data yet'}</p></article>`;
    const status=document.getElementById('home-leaders-status');
    if(status){const stamp=data.generated_at?new Date(data.generated_at).toLocaleString('en-GB'):'recently';status.textContent=`From ${data.scorecards_processed||0} synced scorecards · updated ${stamp}`;}
  }catch(e){box.innerHTML='<article class="record-feature"><span>Player statistics</span><strong>—</strong><h3>Coming soon</h3><p>Waiting for the next Play-Cricket statistics sync.</p></article>';const status=document.getElementById('home-leaders-status');if(status)status.textContent='Player statistics will appear after the next sync.';}
}
loadHomeLeaders();