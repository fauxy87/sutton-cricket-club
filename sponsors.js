(() => {
  const box=document.getElementById('sponsor-showcase');if(!box)return;
  const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const href=v=>/^https?:\/\//i.test(String(v||'').trim())?String(v).trim():'';
  const tier=s=>{const t=String(s.type||'').toLowerCase();if(t.includes('main'))return'main';if(t.includes('colts'))return'colts';return'supporter';};
  const card=s=>{const url=href(s.website),t=tier(s),label=t==='main'?'Main Club Sponsor':t==='colts'?'Colts Sponsor':(s.type||'Club Supporter');const logo=s.logo?`<div class="sponsor-mark sponsor-logo"><img src="${esc(s.logo)}" alt="${esc(s.logo_alt||`${s.name} logo`)}"></div>`:'<div class="sponsor-mark sponsor-logo sponsor-logo-placeholder">SUTTON CC</div>';return `<article class="sponsor-showcase-card sponsor-${t}"><span class="sponsor-tier sponsor-tier-${t}">${esc(label)}</span>${url?`<a class="sponsor-image-link" href="${esc(url)}" target="_blank" rel="noopener">${logo}</a>`:logo}<div class="sponsor-card-copy"><h3>${esc(s.name)}</h3><p class="sponsor-description">${esc(s.description||'Proud supporter of Sutton Cricket Club.')}</p>${url?`<a class="sponsor-visit" href="${esc(url)}" target="_blank" rel="noopener">Visit ${esc(s.name)} <span>→</span></a>`:'<span class="sponsor-local">Proudly supporting Sutton CC</span>'}</div></article>`;};
  const review=s=>`<article class="sponsor-review-card"><div class="sponsor-review-top">${s.logo?`<img src="${esc(s.logo)}" alt="${esc(s.logo_alt||`${s.name} logo`)}">`:''}<span>“</span></div><blockquote>${esc(s.testimonial)}</blockquote><div class="sponsor-review-by"><strong>${esc(s.testimonial_name||s.name)}</strong>${s.testimonial_role?`<small>${esc(s.testimonial_role)}</small>`:`<small>${esc(s.name)}</small>`}</div></article>`;

  const partnerLabel=[...document.querySelectorAll('.sponsor-heading .eyebrow')].find(el=>/\bpartners\b/i.test(el.textContent));
  if(partnerLabel) partnerLabel.textContent=`${new Date().getFullYear()} partners`;

  // The 2026 event had 10 teams. Keep the event CTA on the same exact-package route as the package cards.
  const sixAsideStats=document.querySelector('.sixaside-stats');
  if(sixAsideStats){
    const teams=[...sixAsideStats.querySelectorAll('div')].find(item=>/teams/i.test(item.querySelector('span')?.textContent||''));
    if(teams?.querySelector('strong')) teams.querySelector('strong').textContent='10';
  }
  const sixAsideHeroLink=document.querySelector('.sixaside-price a[href^="sponsor-enquiry.html"]');
  if(sixAsideHeroLink) sixAsideHeroLink.href=`sponsor-enquiry.html?package=${encodeURIComponent('6-a-Side Sponsor — £300')}`;

  const packageMap={
    'Match Ball':'Match Ball — from £20',
    'Player Sponsor':'Player Sponsor — £50',
    'Pitchside Banner':'Pitchside Banner — £150 per season',
    'Training Kit':'Training Kit — £250 per season · 3-year partnership',
    'Scoreboard Sponsor':'Scoreboard Sponsor — £250 per season · 3-year partnership',
    'Playing Kit':'Playing Kit — £300–£400 per season · 3-year partnership',
    '6-a-Side Sponsor':'6-a-Side Sponsor — £300',
    'Bespoke Partnership':'Something bespoke'
  };
  document.querySelectorAll('.package-card').forEach(packageCard=>{
    const title=packageCard.querySelector('h3')?.textContent.trim();
    const selected=packageMap[title];
    if(!selected)return;
    packageCard.querySelectorAll('a[href^="sponsor-enquiry.html?package="], .package-enquire').forEach(link=>link.remove());
    const link=document.createElement('a');
    link.className='btn btn-primary package-enquire';
    link.href=`sponsor-enquiry.html?package=${encodeURIComponent(selected)}`;
    link.textContent=title==='Bespoke Partnership'?'Talk to us':'Enquire about this package';
    link.style.marginTop='auto';
    link.style.alignSelf='flex-start';
    packageCard.appendChild(link);
  });

  document.querySelectorAll('.package-card').forEach(el=>{el.style.display='flex';el.style.flexDirection='column';});

  fetch(`data/sponsors.json?v=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(data=>{const all=(Array.isArray(data.sponsors)?data.sponsors:[]).filter(s=>s.status!=='previous');all.sort((a,b)=>{const rank={main:0,colts:1,supporter:2};return rank[tier(a)]-rank[tier(b)]||(Number(a.order)||999)-(Number(b.order)||999);});if(!all.length){box.innerHTML='<p>No sponsors are currently listed.</p>';return;}const featured=all.filter(s=>tier(s)!=='supporter'),supporters=all.filter(s=>tier(s)==='supporter');box.innerHTML=`${featured.length?`<div class="sponsor-featured-row">${featured.map(card).join('')}</div>`:''}${supporters.length?`<div class="sponsor-supporter-heading"><span>CLUB SUPPORTERS</span><i></i></div><div class="sponsor-supporter-grid">${supporters.map(card).join('')}</div>`:''}`;const reviews=all.filter(s=>s.show_testimonial&&String(s.testimonial||'').trim());const mount=document.getElementById('sponsor-testimonials'),section=mount?.closest('.sponsor-testimonials-section');if(mount&&section){if(!reviews.length){section.hidden=true;mount.innerHTML='';}else{mount.innerHTML=reviews.map(review).join('');section.hidden=false;}}}).catch(()=>{box.innerHTML='<p>Sponsor information is temporarily unavailable.</p>';});
})();
