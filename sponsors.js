(() => {
  const box = document.getElementById('sponsor-showcase');
  if (!box) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const safeHref = value => {
    const href = String(value || '').trim();
    return /^https?:\/\//i.test(href) ? href : '';
  };
  fetch(`data/sponsors.json?v=${Date.now()}`, {cache:'no-store'})
    .then(res => { if (!res.ok) throw new Error(); return res.json(); })
    .then(data => {
      const sponsors = Array.isArray(data.sponsors) ? data.sponsors.slice() : [];
      sponsors.sort((a,b)=>(Number(a.order)||999)-(Number(b.order)||999));
      if (!sponsors.length) {
        box.innerHTML = '<p>No sponsors are currently listed.</p>';
        return;
      }
      box.innerHTML = sponsors.map(s => {
        const logo = s.logo ? `<div class="sponsor-mark sponsor-logo"><img src="${esc(s.logo)}" alt="${esc(s.logo_alt || `${s.name} logo`)}"></div>` : '<div class="sponsor-mark sponsor-logo sponsor-logo-placeholder">Sponsor</div>';
        const body = `${logo}<h3>${esc(s.name)}</h3><p>${esc(s.type || 'Club supporter')}${safeHref(s.website) ? ' · Visit website →' : ''}</p>`;
        return safeHref(s.website)
          ? `<article class="sponsor-showcase-card"><a class="sponsor-logo-link" href="${esc(s.website)}" target="_blank" rel="noopener">${body}</a></article>`
          : `<article class="sponsor-showcase-card">${body}</article>`;
      }).join('');
    })
    .catch(() => {
      box.innerHTML = '<p>Sponsor information is temporarily unavailable.</p>';
    });
})();
