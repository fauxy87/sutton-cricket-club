(() => {
 const box=document.getElementById('admin-sitecheck-box'),summary=document.getElementById('admin-sitecheck-summary');if(!box)return;
 const pages=['index.html','teams.html','fixtures.html','juniors.html','news.html','honours.html','gallery.html','fantasy.html','weekly-draw.html','sponsors.html','join.html'];
 const sameOrigin=u=>{try{return new URL(u,location.href).origin===location.origin}catch{return false}};
 const normalise=u=>{const x=new URL(u,location.href);x.hash='';return x.href};
 const load=async url=>{const r=await fetch(url+(url.includes('?')?'&':'?')+'check='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error(r.status);return r.text()};
 Promise.allSettled(pages.map(async page=>({page,html:await load(page)}))).then(async results=>{
  const failures=[],targets=new Map();
  results.forEach((r,i)=>{if(r.status!=='fulfilled'){failures.push({type:'Page',where:pages[i],target:pages[i],reason:'Could not load page'});return}const doc=new DOMParser().parseFromString(r.value.html,'text/html');doc.querySelectorAll('a[href],img[src]').forEach(el=>{const raw=el.getAttribute(el.tagName==='IMG'?'src':'href');if(!raw||raw.startsWith('#')||raw.startsWith('mailto:')||raw.startsWith('tel:')||raw.startsWith('javascript:')||!sameOrigin(raw))return;const url=normalise(raw);if(!targets.has(url))targets.set(url,{where:r.value.page||pages[i],type:el.tagName==='IMG'?'Image':'Link',target:raw})})});
  const checks=await Promise.allSettled([...targets].map(async([url,meta])=>{const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw {meta,status:res.status};return meta}));
  checks.forEach((r,i)=>{if(r.status==='rejected'){const item=[...targets.values()][i];failures.push({...item,reason:'HTTP '+(r.reason?.status||'error')})}});
  summary.textContent=failures.length?failures.length+' issue'+(failures.length===1?'':'s'):'All clear';
  box.className='admin-sitecheck-box '+(failures.length?'has-issues':'is-clear');
  box.innerHTML=failures.length?`<strong>Found ${failures.length} item${failures.length===1?'':'s'} to check</strong><p>These checks cover the main navigation pages and their internal links/images.</p><div class="admin-sitecheck-list">${failures.slice(0,12).map(x=>`<div><b>${x.type}: ${x.target}</b><span>${x.where} · ${x.reason}</span></div>`).join('')}${failures.length>12?'<div><b>More issues found</b><span>Showing the first 12.</span></div>':''}</div>`:'<strong>✓ Links and images look good</strong><p>The main public pages loaded successfully and no broken internal links or images were found.</p>';
 });
})();