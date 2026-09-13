const $ = id => document.getElementById(id);
const form = $('news-form');
const statusBox = $('news-status');
const listBox = $('news-existing');
const preview = $('news-preview');
const imageInput = $('news-image');
const imageAlt = $('news-image-alt');
const removeImage = $('news-remove-image');
let articles = [];
let editingId = '';
let preparedImage = null;

const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const formatDate = value => {
  const d = new Date(`${value}T12:00:00`);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
};
const paragraphs = value => String(value || '').split(/\n+/).map(v => v.trim()).filter(Boolean);

function setStatus(message, kind='info') {
  statusBox.textContent = message;
  statusBox.className = `secure-status ${kind}`;
  statusBox.hidden = false;
}

function currentArticleFromForm() {
  return {
    title: $('news-title').value.trim(),
    date: $('news-date').value,
    category: $('news-category').value,
    team: $('news-team').value.trim(),
    summary: $('news-summary').value.trim(),
    lead: $('news-lead').value.trim(),
    body: paragraphs($('news-body').value),
    image_alt: imageAlt.value.trim(),
    remove_image: removeImage.checked
  };
}

function currentExisting() {
  return editingId ? articles.find(a => a.id === editingId) : null;
}

function renderPreview() {
  const a = currentArticleFromForm();
  const existing = currentExisting();
  let imageHtml = '';
  if (preparedImage?.preview) imageHtml = `<img class="secure-preview-image" src="${preparedImage.preview}" alt="${esc(a.image_alt || a.title)}">`;
  else if (existing?.image && !a.remove_image) imageHtml = `<img class="secure-preview-image" src="https://fauxy87.github.io/sutton-cricket-club/${esc(existing.image)}" alt="${esc(a.image_alt || existing.image_alt || a.title)}">`;
  preview.innerHTML = `<article>${imageHtml}<div class="secure-meta"><span>${esc(a.category || 'club')}</span><span>${esc(formatDate(a.date || ''))}</span>${a.team?`<span>${esc(a.team)}</span>`:''}</div><h3>${esc(a.title || 'Your headline will appear here')}</h3><p class="secure-summary">${esc(a.summary || 'Short summary')}</p><p>${esc(a.lead || 'Opening paragraph')}</p>${a.body.map(p=>`<p>${esc(p)}</p>`).join('')}</article>`;
}

function resetForm() {
  editingId = '';
  preparedImage = null;
  form.reset();
  $('news-date').value = new Date().toISOString().slice(0,10);
  $('news-form-title').textContent = 'Add a news story';
  $('news-publish').textContent = 'Publish story';
  $('news-cancel-edit').hidden = true;
  $('current-image-note').textContent = '';
  renderPreview();
  window.scrollTo({top:$('news-manager').offsetTop - 20,behavior:'smooth'});
}

function renderList() {
  if (!articles.length) {
    listBox.innerHTML = '<p>No stories found.</p>';
    return;
  }
  const sorted = articles.slice().sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')));
  listBox.innerHTML = sorted.map(a => `<article class="secure-news-row"><div class="secure-news-row-main">${a.image?`<img src="https://fauxy87.github.io/sutton-cricket-club/${esc(a.image)}" alt="">`:''}<div><span class="secure-tag">${esc(a.category_label || 'News')}</span><h3>${esc(a.title)}</h3><p>${esc(formatDate(a.date))}${a.team?` · ${esc(a.team)}`:''}</p></div></div><div class="secure-row-actions"><button type="button" data-edit="${esc(a.id)}">Edit</button><button type="button" class="danger" data-delete="${esc(a.id)}">Delete</button></div></article>`).join('');
  listBox.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click',()=>editStory(btn.dataset.edit)));
  listBox.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click',()=>deleteStory(btn.dataset.delete)));
}

