(()=>{'use strict';
const input=document.getElementById('archive-photo-search');
const filter=document.getElementById('archive-photo-filter');
const counter=document.getElementById('archive-search-count');
const clear=document.getElementById('archive-search-clear');
if(!input||!counter)return;
const cards=[...document.querySelectorAll('.archive-full-card')];
const sections=[...document.querySelectorAll('[id^="archive-category-"]')];
function update(){
 const q=input.value.trim().toLocaleLowerCase();
 const state=filter?.value||'all';
 let shown=0;
 cards.forEach(card=>{
  const searchable=[
    card.querySelector('.archive-photo-ref')?.textContent,
    card.querySelector('figcaption')?.textContent,
    card.querySelector('.archive-photo-status')?.textContent,
    card.querySelector('.archive-full-thumb')?.getAttribute('aria-label')
  ].join(' ').toLocaleLowerCase();
  const status=card.querySelector('.archive-photo-status');
  const matchesStatus=state==='all'||(state==='confirmed'?status?.classList.contains('archive-photo-confirmed'):status?.classList.contains('archive-photo-unconfirmed'));
  card.hidden=!(matchesStatus&&(!q||searchable.includes(q)));
  if(!card.hidden)shown++;
 });
 sections.forEach(section=>{
  let msg=section.querySelector('.archive-category-empty');
  if(!msg){
   msg=document.createElement('p');
   msg.className='archive-category-empty';
   msg.hidden=true;
   msg.textContent='No photographs in this category match your filters.';
   section.querySelector('.archive-full-grid')?.after(msg);
  }
  if(msg)msg.hidden=!!section.querySelector('.archive-full-card:not([hidden])');
 });
 counter.textContent=shown+' of '+cards.length+' photographs shown';
 clear.hidden=!q&&state==='all';
}
input.addEventListener('input',update);
filter?.addEventListener('change',update);
clear.addEventListener('click',()=>{input.value='';if(filter)filter.value='all';update();input.focus();});
update();
})();
