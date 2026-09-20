(() => {
 const grid=document.getElementById('admin-readiness-grid'),summary=document.getElementById('admin-readiness-summary');if(!grid)return;
 const cfg=window.SUTTON_CC||{},draw=window.SUTTON_WEEKLY_DRAW||{},next=cfg.nextSeason||new Date().getFullYear()+1;
 let sponsorState=null,juniorState=null;
 const juniorCheck=()=>{const ps=juniorState?.programmes||[],validUrl=v=>{try{return new URL(v||'').protocol==='https:'}catch{return false}},complete=ps.length&&ps.every(p=>p.name&&p.ages&&p.day&&p.time&&p.start_date&&p.venue&&p.price&&p.status&&p.status.toLowerCase()!=='tbc'&&(p.status.toLowerCase()!=='open'||validUrl(p.registration_url)));return complete?['Junior programmes','Ready',`${ps.length} ${next} junior programme${ps.length===1?'':'s'} published with complete details and registration links.`,'ok','#junior-programmes-admin']:['Junior programmes','Review',ps.length?`Complete the ${next} programme details, registration status and any required registration links.`:`Add the ${next} junior age groups and programme details when confirmed.`,'review','#junior-programmes-admin'];};
 const teamKey=`sutton-team-readiness-${next}`;
 const teamItems=[['first','1st XI'],['second','2nd XI'],['development','Development XI'],['women','Women & Girls'],['juniors','Juniors'],['officials','Captains, coaches & officials'],['committee','Committee details']];
 const teamState=()=>{try{return JSON.parse(localStorage.getItem(teamKey)||'{}')}catch{return {}}};
 const teamCheck=()=>{const state=teamState(),done=teamItems.filter(([id])=>state[id]).length;return done===teamItems.length?['Teams & officials','Ready',`All ${teamItems.length} team and officials checks completed for ${next}.`,'ok','#teams-readiness-admin']:['Teams & officials','Review',`${done}/${teamItems.length} team and officials checks completed for ${next}.`,'review','#teams-readiness-admin'];};
 const sponsorCheck=()=>{const sponsors=sponsorState?.sponsors||[],year=Number(next),renewed=sponsors.filter(s=>Array.isArray(s.renewed_years)&&s.renewed_years.map(Number).includes(year)).length;return sponsors.length&&renewed===sponsors.length?['Sponsors','Ready',`All ${sponsors.length} current sponsors are marked renewed for ${next}.`,'ok','/secure-admin/sponsors.html']:['Sponsors','Review',sponsors.length?`${renewed}/${sponsors.length} sponsors marked renewed for ${next}.`:'Confirm renewals, new sponsors and any logo changes before the new season.','review','#sponsors-admin'];};
 const buildChecks=()=>[
  ['Season rollover','Ready','Automatic rollover is set for 1 March '+next+'.','ok','#season-admin'],
  juniorCheck(),
  ['Weekly Draw',draw.season===next?(draw.open?'Open':'Prepared'):'Review',draw.season===next?(draw.open?'Entries are open for '+next+'.':'Season is set to '+next+' but entries are currently closed.'):'Weekly Draw season does not match '+next+'.',draw.season===next?'ok':'review','/secure-admin/weekly-draw.html'],
  ['Join & contact','Ready','The main Join & Contact routes are evergreen and ready for enquiries.','ok','join.html'],
  sponsorCheck(),
  teamCheck()
 ];
 const render=()=>{const checks=buildChecks();
 const reviews=checks.filter(c=>c[3]==='review').length;summary.textContent=reviews?reviews+' item'+(reviews===1?'':'s')+' to review':'Ready';
 grid.innerHTML=checks.map(c=>`<a href="${c[4]}" class="admin-readiness-card ${c[3]==='ok'?'is-ready':'needs-review'}"><span>${c[0]}</span><strong>${c[1]}</strong><p>${c[2]}</p><b class="admin-readiness-link">Open →</b></a>`).join('');
 const action=document.getElementById('admin-readiness-actions');if(action){const todo=checks.filter(c=>c[3]==='review');action.innerHTML=todo.length?todo.map((c,i)=>`<a href="${c[4]}" class="admin-readiness-action"><span>${i+1}</span><div><strong>${c[0]}</strong><p>${c[2]}</p></div><b>Review →</b></a>`).join(''):`<div class="admin-readiness-complete"><strong>${next} preparation is complete</strong><p>No readiness items currently need review.</p></div>`;}
 const renderTeamChecklist=()=>{const box=document.getElementById('admin-teams-readiness-list'),progress=document.getElementById('admin-teams-readiness-progress');if(!box)return;const state=teamState(),done=teamItems.filter(([id])=>state[id]).length;if(progress)progress.textContent=`${done}/${teamItems.length} checked for ${next}`;box.innerHTML=teamItems.map(([id,label])=>`<label class="admin-team-check ${state[id]?'is-checked':''}"><input type="checkbox" data-team-check="${id}" ${state[id]?'checked':''}><span><strong>${label}</strong><small>${state[id]?`Checked for ${next}`:'Needs review'}</small></span></label>`).join('');box.querySelectorAll('[data-team-check]').forEach(input=>input.addEventListener('change',()=>{const s=teamState();s[input.dataset.teamCheck]=input.checked;localStorage.setItem(teamKey,JSON.stringify(s));renderTeamChecklist();render();}));};
 window.addEventListener('sutton:juniors-readiness',e=>{juniorState=e.detail;render();});
 fetch(`data/junior-programmes.json?v=${Date.now()}`,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(j=>{juniorState=j;render();}).catch(()=>{});
 renderTeamChecklist();
})();