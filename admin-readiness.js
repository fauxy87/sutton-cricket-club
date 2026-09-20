(() => {
 const grid=document.getElementById('admin-readiness-grid'),summary=document.getElementById('admin-readiness-summary');if(!grid)return;
 const cfg=window.SUTTON_CC||{},draw=window.SUTTON_WEEKLY_DRAW||{},next=cfg.nextSeason||new Date().getFullYear()+1;
 const checks=[
  ['Season rollover','Ready','Automatic rollover is set for 1 March '+next+'.','ok','#season-admin'],
  ['Junior programmes','Review','All Stars, Softball and U14 pages currently show '+next+' details as “to be confirmed”.','review','juniors.html'],
  ['Weekly Draw',draw.season===next?(draw.open?'Open':'Prepared'):'Review',draw.season===next?(draw.open?'Entries are open for '+next+'.':'Season is set to '+next+' but entries are currently closed.'):'Weekly Draw season does not match '+next+'.',draw.season===next?'ok':'review','#weekly-draw-admin'],
  ['Join & contact','Ready','The main Join & Contact routes are evergreen and ready for enquiries.','ok','join.html'],
  ['Sponsors','Review','Confirm renewals, new sponsors and any logo changes before the new season.','review','#sponsors-admin'],
  ['Teams & officials','Review','Confirm team names, captains, coaches and committee details before '+next+'.','review','teams.html']
 ];
 const reviews=checks.filter(c=>c[3]==='review').length;summary.textContent=reviews?reviews+' item'+(reviews===1?'':'s')+' to review':'Ready';
 grid.innerHTML=checks.map(c=>`<a href="${c[4]}" class="admin-readiness-card ${c[3]==='ok'?'is-ready':'needs-review'}"><span>${c[0]}</span><strong>${c[1]}</strong><p>${c[2]}</p><b class="admin-readiness-link">Open →</b></a>`).join('');
 const action=document.getElementById('admin-readiness-actions');if(action){const todo=checks.filter(c=>c[3]==='review');action.innerHTML=todo.length?todo.map((c,i)=>`<a href="${c[4]}" class="admin-readiness-action"><span>${i+1}</span><div><strong>${c[0]}</strong><p>${c[2]}</p></div><b>Review →</b></a>`).join(''):`<div class="admin-readiness-complete"><strong>${next} preparation is complete</strong><p>No readiness items currently need review.</p></div>`;}
})();