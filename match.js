function mh(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function first(v,...keys){for(const k of keys){if(v&&v[k]!==undefined&&v[k]!==null&&v[k]!=='')return v[k];}return '';}
function scoreFromInnings(inn){const r=first(inn,'runs','total_runs','team_runs');const w=first(inn,'wickets','total_wickets','team_wickets');const o=first(inn,'overs','total_overs');let s=r!==''?String(r):'';if(w!=='')s+=`/${w}`;if(o!=='')s+=` (${o})`;return s||'Scorecard';}
function teamNameFromInnings(inn,detail){return first(inn,'team_batting_name','batting_team_name','team_name')||(['home_team_id','away_team_id'].find(k=>String(detail[k]||'')===String(first(inn,'team_batting_id','batting_team_id')))?.startsWith('home')?detail.home_team_name:detail.away_team_name)||'Innings';}
function dismissalText(b){
  const direct=first(b,'how_out','dismissal','out_description','dismissal_text','dismissal_description');
  if(direct && typeof direct==='string' && !/^(caught|bowled|lbw|stumped|run out)$/i.test(direct.trim()))return direct;
  const kind=String(first(b,'how_out','dismissal_type','dismissal','out_type')||'').toLowerCase();
  const bowler=first(b,'bowler_name','dismissed_by','bowler','out_bowler_name');
  const catcher=first(b,'fielder_name','caught_by','catcher_name','catch_by','catcher');
  if(kind.includes('caught')||kind==='c')return ['c '+(catcher||'?'),bowler?'b '+bowler:''].filter(Boolean).join(' ');
  if(kind.includes('stump'))return ['st '+(catcher||'?'),bowler?'b '+bowler:''].filter(Boolean).join(' ');
  if(kind.includes('bowled')||kind==='b')return bowler?'b '+bowler:String(direct||'Bowled');
  if(kind.includes('lbw'))return bowler?'lbw b '+bowler:'lbw';
  if(kind.includes('run out'))return catcher?'run out ('+catcher+')':'run out';
  return String(direct||'');
}
function fieldingSummary(innings){
  const caught=new Map(), wicketNotes=[];
  for(const inn of innings){
    for(const b of (first(inn,'bat','batting')||[])){
      const d=dismissalText(b);
      if(!d)continue;
      const batter=first(b,'batsman_name','player_name','name');
      const catchMatch=d.match(/^c\s+(.+?)(?:\s+b\s+.+)?$/i);
      if(catchMatch && catchMatch[1]!=='?'){
        const catcher=catchMatch[1].trim();
        caught.set(catcher,(caught.get(catcher)||0)+1);
      }
      if(batter)wicketNotes.push({batter,dismissal:d});
    }
  }
  if(!caught.size)return '';
  return '<article class="innings-card"><h2>Catches recorded</h2><p>'+[...caught].map(([name,n])=>mh(name)+' <strong>('+n+')</strong>').join(' · ')+'</p><small>Based on named catchers in the published scorecard. Run-outs and stumpings are not counted as catches.</small></article>';
}
function battingTable(rows){if(!rows?.length)return '<div class="match-empty">No batting details available.</div>';return `<div class="score-table-wrap"><table class="score-table"><thead><tr><th>Batter</th><th>Dismissal</th><th class="num">R</th><th class="num">B</th><th class="num">4s</th><th class="num">6s</th></tr></thead><tbody>${rows.map(b=>`<tr><td><strong>${mh(first(b,'batsman_name','player_name','name'))}</strong></td><td class="dismissal">${mh(dismissalText(b))}</td><td class="num"><strong>${mh(first(b,'runs'))}</strong></td><td class="num">${mh(first(b,'balls'))}</td><td class="num">${mh(first(b,'fours'))}</td><td class="num">${mh(first(b,'sixes'))}</td></tr>`).join('')}</tbody></table></div>`;}
function bowlingTable(rows){if(!rows?.length)return '<div class="match-empty">No bowling details available.</div>';return `<div class="score-table-wrap"><table class="score-table"><thead><tr><th>Bowler</th><th class="num">O</th><th class="num">M</th><th class="num">R</th><th class="num">W</th></tr></thead><tbody>${rows.map(b=>`<tr><td><strong>${mh(first(b,'bowler_name','player_name','name'))}</strong></td><td class="num">${mh(first(b,'overs'))}</td><td class="num">${mh(first(b,'maidens'))}</td><td class="num">${mh(first(b,'runs'))}</td><td class="num"><strong>${mh(first(b,'wickets'))}</strong></td></tr>`).join('')}</tbody></table></div>`;}
async function loadMatch(){const box=document.getElementById('match-scorecard');if(!box)return;const id=new URLSearchParams(location.search).get('id');if(!id){box.innerHTML='<div class="match-empty"><h3>No match selected</h3><p>Return to Fixtures & Results and choose a match.</p></div>';return;}try{const [scoreRes,summaryRes]=await Promise.all([fetch(`data/play-cricket-scorecards.json?v=${Date.now()}`,{cache:'no-store'}),fetch(`data/play-cricket.json?v=${Date.now()}`,{cache:'no-store'})]);if(!scoreRes.ok)throw new Error('Scorecards are not available yet');const scoreData=await scoreRes.json();const entry=(scoreData.matches||{})[String(id)];if(!entry?.detail)throw new Error('This match scorecard has not been synced yet');const detailList=entry.detail.match_details||entry.detail.matches||[];const d=detailList[0]||entry.detail;let summary={};if(summaryRes.ok){const sd=await summaryRes.json();summary=[...(sd.results||[]),...(sd.matches||[])].find(x=>String(x.id||x.match_id||'')===String(id))||{};}const home=first(d,'home_team_name')||first(summary,'home_team_name')||'Home';const away=first(d,'away_team_name')||first(summary,'away_team_name')||'Away';document.title=`${home} v ${away} | Sutton Cricket Club`;document.getElementById('match-title').textContent=`${home} v ${away}`;const result=first(d,'result_description','result','result_text')||first(summary,'result_description','result','result_text','result_summary')||'Full match scorecard';document.getElementById('match-summary').textContent=result;const meta=[first(d,'match_date')||first(summary,'match_date'),first(d,'competition_name')||first(summary,'competition_name'),first(d,'ground_name')||first(summary,'ground_name')].filter(Boolean);document.getElementById('match-meta').innerHTML=meta.map(x=>`<span>${mh(x)}</span>`).join('');const innings=first(d,'innings')||[];if(!Array.isArray(innings)||!innings.length){box.innerHTML='<div class="match-empty"><h3>Scorecard not yet available</h3><p>The match exists in Play-Cricket but no innings details have been published yet.</p></div>';return;}box.innerHTML=innings.map((inn,i)=>`<article class="innings-card"><div class="innings-head"><h2>${mh(teamNameFromInnings(inn,d))}${innings.length>2?` · Innings ${i+1}`:''}</h2><div class="innings-score">${mh(scoreFromInnings(inn))}</div></div><h3 class="innings-section-title">Batting</h3>${battingTable(first(inn,'bat','batting')||[])}<h3 class="innings-section-title">Bowling</h3>${bowlingTable(first(inn,'bowl','bowling')||[])}</article>`).join('')+fieldingSummary(innings);}catch(e){box.innerHTML=`<div class="match-empty"><h3>Scorecard unavailable</h3><p>${mh(e.message)}</p></div>`;}}
loadMatch();