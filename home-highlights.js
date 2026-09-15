(() => {
  const mount = document.getElementById('home-latest-highlight');
  if (!mount) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmt = value => { if (!value) return ''; const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'}); };
  async function load(){
    try{
      const res=await fetch(`data/highlights.json?v=${Date.now()}`,{cache:'no-store'}); if(!res.ok) throw new Error();
      const data=await res.json(); const items=Array.isArray(data.highlights)?data.highlights:[];
      const item=items.slice().sort((a,b)=>new Date(b.date||b.created_at||0)-new Date(a.date||a.created_at||0))[0];
      if(!item){mount.innerHTML='<div class="home-highlight-empty">Match highlights will appear here when published.</div>';return;}
      const meta=[fmt(item.date),item.opponent,item.result].filter(Boolean).join(' · ');
      const media=item.youtube_id ? `<a class="home-highlight-media" href="${esc(item.youtube_url||'gallery.html')}" target="_blank" rel="noopener"><img src="${esc(item.poster||`https://i.ytimg.com/vi/${item.youtube_id}/hqdefault.jpg`)}" alt="${esc(item.title||'Sutton Cricket Club highlights')}"><span class="home-highlight-play">▶</span></a>` : `<a class="home-highlight-media" href="gallery.html"><div class="home-highlight-placeholder">▶</div></a>`;
      mount.innerHTML=`${media}<div class="home-highlight-copy"><span class="tag">Latest video</span><h3>${esc(item.title||'Match highlights')}</h3>${meta?`<p>${esc(meta)}</p>`:''}<div class="home-highlight-actions"><a class="btn btn-primary" href="gallery.html">Watch highlights</a>${item.youtube_url?`<a class="text-link" href="${esc(item.youtube_url)}" target="_blank" rel="noopener">Watch on YouTube →</a>`:''}</div></div>`;
    }catch{mount.innerHTML='<div class="home-highlight-empty">Latest highlights are temporarily unavailable.</div>';}
  }
  load();
})();
