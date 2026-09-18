(() => {
  const style=document.createElement('style');
  style.textContent='.article-image{margin:0 0 28px}.article-image img{display:block;width:100%;max-height:560px;object-fit:cover;border-radius:16px}.article-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:0 0 30px}.article-gallery figure{margin:0}.article-gallery img{display:block;width:100%;height:300px;object-fit:cover;border-radius:14px}.article-gallery figure:first-child{grid-column:1/-1}.article-gallery figure:first-child img{height:min(560px,60vw)}@media(max-width:600px){.article-image img,.article-gallery img{border-radius:12px}.article-gallery{grid-template-columns:1fr}.article-gallery figure:first-child{grid-column:auto}.article-gallery img,.article-gallery figure:first-child img{height:auto;max-height:520px}}';
  document.head.appendChild(style);
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const id = new URLSearchParams(location.search).get('id');
  const title = document.getElementById('article-title');
  const category = document.getElementById('article-category');
  const summary = document.getElementById('article-summary');
  const date = document.getElementById('article-date');
  const content = document.getElementById('article-content');
  const formatDate = value => {
    const d = new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  };
  const galleryItems = item => {
    if (Array.isArray(item.images) && item.images.length) return item.images.map(entry => typeof entry === 'string' ? {src:entry,alt:item.image_alt || item.title} : {src:entry.src || entry.image || '',alt:entry.alt || entry.image_alt || item.image_alt || item.title}).filter(entry=>entry.src);
    return item.image ? [{src:item.image,alt:item.image_alt || item.title}] : [];
  };
  if (!id) {
    title.textContent = 'Story not selected';
    content.innerHTML = '<p class="article-lead">Choose a story from the Club News page.</p>';
    return;
  }
  fetch(`data/news.json?v=${Date.now()}`,{cache:'no-store'})
    .then(res => { if (!res.ok) throw new Error('News unavailable'); return res.json(); })
    .then(data => {
      const item = (data.articles || []).find(article => article.id === id);
      if (!item) throw new Error('Story not found');
      document.title = `${item.title} | Sutton Cricket Club`;
      const canonicalUrl = `${location.origin}${location.pathname}?id=${encodeURIComponent(item.id)}`;
      let canonical = document.querySelector('link[rel="canonical"]');
      if (!canonical) { canonical = document.createElement('link'); canonical.rel = 'canonical'; document.head.appendChild(canonical); }
      canonical.href = canonicalUrl;
      const setMeta = (selector, attr, name, value) => {
        let el = document.querySelector(selector);
        if (!el) { el = document.createElement('meta'); el.setAttribute(attr,name); document.head.appendChild(el); }
        el.setAttribute('content', value || '');
      };
      setMeta('meta[name="description"]','name','description',item.summary || item.lead || 'Sutton Cricket Club news.');
      setMeta('meta[property="og:title"]','property','og:title',item.title);
      setMeta('meta[property="og:description"]','property','og:description',item.summary || item.lead || 'Sutton Cricket Club news.');
      setMeta('meta[property="og:url"]','property','og:url',canonicalUrl);
      setMeta('meta[property="og:type"]','property','og:type','article');
      setMeta('meta[name="twitter:card"]','name','twitter:card',item.image ? 'summary_large_image' : 'summary');
      setMeta('meta[name="twitter:title"]','name','twitter:title',item.title);
      setMeta('meta[name="twitter:description"]','name','twitter:description',item.summary || item.lead || 'Sutton Cricket Club news.');
      if (item.image) {
        const imageUrl = new URL(item.image, location.href).href;
        setMeta('meta[property="og:image"]','property','og:image',imageUrl);
        setMeta('meta[name="twitter:image"]','name','twitter:image',imageUrl);
      }
      title.textContent = item.title;
      category.textContent = item.category_label || 'Club News';
      summary.textContent = item.summary || '';
      date.textContent = formatDate(item.date || '');
      const photos = galleryItems(item);
      const image = photos.length ? (photos.length === 1
        ? `<figure class="article-image"><img src="${escapeHtml(photos[0].src)}" alt="${escapeHtml(photos[0].alt || item.title || 'Sutton Cricket Club news')}"></figure>`
        : `<div class="article-gallery">${photos.map(photo=>`<figure><img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt || item.title || 'Sutton Cricket Club news')}"></figure>`).join('')}</div>`)
        : '';
      const body = Array.isArray(item.body) ? item.body.map(p => `<p>${escapeHtml(p)}</p>`).join('') : '';
      const links = Array.isArray(item.links) && item.links.length ? `<div class="article-actions">${item.links.map((link,index) => `<a class="btn ${index===0?'btn-primary':'btn-outline'}" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>` : '';
      content.innerHTML = `${image}<span class="tag">${escapeHtml(item.team || item.category_label || 'Club News')}</span><p class="article-lead">${escapeHtml(item.lead || item.summary || '')}</p><div class="article-copy">${body}</div>${links}`;
    })
    .catch(err => {
      title.textContent = 'Story unavailable';
      category.textContent = 'Club news';
      summary.textContent = '';
      date.textContent = '';
      content.innerHTML = `<p class="article-lead">${escapeHtml(err.message)}. Return to the Club News page to browse available stories.</p>`;
    });
})();
