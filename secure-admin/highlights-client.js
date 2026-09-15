(()=>{
const $=id=>document.getElementById(id); const form=$('highlights-form'); if(!form)return;
let items=[],editing='';
const fields=['title','date','team','opponent','result','youtube'];
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function status(msg,error=false){const el=$('highlights-status');el.hidden=false;el.textContent=msg;el.className='secure-status '+(error?'error':'success');}
function reset(){editing='';form.reset();$('highlights-date').value=new Date().toISOString().slice(0,10);$('highlights-team').value='Sutton CC';$('highlights-save').textContent='Publish highlight';$('highlights-cancel').hidden=true;$('highlights-form-title').textContent='Add match highlights';}
function render(){
 $('highlights-count').textContent=`${items.length} highlight${items.length===1?'':'s'}`;
 $('highlights-existing').innerHTML=items.length?items.map(x=>`<div class="secure-news-row"><div class="secure-news-row-main">${x.poster?`<img src="${esc(x.poster)}" alt="">`:''}<div><span class="secure-tag">${esc(x.team||'Sutton CC')}</span><h3>${esc(x.title)}</h3><p>${esc([x.date,x.opponent,x.result].filter(Boolean).join(' · '))}</p></div></div><div class="secure-row-actions"><button data-edit="${esc(x.id)}">Edit</button><button class="danger" data-delete="${esc(x.id)}">Delete</button></div></div>`).join(''):'<p>No highlights published yet.</p>';
 document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>edit(b.dataset.edit)); document.querySelectorAll('[data-delete]').forEach(b=>b.onclick=()=>del(b.dataset.delete));
}
async function load(){try{const r=await fetch('/api/highlights',{cache:'no-store'});const d=await r.json();if(!r.ok)throw Error(d.error||'Could not load highlights');items=d.highlights||[];render();}catch(e){status(e.message,true)}}
function edit(id){const x=items.find(i=>i.id===id);if(!x)return;editing=id;$('highlights-title').value=x.title||'';$('highlights-date').value=x.date||'';$('highlights-team').value=x.team||'';$('highlights-opponent').value=x.opponent||'';$('highlights-result').value=x.result||'';$('highlights-youtube').value=x.youtube_url||'';$('highlights-save').textContent='Update highlight';$('highlights-cancel').hidden=false;$('highlights-form-title').textContent='Edit match highlights';form.scrollIntoView({behavior:'smooth'});}
async function del(id){const x=items.find(i=>i.id===id);if(!confirm(`Delete “${x?.title||'this highlight'}”?`))return;try{const r=await fetch('/api/highlights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',id})});const d=await r.json();if(!r.ok)throw Error(d.error);status(d.message);await load();}catch(e){status(e.message,true)}}
form.onsubmit=async e=>{e.preventDefault();const highlight={id:editing,title:$('highlights-title').value,date:$('highlights-date').value,team:$('highlights-team').value,opponent:$('highlights-opponent').value,result:$('highlights-result').value,youtube_url:$('highlights-youtube').value};try{$('highlights-save').disabled=true;const r=await fetch('/api/highlights',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'save',highlight})});const d=await r.json();if(!r.ok)throw Error(d.error);status(d.message+' — the website will refresh shortly.');reset();await load();}catch(e){status(e.message,true)}finally{$('highlights-save').disabled=false}};
$('highlights-cancel').onclick=reset;$('highlights-clear').onclick=reset;reset();load();
})();
