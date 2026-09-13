(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  fetch(`data/archive-history.json?v=${Date.now()}`, {cache:'no-store'})
    .then(res => { if (!res.ok) throw new Error('Archive unavailable'); return res.json(); })
    .then(data => {
      const officers = document.getElementById('archive-officers');
      const photos = document.getElementById('archive-photos');
      if (officers) {
        const rows = Array.isArray(data.historical_officers) ? data.historical_officers : [];
        officers.innerHTML = rows.length ? rows.map(item => `<article class="officer-card"><strong>${esc(item.name)}</strong><span>${esc(item.role)}</span></article>`).join('') : '<p>No historical officer records are currently available.</p>';
      }
      if (photos) {
        const albums = Array.isArray(data.photo_albums) ? data.photo_albums : [];
        photos.innerHTML = albums.length ? albums.map(item => `<a class="photo-archive-card" href="${esc(item.url)}" target="_blank" rel="noopener"><div><h3>${esc(item.title)}</h3><p>${esc(item.date || '')} · Former Sutton CC Pitchero album</p></div><div class="photo-count">${esc(item.images)}<small>images</small></div></a>`).join('') : '<p>No historical photo albums are currently available.</p>';
      }
    })
    .catch(() => {
      const officers = document.getElementById('archive-officers');
      const photos = document.getElementById('archive-photos');
      if (officers) officers.innerHTML = '<p>Historical officer records are temporarily unavailable.</p>';
      if (photos) photos.innerHTML = '<p>Historical photo records are temporarily unavailable.</p>';
    });
})();
