const awardsForm=document.getElementById('awards-form');
const awardsStatus=document.getElementById('awards-status');
const awardsList=document.getElementById('awards-existing');
let awardEntries=[];
let editingAwardKey='';

const awardsEsc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));

function setAwardsStatus(message,kind='info'){
  awardsStatus.textContent=message;
  awardsStatus.className=`secure-status ${kind}`;
  awardsStatus.hidden=false;
}

function resetAwardsForm(){
  editingAwardKey='';
  awardsForm.reset();
  document.getElementById('awards-year').value=new Date().getFullYear();
  document.getElementById('awards-form-title').textContent='Add a club award';
  document.getElementById('awards-save').textContent='Add award';
  document.getElementById('awards-cancel').hidden=true;
}

function renderAwards(){
  document.getElementById('awards-count').textContent=`${awardEntries.length} award ${awardEntries.length===1?'entry':'entries'}`;
  if(!awardEntries.length){awardsList.innerHTML='<p>No club awards found.</p>';return;}
  const grouped=new Map();
  awardEntries.forEach(entry=>{if(!grouped.has(entry.year))grouped.set(entry.year,[]);grouped.get(entry.year).push(entry);});
  awardsList.innerHTML=[...grouped.entries()].sort((a,b)=>b[0]-a[0]).map(([year,rows])=>`<section class="secure-award-year"><h3>${awardsEsc(year)}</h3><div>${rows.map(entry=>`<article class="secure-award-row"><div><span class="secure-tag">${awardsEsc(entry.group)}</span><strong>${awardsEsc(entry.award)}</strong><p>${awardsEsc(entry.winner)}</p></div><div class="secure-row-actions"><button type="button" data-award-edit="${awardsEsc(entry.key)}">Edit</button><button type="button" class="danger" data-award-delete="${awardsEsc(entry.key)}">Delete</button></div></article>`).join('')}</div></section>`).join('');
  awardsList.querySelectorAll('[data-award-edit]').forEach(btn=>btn.addEventListener('click',()=>editAward(btn.dataset.awardEdit)));
  awardsList.querySelectorAll('[data-award-delete]').forEach(btn=>btn.addEventListener('click',()=>deleteAward(btn.dataset.awardDelete)));
}

async function loadAwards(){
  try{
    const res=await fetch('/api/news?resource=awards',{cache:'no-store'});
    if(res.status===401){location.href='/';return;}
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Could not load club awards');
    awardEntries=Array.isArray(data.entries)?data.entries:[];
    renderAwards();
  }catch(error){setAwardsStatus(error.message,'error');}
}

function editAward(key){
  const entry=awardEntries.find(item=>item.key===key);
  if(!entry)return;
  editingAwardKey=key;
  document.getElementById('awards-year').value=entry.year;
  document.getElementById('awards-group').value=entry.group;
  document.getElementById('awards-award').value=entry.award;
  document.getElementById('awards-winner').value=entry.winner;
  document.getElementById('awards-form-title').textContent='Edit club award';
  document.getElementById('awards-save').textContent='Save changes';
  document.getElementById('awards-cancel').hidden=false;
  document.getElementById('awards-manager').scrollIntoView({behavior:'smooth',block:'start'});
}

awardsForm.addEventListener('submit',async event=>{
  event.preventDefault();
  const entry={
    year:Number(document.getElementById('awards-year').value),
    group:document.getElementById('awards-group').value.trim(),
    award:document.getElementById('awards-award').value.trim(),
    winner:document.getElementById('awards-winner').value.trim()
  };
  if(!entry.year||!entry.group||!entry.award||!entry.winner){setAwardsStatus('Please complete the year, section/team, award and winner.','error');return;}
  const action=editingAwardKey?'save these changes':'add this award';
  if(!confirm(`Ready to ${action} on the Sutton Cricket Club website?`))return;
  const button=document.getElementById('awards-save');
  button.disabled=true;
  setAwardsStatus(editingAwardKey?'Saving award…':'Adding award…');
  try{
    const res=await fetch('/api/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource:'awards',action:'save',key:editingAwardKey,entry})});
    if(res.status===401){location.href='/';return;}
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Award update failed');
    setAwardsStatus((data.message||'Award saved.')+' The website will refresh shortly.','success');
    resetAwardsForm();
    await loadAwards();
  }catch(error){setAwardsStatus(error.message,'error');}
  finally{button.disabled=false;}
});

async function deleteAward(key){
  const entry=awardEntries.find(item=>item.key===key);
  if(!entry||!confirm(`Delete “${entry.award} — ${entry.winner}” from ${entry.year}?`))return;
  setAwardsStatus('Deleting award…');
  try{
    const res=await fetch('/api/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({resource:'awards',action:'delete',key})});
    if(res.status===401){location.href='/';return;}
    const data=await res.json();
    if(!res.ok)throw new Error(data.error||'Delete failed');
    setAwardsStatus(data.message||'Award deleted.','success');
    if(editingAwardKey===key)resetAwardsForm();
    await loadAwards();
  }catch(error){setAwardsStatus(error.message,'error');}
}

document.getElementById('awards-cancel').addEventListener('click',resetAwardsForm);
document.getElementById('awards-clear').addEventListener('click',resetAwardsForm);
resetAwardsForm();
loadAwards();
