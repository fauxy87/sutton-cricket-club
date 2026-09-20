(()=>{
const page=document.body.dataset.teamPage||'';
const map={first:['1st XI captain','first_xi_captain'],second:['2nd XI captain','second_xi_captain'],development:['Development XI captain','development_xi_captain'],women:['Women & Girls lead / captain','women_lead'],u14:['Junior lead / coach','junior_lead']};
const esc=v=>String(v??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
fetch('data/team-officials.json?v='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(data=>{const item=map[page],details=data.details||{};if(item&&details[item[1]]){const hero=document.querySelector('.page-hero .container');if(hero)hero.insertAdjacentHTML('beforeend','<div class="team-official-live"><span>'+esc(item[0])+'</span><strong>'+esc(details[item[1]])+'</strong></div>');}
if(document.body.dataset.committeePage==='true'){const roles=[['Chairperson','chairperson'],['Hon. Treasurer','treasurer'],['Hon. Secretary','secretary'],['Club Captain','club_captain'],['Club Safeguarding Officer','safeguarding']];document.querySelectorAll('.committee-card').forEach(card=>{const role=card.querySelector('.role')?.textContent.trim(),match=roles.find(r=>r[0]===role);if(!match||!details[match[1]])return;const name=details[match[1]],h=card.querySelector('h3'),initials=card.querySelector('.committee-initials');if(h)h.textContent=name;if(initials)initials.textContent=name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();});}}
).catch(()=>{});
})();
