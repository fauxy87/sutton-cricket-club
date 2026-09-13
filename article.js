(() => {
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
      title.textContent = item.title;
      category.textContent = item.category_label || 'Club News';
      summary.textContent = item.summary || '';
      date.textContent = formatDate(item.date || '');
      const body = Array.isArray(item.body) ? item.body.map(p => `<p>${escapeHtml(p)}</p>`).join('') : '';
      const links = Array.isArray(item.links) && item.links.length ? `<div class="article-actions">${item.links.map((link,index) => `<a class="btn ${index===0?'btn-primary':'btn-outline'}" href="${escapeHtml(link.href)}">${escapeHtml(link.label)}</a>`).join('')}</div>` : '';
      content.innerHTML = `<span class="tag">${escapeHtml(item.team || item.category_label || 'Club News')}</span><p class="article-lead">${escapeHtml(item.lead || item.summary || '')}</p><div class="article-copy">${body}</div>${links}`;
    })
    .catch(err => {
      title.textContent = 'Story unavailable';
      category.textContent = 'Club news';
      summary.textContent = '';
      date.textContent = '';
      content.innerHTML = `<p class="article-lead">${escapeHtml(err.message)}. Return to the Club News page to browse available stories.</p>`;
    });
})();