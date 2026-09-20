(() => {
  const dashboard = document.querySelector('.admin-dashboard-section');
  if (!dashboard) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const slugify = value => String(value||'').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,70)||`sponsor-${Date.now()}`;
  const sponsorCard = [...document.querySelectorAll('.admin-dashboard-card')].find(a => a.getAttribute('href') === 'sponsors.html');
  if (sponsorCard) {
    sponsorCard.href = '#sponsors-admin';
    sponsorCard.classList.add('active');
    const b = sponsorCard.querySelector('b'); if (b) b.textContent = 'Manage sponsors →';
    const p = sponsorCard.querySelector('p'); if (p) p.textContent = 'Add, edit, remove and manage sponsor logos and links.';
  }

  const section = document.createElement('section');
  section.id = 'sponsors-admin';
  section.className = 'section admin-sponsors-section';
  section.innerHTML = `<div class="container"><div class="section-heading"><div><p class="eyebrow dark">Sponsors manager</p><h2>Add or edit a sponsor</h2></div><a class="text-link" href="sponsors.html">View sponsors page →</a></div><div class="admin-layout"><form id="sponsor-admin-form" class="admin-panel"><div class="admin-panel-heading"><p class="eyebrow dark">Sponsor editor</p><h2>Sponsor details</h2></div><div class="admin-grid"><label><span>Sponsor name</span><input id="sponsor-name" required maxlength="100" placeholder="e.g. Local Business"></label><label><span>Sponsorship type</span><input id="sponsor-type" required maxlength="80" placeholder="e.g. Banner sponsor"></label><label><span>Website or Facebook page</span><input id="sponsor-website" type="url" placeholder="https://..."></label><label><span>Display order</span><input id="sponsor-order" type="number" min="1" max="99" value="1" required></label></div><label><span>Existing logo path or URL</span><input id="sponsor-logo" placeholder="assets/sponsors/example.png or https://..."></label><label><span>Logo description</span><input id="sponsor-logo-alt" maxlength="160" placeholder="e.g. Example Company logo"></label><div class="admin-image-editor"><div><p class="eyebrow dark">Sponsor logo</p><h3>Choose a new logo</h3><p class="admin-field-help">Choose a JPG, PNG, WebP or SVG. The dashboard will prepare a safe filename for <strong>assets/sponsors/</strong>.</p></div><label><span>Choose logo</span><input id="sponsor-logo-file" type="file" accept="image/jpeg,image/png,image/webp,image/svg+xml"></label><div id="sponsor-logo-preview" class="admin-image-preview"><span>No new logo selected</span></div><div class="admin-image-actions"><button id="sponsor-logo-download" class="btn btn-outline dark-outline" type="button" hidden>Download prepared logo</button><span id="sponsor-logo-path" class="admin-image-path"></span></div></div><div class="admin-actions"><button class="btn btn-primary" type="submit">Preview sponsor</button><button id="sponsor-reset" class="btn btn-outline dark-outline" type="button">Clear form</button></div></form><aside class="admin-panel admin-help"><p class="eyebrow dark">Publishing</p><h2>How it works</h2><ol><li>Add or edit the sponsor.</li><li>If using a new logo, download the prepared logo.</li><li>Upload it into <strong>assets/sponsors/</strong> on GitHub.</li><li>Click <strong>Copy sponsors JSON</strong>.</li><li>Replace <strong>data/sponsors.json</strong> in GitHub and commit.</li></ol><div class="admin-help-links"><a class="text-link" href="https://github.com/fauxy87/sutton-cricket-club/tree/main/assets" target="_blank" rel="noopener">Open assets folder →</a><a class="text-link" href="https://github.com/fauxy87/sutton-cricket-club/blob/main/data/sponsors.json" target="_blank" rel="noopener">Open sponsors.json →</a></div><div id="sponsor-count" class="admin-count">Loading sponsors…</div></aside></div><div class="section-heading admin-manager-heading"><div><p class="eyebrow dark">Preview</p><h2>Sponsor preview</h2></div></div><div id="sponsor-preview" class="admin-preview"><p>Complete the form and choose <strong>Preview sponsor</strong>.</p></div><div id="sponsor-publish-actions" class="admin-publish-actions" hidden><button id="sponsor-copy" class="btn btn-primary" type="button">1. Copy sponsors JSON</button><a class="btn btn-outline dark-outline" href="https://github.com/fauxy87/sutton-cricket-club/blob/main/data/sponsors.json" target="_blank" rel="noopener">2. Open sponsors.json</a><button id="sponsor-download-json" class="btn btn-outline dark-outline" type="button">Download sponsors.json</button><span id="sponsor-status" class="admin-status"></span></div><div class="section-heading admin-manager-heading"><div><p class="eyebrow dark">Current sponsors</p><h2>Edit or remove sponsors</h2></div></div><div id="sponsor-manager-list" class="admin-existing-news"><p>Loading sponsors…</p></div></div>`;
  dashboard.insertAdjacentElement('afterend', section);

  const form = document.getElementById('sponsor-admin-form');
  const name = document.getElementById('sponsor-name');
  const type = document.getElementById('sponsor-type');
  const website = document.getElementById('sponsor-website');
  const order = document.getElementById('sponsor-order');
  const logo = document.getElementById('sponsor-logo');
  const logoAlt = document.getElementById('sponsor-logo-alt');
  const logoFile = document.getElementById('sponsor-logo-file');
  const logoPreview = document.getElementById('sponsor-logo-preview');
  const logoDownload = document.getElementById('sponsor-logo-download');
  const logoPath = document.getElementById('sponsor-logo-path');
  const preview = document.getElementById('sponsor-preview');
  const publish = document.getElementById('sponsor-publish-actions');
  const status = document.getElementById('sponsor-status');
  const count = document.getElementById('sponsor-count');
  let data = {updated_at:'',sponsors:[]};
  let generated = null;
  let editingId = null;
  let preparedFile = null;
  let preparedUrl = '';

  function setLogoPreview(src, alt='Sponsor logo') {
    logoPreview.innerHTML = src ? `<img src="${esc(src)}" alt="${esc(alt)}">` : '<span>No new logo selected</span>';
  }
  function resetFile() {
    if (preparedUrl) URL.revokeObjectURL(preparedUrl);
    preparedFile = null; preparedUrl = ''; logoFile.value=''; logoDownload.hidden=true; logoPath.textContent='';
  }
  logoFile.addEventListener('change', () => {
    resetFile();
    const file = logoFile.files?.[0];
    if (!file) return;
    const extMap = {'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/svg+xml':'svg'};
    const ext = extMap[file.type];
    if (!ext) { status.textContent='Please choose a JPG, PNG, WebP or SVG logo.'; return; }
    const filename = `${slugify(name.value || file.name.replace(/\.[^.]+$/,''))}.${ext}`;
    preparedFile = new File([file], filename, {type:file.type});
    preparedUrl = URL.createObjectURL(preparedFile);
    logo.value = `assets/sponsors/${filename}`;
    if (!logoAlt.value.trim() && name.value.trim()) logoAlt.value = `${name.value.trim()} logo`;
    setLogoPreview(preparedUrl, logoAlt.value || 'Sponsor logo');
    logoDownload.hidden = false;
    logoPath.textContent = `Upload to assets/sponsors/${filename}`;
  });
  logoDownload.addEventListener('click', () => {
    if (!preparedFile) return;
    const a=document.createElement('a'); a.href=preparedUrl; a.download=preparedFile.name; document.body.appendChild(a); a.click(); a.remove();
  });

  function buildSponsor() {
    const existing=editingId?(data.sponsors||[]).find(s=>s.id===editingId):null;
    return {id:editingId || slugify(name.value),name:name.value.trim(),type:type.value.trim(),website:website.value.trim(),logo:logo.value.trim(),logo_alt:logoAlt.value.trim() || `${name.value.trim()} logo`,...(existing?.description?{description:existing.description}:{}),...(existing?.testimonial?{testimonial:existing.testimonial}:{}),...(existing?.testimonial_name?{testimonial_name:existing.testimonial_name}:{}),...(existing?.testimonial_role?{testimonial_role:existing.testimonial_role}:{}),...(existing?.show_testimonial!==undefined?{show_testimonial:existing.show_testimonial}:{}),...(existing?.renewed_years?{renewed_years:existing.renewed_years}:{}),order:Number(order.value)||1};
  }
  function uniqueId(item) {
    if (editingId) return item.id;
    const ids = new Set((data.sponsors||[]).map(s=>s.id));
    if (!ids.has(item.id)) return item.id;
    let n=2; while(ids.has(`${item.id}-${n}`)) n++; return `${item.id}-${n}`;
  }
  function payload(sponsors) {
    return {updated_at:new Date().toISOString().slice(0,10),sponsors:sponsors.slice().sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999))};
  }
  function renderPreview(item, message='Preview ready.') {
    const img = item.logo ? `<div class="admin-sponsor-preview-logo"><img src="${esc(preparedUrl || item.logo)}" alt="${esc(item.logo_alt)}"></div>` : '';
    preview.innerHTML = `<article class="admin-sponsor-preview">${img}<div><span class="tag">${esc(item.type)}</span><h3>${esc(item.name)}</h3><p>Display order: ${esc(item.order)}</p>${item.website?`<p>${esc(item.website)}</p>`:''}</div></article>`;
    publish.hidden=false; status.textContent=message;
  }
  function renewalYear(){return Number(window.SUTTON_CC?.nextSeason)||new Date().getFullYear()+1;}
  function isRenewed(s,year=renewalYear()){return Array.isArray(s.renewed_years)&&s.renewed_years.map(Number).includes(Number(year));}
  function setRenewed(id){const year=renewalYear(),s=(data.sponsors||[]).find(x=>x.id===id);if(!s)return;const years=new Set((s.renewed_years||[]).map(Number));if(years.has(year))years.delete(year);else years.add(year);s.renewed_years=[...years].sort((a,b)=>a-b);generated=payload(data.sponsors);publish.hidden=false;status.textContent=`${s.name} ${years.has(year)?'marked renewed':'renewal removed'} for ${year}. Copy sponsors JSON and commit it to publish.`;renderList();window.dispatchEvent(new CustomEvent('sutton:sponsors-renewal',{detail:{year,sponsors:data.sponsors}}));}
  function renderList() {
    const box=document.getElementById('sponsor-manager-list');
    const items=(data.sponsors||[]).slice().sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999));
    const year=renewalYear(),renewed=items.filter(s=>isRenewed(s,year)).length;count.textContent=`${items.length} sponsors loaded · ${renewed}/${items.length} renewed for ${year}.`;
    box.innerHTML=items.length?items.map(s=>`<article class="admin-news-row"><div class="admin-sponsor-row-main">${s.logo?`<img class="admin-sponsor-row-logo" src="${esc(s.logo)}" alt="">`:''}<div><span class="tag">${esc(s.type||'Sponsor')}</span><h3>${esc(s.name)}</h3><p>Order ${esc(s.order||'—')}${s.website?' · Website linked':''}</p></div></div><div class="admin-news-row-actions"><button class="btn ${isRenewed(s)?'btn-primary':'btn-outline dark-outline'} sponsor-renew" type="button" data-id="${esc(s.id)}">${isRenewed(s)?`✓ Renewed ${renewalYear()}`:`Renewed for ${renewalYear()}`}</button><button class="btn btn-outline dark-outline sponsor-edit" type="button" data-id="${esc(s.id)}">Edit</button><button class="btn admin-delete-news sponsor-delete" type="button" data-id="${esc(s.id)}">Delete</button></div></article>`).join(''):'<p>No sponsors found.</p>';
    box.querySelectorAll('.sponsor-renew').forEach(btn=>btn.addEventListener('click',()=>setRenewed(btn.dataset.id)));
    box.querySelectorAll('.sponsor-edit').forEach(btn=>btn.addEventListener('click',()=>editSponsor(btn.dataset.id)));
    box.querySelectorAll('.sponsor-delete').forEach(btn=>btn.addEventListener('click',()=>deleteSponsor(btn.dataset.id)));
  }
  function editSponsor(id) {
    const s=(data.sponsors||[]).find(x=>x.id===id); if(!s) return;
    editingId=id; name.value=s.name||''; type.value=s.type||''; website.value=s.website||''; order.value=s.order||1; logo.value=s.logo||''; logoAlt.value=s.logo_alt||''; resetFile(); setLogoPreview(s.logo||'',s.logo_alt||'Sponsor logo');
    form.querySelector('button[type="submit"]').textContent='Preview changes'; publish.hidden=true; status.textContent=`Editing: ${s.name}`; form.scrollIntoView({behavior:'smooth',block:'start'});
  }
  function deleteSponsor(id) {
    const s=(data.sponsors||[]).find(x=>x.id===id); if(!s) return;
    if(!confirm(`Delete ${s.name}?\n\nNothing changes on the live site until the updated sponsors.json is committed.`)) return;
    generated=payload((data.sponsors||[]).filter(x=>x.id!==id));
    preview.innerHTML=`<article class="admin-story-preview"><span class="tag">Delete</span><h3>${esc(s.name)}</h3><p>This sponsor will be removed when you publish the updated sponsors JSON.</p></article>`;
    publish.hidden=false; status.textContent='Delete ready. Copy sponsors JSON and commit it in GitHub.';
  }
  function resetEditor() {
    editingId=null; form.reset(); order.value=Math.max(1,(data.sponsors||[]).length+1); resetFile(); setLogoPreview(''); generated=null; publish.hidden=true; status.textContent=''; form.querySelector('button[type="submit"]').textContent='Preview sponsor'; name.focus();
  }
  form.addEventListener('submit', e => {
    e.preventDefault();
    const item=buildSponsor(); item.id=uniqueId(item);
    const sponsors=editingId?(data.sponsors||[]).map(s=>s.id===editingId?item:s):[...(data.sponsors||[]),item];
    generated=payload(sponsors); renderPreview(item, editingId?'Sponsor changes ready.':'New sponsor ready.');
  });
  document.getElementById('sponsor-reset').addEventListener('click',resetEditor);
  document.getElementById('sponsor-copy').addEventListener('click',async()=>{if(!generated)return;try{await navigator.clipboard.writeText(JSON.stringify(generated,null,2)+'\n');status.textContent='Sponsors JSON copied. Paste it into data/sponsors.json on GitHub.';}catch{status.textContent='Clipboard access was blocked. Use Download instead.';}});
  document.getElementById('sponsor-download-json').addEventListener('click',()=>{if(!generated)return;const blob=new Blob([JSON.stringify(generated,null,2)+'\n'],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='sponsors.json';document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);});

  fetch(`data/sponsors.json?v=${Date.now()}`,{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error();return r.json();}).then(json=>{data=json;order.value=Math.max(1,(data.sponsors||[]).length+1);renderList();window.dispatchEvent(new CustomEvent('sutton:sponsors-renewal',{detail:{year:renewalYear(),sponsors:data.sponsors}}));}).catch(()=>{count.textContent='Could not load sponsors. Do not publish until the current data file is available.';document.getElementById('sponsor-manager-list').innerHTML='<p>Sponsor data unavailable.</p>';});
})();
