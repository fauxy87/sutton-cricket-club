(() => {
 const root=document.getElementById('hub-news');if(!root)return;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
 const fallback='<article class="hub-card"><p>Club announcements will appear here when published.</p><a href="news.html">Browse all club news</a></article>';
 fetch('data/news.json?v='+Date.now(),{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Unavailable');return r.json()}).then(data=>{
 const articles=(Array.isArray(data.articles)?data.articles:[]).filter(a=>/^\d{4}-\d{2}-\d{2}$/.test(a.date||'')&&Number(a.date.slice(0,4))>=2026).sort((a,b)=>b.date.localeCompare(a.date));
 // During the build-up, include relevant 2026 announcements. Once 2027 stories exist, prioritise them.
 const season=articles.filter(a=>Number(a.date.slice(0,4))===2027);
 const selected=(season.length?season.concat(articles.filter(a=>Number(a.date.slice(0,4))===2026)):articles).slice(0,3);
 root.innerHTML=selected.length?selected.map(a=>`<article class="hub-card"><span class="hub-tag">${esc(new Date(a.date+'T12:00:00').toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}))} · ${esc(a.category_label||'Club news')}</span><h3>${esc(a.title)}</h3><p>${esc(a.summary||'')}</p><a href="news-${encodeURIComponent(a.id)}.html">Read announcement</a></article>`).join(''):fallback;
 }).catch(()=>root.innerHTML=fallback);
})();