(() => {
 const fixtures=document.getElementById('hub-upcoming'),results=document.getElementById('hub-results'),status=document.getElementById('hub-live-status');
 if(!fixtures||!results)return;
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','"':'&quot;'}[c]));
 const dateOf=m=>{const a=String(m.match_date||'').split('/').map(Number);return a.length===3?new Date(a[2],a[1]-1,a[0],12):null};
 const club=m=>String(m.home_club_id)==='6168'||String(m.away_club_id)==='6168'||[m.home_club_name,m.away_club_name].some(n=>/sutton cc/i.test(n||''));
 const team=m=>String(m.home_team_id)==='63723'||String(m.away_team_id)==='63723'?'1st XI':String(m.home_team_id)==='63724'||String(m.away_team_id)==='63724'?'2nd XI':String(m.home_team_name||'').includes('Women')||String(m.away_team_name||'').includes('Women')?'Women & Girls':'Sutton CC';
 const card=(m,isResult)=>{const date=dateOf(m);const when=date?date.toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}):'Date to be confirmed';const home=m.home_club_name||m.home_team_name||'Home';const away=m.away_club_name||m.away_team_name||'Away';const detail=isResult?(m.result_description||m.result||'Result recorded'):(m.match_time?'Start '+m.match_time:'Time to be confirmed');return `<article class="hub-card"><span class="hub-tag">${escape(team(m))} · ${escape(when)}</span><h3>${escape(home)} v ${escape(away)}</h3><p>${escape(detail)}</p>${m.ground_name&&m.ground_name!=='Add New Ground'?`<p>${escape(m.ground_name)}</p>`:''}</article>`;};
 const empty=(message)=>`<article class="hub-card"><p>${escape(message)}</p><a href="fixtures.html">Fixtures &amp; results</a></article>`;
 const now=new Date();const target=2027;
 const countdown=document.getElementById('hub-countdown'),opening=document.getElementById('hub-opening-date');
 function setCountdown(items){if(!countdown||!opening)return;const dated=items.filter(m=>club(m)&&Number(m.season||target)===target&&dateOf(m)).sort((a,b)=>dateOf(a)-dateOf(b));if(!dated.length)return;const first=dated[0];const day=dateOf(first);const days=Math.ceil((new Date(day.getFullYear(),day.getMonth(),day.getDate())-new Date(now.getFullYear(),now.getMonth(),now.getDate()))/86400000);countdown.textContent=days>0?days+' days to the first published fixture':days===0?'First published fixture is today':'2027 season underway';opening.textContent='First published fixture: '+day.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'})+'. This is the earliest fixture currently in the club feed, not necessarily the official league opening date.';}

 fetch('data/play-cricket.json?v='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Sync unavailable');return r.json()}).then(data=>{
  if(Number(data.season)!==target){fixtures.innerHTML=empty('2027 fixtures will appear here when published on Play-Cricket.');results.innerHTML=empty('2027 results will appear after the first matches.');status.textContent='2027 match data not yet published. The 2026 results remain in the archive.';return;}
  setCountdown(Array.isArray(data.matches)?data.matches:[]);
  const matches=(Array.isArray(data.matches)?data.matches:[]).filter(m=>club(m)&&dateOf(m)&&dateOf(m)>=new Date(now.getFullYear(),now.getMonth(),now.getDate())&&Number(m.season||target)===target).sort((a,b)=>dateOf(a)-dateOf(b)).slice(0,3);
  const played=(Array.isArray(data.results)?data.results:[]).filter(m=>club(m)&&dateOf(m)&&dateOf(m)<=now&&Number(m.season||target)===target).sort((a,b)=>dateOf(b)-dateOf(a)).slice(0,3);
  fixtures.innerHTML=matches.length?matches.map(m=>card(m,false)).join(''):empty('No upcoming 2027 matches are currently published.');
  results.innerHTML=played.length?played.map(m=>card(m,true)).join(''):empty('No 2027 results have been published yet.');
  status.textContent='Showing 2027 match information from the club’s Play-Cricket sync.';
 }).catch(()=>{fixtures.innerHTML=empty('Fixtures are temporarily unavailable.');results.innerHTML=empty('Results are temporarily unavailable.');status.textContent='Unable to check the latest Play-Cricket data right now.';});
})();