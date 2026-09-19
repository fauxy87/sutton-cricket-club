(() => {
 const grid=document.getElementById('admin-readiness-grid'),summary=document.getElementById('admin-readiness-summary');if(!grid)return;
 const cfg=window.SUTTON_CC||{},draw=window.SUTTON_WEEKLY_DRAW||{},next=cfg.nextSeason||new Date().getFullYear()+1;
 const checks=[
  ['Season rollover','Ready','Automatic rollover is set for 1 March '+next+'.','ok'],
  ['Junior programmes','Review','All Stars, Softball and U14 pages currently show '+next+' details as “to be confirmed”.','review'],
  ['Weekly Draw',draw.season===next?(draw.open?'Open':'Prepared'):'Review',draw.season===next?(draw.open?'Entries are open for '+next+'.':'Season is set to '+next+' but entries are currently closed.'):'Weekly Draw season does not match '+next+'.',draw.season===next?'ok':'review'],
  ['Join & contact','Ready','The main Join & Contact routes are evergreen and ready for enquiries.','ok'],
  ['Sponsors','Review','Confirm renewals, new sponsors and any logo changes before the new season.','review'],
  ['Teams & officials','Review','Confirm team names, captains, coaches and committee details before '+next+'.','review']
 ];
 const reviews=checks.filter(c=>c[3]==='review').length;summary.textContent=reviews?reviews+' item'+(reviews===1?'':'s')+' to review':'Ready';
 grid.innerHTML=checks.map(c=>`<article class="admin-readiness-card ${c[3]==='ok'?'is-ready':'needs-review'}"><span>${c[0]}</span><strong>${c[1]}</strong><p>${c[2]}</p></article>`).join('');
})();