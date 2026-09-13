(() => {
  const tableBody = document.getElementById('historical-honours-body');
  const search = document.getElementById('honours-search');
  const year = document.getElementById('honours-year');
  const count = document.getElementById('honours-count');
  if (!tableBody) return;

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const seasonFromDate = value => `20${String(value || '').slice(-2)}`;

  let records = [];

  const render = () => {
    const q = String(search?.value || '').trim().toLowerCase();
    const selectedYear = year?.value || 'all';
    const filtered = records.filter(record => {
      const season = seasonFromDate(record.date);
      const haystack = `${record.name} ${record.performance} ${record.opposition} ${record.date}`.toLowerCase();
      return (selectedYear === 'all' || season === selectedYear) && (!q || haystack.includes(q));
    });

    if (count) count.textContent = `${filtered.length} record${filtered.length === 1 ? '' : 's'} shown`;
    tableBody.innerHTML = filtered.length ? filtered.map(record => `
      <tr>
        <td data-label="Year">${escapeHtml(seasonFromDate(record.date))}</td>
        <td data-label="Player"><strong>${escapeHtml(record.name)}</strong></td>
        <td data-label="Performance"><span class="honours-performance">${escapeHtml(record.performance)}</span></td>
        <td data-label="Opposition">${escapeHtml(record.opposition)}</td>
        <td data-label="Date">${escapeHtml(record.date)}</td>
      </tr>`).join('') : '<tr><td colspan="5" class="honours-empty">No honours-board records match that search.</td></tr>';
  };

  fetch(`data/honours-history.json?v=${Date.now()}`, {cache:'no-store'})
    .then(response => {
      if (!response.ok) throw new Error('Historical honours data unavailable');
      return response.json();
    })
    .then(data => {
      records = Array.isArray(data.records) ? data.records.slice() : [];
      records.sort((a,b) => {
        const [ad,am,ay] = a.date.split('/').map(Number);
        const [bd,bm,by] = b.date.split('/').map(Number);
        return new Date(2000 + by,bm-1,bd) - new Date(2000 + ay,am-1,ad);
      });
      render();
    })
    .catch(() => {
      tableBody.innerHTML = '<tr><td colspan="5" class="honours-empty">Historical honours records are temporarily unavailable.</td></tr>';
      if (count) count.textContent = 'Archive unavailable';
    });

  search?.addEventListener('input', render);
  year?.addEventListener('change', render);
})();
