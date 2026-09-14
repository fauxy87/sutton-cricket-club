async function linkPlayerNames(){
  try{
    const res=await fetch(`data/player-stats.json?v=${Date.now()}`,{cache:'no-store'});
    if(!res.ok)return;
    const data=await res.json();
    const byName=new Map();
    [...(data.batting||[]),...(data.bowling||[])].forEach(p=>{
      if(p?.name&&p?.player_id)byName.set(String(p.name).trim(),String(p.player_id));
    });

    function apply(){
      document.querySelectorAll('.record-feature h3,.stat-row strong,.score-table td:first-child strong,.board-row span,.historical-honours-table td[data-label="Player"] strong,.honours-leader-row strong').forEach(el=>{
        if(el.dataset.playerLinked==='true'||el.closest('a')||el.querySelector('a.player-profile-link'))return;
        let text=el.textContent.trim().replace(/^\d+\.\s*/,'');
        const id=byName.get(text);
        if(!id)return;
        const label=el.textContent;
        const a=document.createElement('a');
        a.href=`player.html?id=${encodeURIComponent(id)}`;
        a.className='player-profile-link';
        a.textContent=label;
        a.setAttribute('aria-label',`${text} player profile`);
        el.dataset.playerLinked='true';
        el.textContent='';
        el.appendChild(a);
      });
    }

    apply();
    let queued=false;
    const observer=new MutationObserver(()=>{
      if(queued)return;
      queued=true;
      requestAnimationFrame(()=>{queued=false;apply();});
    });
    observer.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>observer.disconnect(),15000);
  }catch(e){
    console.info('Player links unavailable:',e.message);
  }
}
linkPlayerNames();
