(()=>{
const box=document.getElementById('admin-team-editor-fields');if(!box)return;
const cfg=window.SUTTON_CC||{},season=Number(cfg.nextSeason)||new Date().getFullYear()+1;
const fields=[['first_xi_captain','1st XI captain'],['second_xi_captain','2nd XI captain'],['development_xi_captain','Development XI captain'],['women_lead','Women & Girls lead / captain'],['junior_lead','Junior lead / coach'],['club_captain','Club captain'],['chairperson','Chairperson'],['secretary','Secretary'],['treasurer','Treasurer'],['safeguarding','Safeguarding officer']];
let data={season,details:{}};
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function render(){box.innerHTML=fields.map(([id,label])=>'<label><span>'+label+'</span><input data-team-detail="'+id+'" value="'+esc(data.details[id]||'')+'" placeholder="Enter name"><small>Used for '+season+' preparation</small></label>').join('');box.querySelectorAll('[data-team-detail]').forEach(i=>i.addEventListener('input',()=>{data.details[i.dataset.teamDetail]=i.value.trim();}));}
fetch('data/team-officials.json?v='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(j=>{data={season,details:{...(j.details||{})}};render();}).catch(render);
document.getElementById('admin-team-details-download')?.addEventListener('click',()=>{data.season=season;data.updated_at=new Date().toISOString().slice(0,10);const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='team-officials.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);const s=document.getElementById('admin-team-details-status');if(s)s.textContent='Prepared. Upload this file to data/team-officials.json on GitHub.';});
})();
