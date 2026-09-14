(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const formatDate = value => {
    if (!value) return 'Date not recorded';
    const d = new Date(`${value}T12:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'});
  };

  fetch(`data/archive-history.json?v=${Date.now()}`, {cache:'no-store'})
    .then(res => { if (!res.ok) throw new Error('Archive unavailable'); return res.json(); })
    .then(data => {
      const photos = document.getElementById('archive-photos');
      if (!photos) return;

      const albums = Array.isArray(data.photo_albums) ? data.photo_albums : [];
      photos.innerHTML = albums.length
        ? albums.map((item, index) => `
          <a class="archive-album-card${index === 0 ? ' archive-album-featured' : ''}" href="${esc(item.url)}" target="_blank" rel="noopener">
            <div class="archive-album-visual" aria-hidden="true">
              <img src="assets/sutton-cc-badge.png?v=20260912c" alt="">
              <span>${esc(item.images)} photos</span>
            </div>
            <div class="archive-album-copy">
              <span class="archive-album-kicker">Historical album</span>
              <h3>${esc(item.title)}</h3>
              <p>${esc(formatDate(item.date))}</p>
              <div class="archive-album-meta"><strong>${esc(item.images)} images</strong><span>Open original album →</span></div>
            </div>
          </a>`).join('')
        : '<div class="archive-empty"><h3>No historical photo albums available yet</h3><p>Verified albums will appear here as they are recovered.</p></div>';
    })
    .catch(() => {
      const photos = document.getElementById('archive-photos');
      if (photos) photos.innerHTML = '<div class="archive-empty"><h3>Photo archive temporarily unavailable</h3><p>Please try again shortly.</p></div>';
    });
})();
