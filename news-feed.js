(() => {
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const formatDate = value => {
    if (!value) return '';
    const d = new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
  };
  const articleHref = item => `article.html?id=${encodeURIComponent(item.id)}`;
  const imageHtml = (item,cls) => item.image ? `<a class="${cls}" href="${articleHref(item)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.image_alt || item.title || 'Sutton Cricket Club news')}"></a>` : '';

  function newsCard(item) {
    return `<article class="news-list-card" data-news-card="${escapeHtml(item.category || 'club')}">${imageHtml(item,'news-list-image')}<div class="news-list-body"><div class="news-card-meta"><span class="tag">${escapeHtml(item.category_label || 'Club News')}</span><time datetime="${escapeHtml(item.date || '')}">${escapeHtml(formatDate(item.date))}</time></div><h2><a href="${articleHref(item)}">${escapeHtml(item.title)}</a></h2><p>${escapeHtml(item.summary || '')}</p><a class="text-link" href="${articleHref(item)}">Read story →</a></div></article>`;
  }

  function homeCard(item,index) {
    return `<article class="news-card${index===0?' feature':''}">${imageHtml(item,'news-home-image')}<div class="news-body"><div class="news-card-meta"><span class="tag">${escapeHtml(item.team || item.category_label || 'Club')}</span><time datetime="${escapeHtml(item.date || '')}">${escapeHtml(formatDate(item.date))}</time></div><h3><a href="${articleHref(item)}">${escapeHtml(item.title)}</a></h3><p>${escapeHtml(item.summary || '')}</p></div></article>`;
  }

  function activateFilters() {
    const buttons = document.querySelectorAll('.news-filter');
    const cards = document.querySelectorAll('[data-news-card]');
    if (!buttons.length || !cards.length) return;
    buttons.forEach(btn => {
      btn.onclick = () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.dataset.news;
        cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.newsCard !== category; });
      };
    });
  }

  fetch(`data/news.json?v=${Date.now()}`,{cache:'no-store'})
    .then(res => { if (!res.ok) throw new Error('News unavailable'); return res.json(); })
    .then(data => {
      const items = Array.isArray(data.articles) ? data.articles.slice() : [];
      items.sort((a,b) => String(b.date||'').localeCompare(String(a.date||'')));
      const list = document.getElementById('news-list');
      if (list) {
        list.innerHTML = items.length ? items.map(newsCard).join('') : '<article class="news-list-card"><div class="news-list-body"><h2>No news yet</h2><p>Club stories will appear here as they are published.</p></div></article>';
        activateFilters();
      }
      const home = document.querySelector('#news .news-grid');
      if (home) home.innerHTML = items.slice(0,3).map(homeCard).join('');
    })
    .catch(() => {
      const list = document.getElementById('news-list');
      if (list) list.innerHTML = '<article class="news-list-card"><div class="news-list-body"><h2>News temporarily unavailable</h2><p>Please try again shortly.</p></div></article>';
    });
})();