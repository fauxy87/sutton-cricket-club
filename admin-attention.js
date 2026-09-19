(() => {
 const box=document.getElementById('admin-attention');if(!box)return;const draw=window.SUTTON_WEEKLY_DRAW||{};const issues=[];
 const get=(url)=>fetch(url+'?v='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error(String(r.status));return r.json()});
 Promise.allSettled([get('data/play-cricket.json'),get('data/sponsors.json'),get('data/news.json')]).then(([pc,sp,nw])=>{
  if(pc.status!=='fulfilled')issues.push(['Play-Cricket data unavailable','The website could not load the current Play-Cricket data.','#play-cricket-admin']);else{const g=pc.value.generated_at?new Date(pc.value.generated_at):null;const age=g&&!Number.isNaN(g.getTime())?(Date.now()-g.getTime())/36e5:999;if(age>=30)issues.push(['Play-Cricket sync looks stale','The published data is more than 30 hours old.','#play-cricket-admin']);}
  if(sp.status!=='fulfilled')issues.push(['Sponsor data unavailable','The website could not load the sponsor list.','#sponsors-admin']);else{const sponsors=sp.value.sponsors||[];const missing=sponsors.filter(s=>!s.logo);if(missing.length)issues.push(['Sponsor logos missing',missing.length+' sponsor'+(missing.length===1?' is':'s are')+' missing a logo.','#sponsors-admin']);}
  if(nw.status!=='fulfilled')issues.push(['News data unavailable','The website could not load club news.','#news-admin']);
  if(draw.open&&!draw.entryUrl)issues.push(['Weekly Draw needs an entry link','Entries are open but no entry/payment link is configured.','#weekly-draw-admin']);
  if(!issues.length){box.classList.add('is-clear');box.innerHTML='<div class="admin-attention-icon">✓</div><div><p class="eyebrow dark">Needs attention</p><h2>Everything looks good</h2><p>No problems were found with the main website data and settings.</p></div>';return;}
  box.classList.add('has-issues');box.innerHTML='<div class="admin-attention-icon">!</div><div><p class="eyebrow dark">Needs attention</p><h2>'+issues.length+' item'+(issues.length===1?'':'s')+' to check</h2><div class="admin-attention-list">'+issues.map(i=>'<a href="'+i[2]+'"><strong>'+i[0]+'</strong><span>'+i[1]+'</span></a>').join('')+'</div></div>';
 });
})();