function editStory(id) {
  const a = articles.find(item => item.id === id);
  if (!a) return;
  editingId = id;
  preparedImage = null;
  $('news-title').value = a.title || '';
  $('news-date').value = a.date || '';
  $('news-category').value = a.category || 'club';
  $('news-team').value = a.team || '';
  $('news-summary').value = a.summary || '';
  $('news-lead').value = a.lead || '';
  $('news-body').value = Array.isArray(a.body) ? a.body.join('\n\n') : '';
  imageAlt.value = a.image_alt || '';
  removeImage.checked = false;
  imageInput.value = '';
  $('news-form-title').textContent = 'Edit news story';
  $('news-publish').textContent = 'Save changes';
  $('news-cancel-edit').hidden = false;
  $('current-image-note').textContent = a.image ? `Current picture: ${a.image}` : 'This story has no picture.';
  renderPreview();
  $('news-manager').scrollIntoView({behavior:'smooth',block:'start'});
}

async function loadNews() {
  try {
    const res = await fetch('/api/news',{cache:'no-store'});
    if (res.status === 401) { location.href='/'; return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load news');
    articles = data.articles || [];
    $('news-count').textContent = `${articles.length} published ${articles.length===1?'story':'stories'}`;
    renderList();
  } catch (error) {
    setStatus(error.message,'error');
  }
}

async function resizeImage(file) {
  if (!file) return null;
  if (!['image/jpeg','image/png','image/webp'].includes(file.type)) throw new Error('Please choose a JPG, PNG or WebP picture.');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((resolve,reject)=>{const el=new Image();el.onload=()=>resolve(el);el.onerror=reject;el.src=url;});
    const maxW = 1600, maxH = 1200;
    const scale = Math.min(1,maxW/img.width,maxH/img.height);
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1,Math.round(img.width*scale));
    canvas.height = Math.max(1,Math.round(img.height*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const data = canvas.toDataURL('image/jpeg',0.82);
    return { type:'image/jpeg', data, preview:data };
  } finally {
    URL.revokeObjectURL(url);
  }
}

imageInput.addEventListener('change', async () => {
  try {
    preparedImage = await resizeImage(imageInput.files?.[0]);
    removeImage.checked = false;
    if (!imageAlt.value && $('news-title').value) imageAlt.value = $('news-title').value;
    setStatus('Picture prepared and ready to publish.','success');
    renderPreview();
  } catch (error) {
    preparedImage = null;
    imageInput.value = '';
    setStatus(error.message,'error');
  }
});

removeImage.addEventListener('change',()=>{if(removeImage.checked){preparedImage=null;imageInput.value='';}renderPreview();});
form.querySelectorAll('input,select,textarea').forEach(el=>el.addEventListener('input',renderPreview));
$('news-cancel-edit').addEventListener('click',resetForm);
$('news-clear').addEventListener('click',resetForm);

form.addEventListener('submit', async event => {
  event.preventDefault();
  const article = currentArticleFromForm();
  if (!article.title || !article.date || !article.summary || !article.lead) {
    setStatus('Please complete the headline, date, summary and opening paragraph.','error');
    return;
  }
  const verb = editingId ? 'save these changes' : 'publish this story';
  if (!confirm(`Ready to ${verb} on the Sutton Cricket Club website?`)) return;
  const button = $('news-publish');
  button.disabled = true;
  setStatus(editingId ? 'Saving changes…' : 'Publishing story…');
  try {
    const res = await fetch('/api/news',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({action:'save',original_id:editingId,article,image:preparedImage ? {type:preparedImage.type,data:preparedImage.data}:null})
    });
    if (res.status === 401) { location.href='/'; return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Publishing failed');
    setStatus(data.message || 'Published.','success');
    await loadNews();
    resetForm();
  } catch (error) {
    setStatus(error.message,'error');
  } finally {
    button.disabled = false;
  }
});

async function deleteStory(id) {
  const a = articles.find(item=>item.id===id);
  if (!a || !confirm(`Delete “${a.title}” from the website?`)) return;
  setStatus('Deleting story…');
  try {
    const res = await fetch('/api/news',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',id})});
    if (res.status === 401) { location.href='/'; return; }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Delete failed');
    setStatus(data.message || 'Story deleted.','success');
    if (editingId===id) resetForm();
    await loadNews();
  } catch (error) {
    setStatus(error.message,'error');
  }
}

$('news-date').value = new Date().toISOString().slice(0,10);
renderPreview();
loadNews();
