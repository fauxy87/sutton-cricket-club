const form=document.getElementById('news-admin-form');
const title=document.getElementById('admin-title');
const date=document.getElementById('admin-date');
const category=document.getElementById('admin-category');
const team=document.getElementById('admin-team');
const summary=document.getElementById('admin-summary');
const lead=document.getElementById('admin-lead');
const body=document.getElementById('admin-body');
const preview=document.getElementById('admin-preview');
const publishActions=document.getElementById('admin-publish-actions');
const downloadBtn=document.getElementById('admin-download');
const copyBtn=document.getElementById('admin-copy');
const resetBtn=document.getElementById('admin-reset');
const status=document.getElementById('admin-status');
const count=document.getElementById('admin-existing-count');
let currentNews={updated_at:'',articles:[]};
let generatedNews=null;

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={club:'Club News',match:'Match Report',community:'Community',juniors:'Juniors',women:'Women & Girls',event:'Events'};
function slugify(value){return String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||`news-${Date.now()}`;}
function defaultLinks(cat){if(cat==='match')return[{label:'Fixtures & results',href:'fixtures.html'},{label:'Player statistics',href:'honours.html'}];if(cat==='juniors')return[{label:'Junior cricket',href:'juniors.html'},{label:'Contact the club',href:'join.html'}];if(cat==='women')return[{label:'Women’s cricket',href:'team-women.html'},{label:'Contact the club',href:'join.html'}];return[{label:'More club news',href:'news.html'},{label:'Contact the club',href:'join.html'}];}
function paragraphs(value){return String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean);}
function formatDate(value){if(!value)return'';const d=new Date(`${value}T12:00:00`);return d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});}
function buildArticle(){const article={id:slugify(title.value),title:title.value.trim(),date:date.value,category:category.value,category_label:labels[category.value]||'Club News'};if(team.value.trim())article.team=team.value.trim();article.summary=summary.value.trim();article.lead=lead.value.trim();article.body=paragraphs(body.value);article.links=defaultLinks(category.value);return article;}
function makeUniqueId(article){const ids=new Set((currentNews.articles||[]).map(a=>a.id));if(!ids.has(article.id))return article.id;let i=2;while(ids.has(`${article.id}-${i}`))i++;return `${article.id}-${i}`;}
function renderPreview(article){preview.innerHTML=`<article class="admin-story-preview"><div class="admin-story-meta"><span class="tag">${esc(article.category_label)}</span><span>${esc(formatDate(article.date))}</span>${article.team?`<span>${esc(article.team)}</span>`:''}</div><h3>${esc(article.title)}</h3><p class="admin-story-summary">${esc(article.summary)}</p><p class="admin-story-lead">${esc(article.lead)}</p>${article.body.map(p=>`<p>${esc(p)}</p>`).join('')}<p><a class="text-link" href="article.html?id=${encodeURIComponent(article.id)}">Future article link →</a></p></article>`;}
async function loadNews(){try{const res=await fetch(`data/news.json?v=${Date.now()}`,{cache:'no-store'});if(!res.ok)throw new Error();currentNews=await res.json();count.textContent=`${(currentNews.articles||[]).length} existing stor${(currentNews.articles||[]).length===1?'y':'ies'} loaded.`;}catch(e){count.textContent='Could not load current news. Do not publish until the existing file is available.';currentNews={updated_at:'',articles:[]};}}
form?.addEventListener('submit',e=>{e.preventDefault();const article=buildArticle();article.id=makeUniqueId(article);generatedNews={updated_at:new Date().toISOString().slice(0,10),articles:[article,...(currentNews.articles||[])]};renderPreview(article);publishActions.hidden=false;status.textContent='Preview ready.';});
downloadBtn?.addEventListener('click',()=>{if(!generatedNews)return;const blob=new Blob([JSON.stringify(generatedNews,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='news.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);status.textContent='news.json downloaded.';});
copyBtn?.addEventListener('click',async()=>{if(!generatedNews)return;try{await navigator.clipboard.writeText(JSON.stringify(generatedNews,null,2)+'\n');status.textContent='JSON copied to clipboard.';}catch(e){status.textContent='Clipboard access was blocked. Use Download instead.';}});
resetBtn?.addEventListener('click',()=>{form.reset();date.value=new Date().toISOString().slice(0,10);preview.innerHTML='<p>Complete the form and choose <strong>Preview story</strong>.</p>';publishActions.hidden=true;generatedNews=null;status.textContent='';title.focus();});
if(date&&!date.value)date.value=new Date().toISOString().slice(0,10);
loadNews();