(() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  fetch(`data/archive-history.json?v=${Date.now()}`, {cache:'no-store'})
    .then(res => { if (!res.ok) throw new Error('Archive unavailable'); return res.json(); })
    .then(data => {
      const photos = document.getElementById('archive-photos');
      const documents = document.getElementById('archive-documents');

      if (photos) {
        const albums = Array.isArray(data.photo_albums) ? data.photo_albums : [];
        photos.innerHTML = albums.length
          ? albums.map(item => `<a class="photo-archive-card" href="${esc(item.url)}" target="_blank" rel="noopener"><div><h3>${esc(item.title)}</h3><p>${esc(item.date || '')} · Former Sutton CC Pitchero album</p></div><div class="photo-count">${esc(item.images)}<small>images</small></div></a>`).join('')
          : '<p>No historical photo albums are currently available.</p>';
      }

      if (documents) {
        const rows = Array.isArray(data.documents) ? data.documents : [];
        documents.innerHTML = rows.length
          ? rows.map(item => `<a class="photo-archive-card" href="${esc(item.url || '#')}" target="_blank" rel="noopener"><div><h3>${esc(item.title)}</h3><p>${esc([item.date, item.type].filter(Boolean).join(' · '))}</p>${item.note ? `<p>${esc(item.note)}</p>` : ''}</div><div class="photo-count">${esc(item.type || 'Document')}<small>archive</small></div></a>`).join('')
          : '<p>No historical documents have been recovered yet.</p>';
      }
    })
    .catch(() => {
      const photos = document.getElementById('archive-photos');
      const documents = document.getElementById('archive-documents');
      if (photos) photos.innerHTML = '<p>Historical photo records are temporarily unavailable.</p>';
      if (documents) documents.innerHTML = '<p>Historical document records are temporarily unavailable.</p>';
    });
})();
