(() => {
  const dashboard=document.querySelector('.admin-dashboard-section'); if(!dashboard)return;
  const cfg=window.SUTTON_CC||{}; const now=new Date(); const month=now.getMonth();
  const current=cfg.currentSeason||now.getFullYear(); const next=cfg.nextSeason||current+1;
  const preseason=month>=9||month<=1;
  const rolloverYear=month>=2?now.getFullYear()+1:now.getFullYear();
  const nextPreseasonYear=month>=9?now.getFullYear()+1:now.getFullYear();
  const fmt=d=>d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  const section=document.createElement('section'); section.id='season-admin'; section.className='section admin-season-section';
  section.innerHTML=`<div class="container"><div class="section-heading"><div><p class="eyebrow dark">Homepage &amp; season</p><h2>Season status</h2></div><a class="text-link" href="index.html">View homepage →</a></div><div class="admin-season-grid"><article class="admin-season-card"><span>Current season</span><strong>${current}</strong><p>Used for live fixtures, standings and current-season labels.</p></article><article class="admin-season-card"><span>Next season</span><strong>${next}</strong><p>Used for forward-looking junior and pre-season information.</p></article><article class="admin-season-card ${preseason?'is-active':''}"><span>Winter pre-season</span><strong>${preseason?'ON':'OFF'}</strong><p>${preseason?'The homepage pre-season panel is currently visible.':`Scheduled to appear automatically on ${fmt(new Date(nextPreseasonYear,9,1))}.`}</p></article><article class="admin-season-card"><span>Next rollover</span><strong>1 Mar</strong><p>Current season changes to ${next} automatically on ${fmt(new Date(rolloverYear,2,1))}.</p></article></div><div class="admin-season-note"><strong>Automatic and protected</strong><p>The season rollover and winter homepage timing are controlled centrally. No action is required here, which prevents an accidental early season change. Historical awards, results and archive years are never changed by the rollover.</p></div></div>`;
  dashboard.insertAdjacentElement('afterend',section);
})();
