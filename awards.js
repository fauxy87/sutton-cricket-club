(() => {
  const root = document.getElementById('awards-years');
  const search = document.getElementById('awards-search');
  const year = document.getElementById('awards-year');
  const count = document.getElementById('awards-count');
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let seasons = [];

  function rowsFor(season) {
    return season.groups.flatMap(group => group.awards.map(([award,winner]) => ({group:group.name,award,winner})));
  }

  function render() {
    const q = (search.value || '').trim().toLowerCase();
    const y = year.value;
    const visible = seasons.map(season => {
      const rows = rowsFor(season).filter(r => !q || `${r.group} ${r.award} ${r.winner}`.toLowerCase().includes(q));
      return {season,rows};
    }).filter(x => (!y || String(x.season.year) === y) && x.rows.length);

    const total = visible.reduce((sum,x)=>sum+x.rows.length,0);
    count.textContent = `${total} award ${total===1?'entry':'entries'}`;

    root.innerHTML = visible.length ? visible.map(({season,rows}) => {
      const groups = season.groups.map(group => {
        const filtered = group.awards.filter(([award,winner]) => !q || `${group.name} ${award} ${winner}`.toLowerCase().includes(q));
        if (!filtered.length) return '';
        return `<section class="award-group"><h3>${esc(group.name)}</h3><div class="award-list">${filtered.map(([award,winner])=>`<div class="award-row"><span>${esc(award)}</span><strong>${esc(winner)}</strong></div>`).join('')}</div></section>`;
      }).join('');
      return `<article class="award-year" id="year-${season.year}"><div class="award-year-head"><span>Season</span><h2>${season.year}</h2></div><div class="award-groups">${groups}</div></article>`;
    }).join('') : '<div class="awards-empty"><h2>No awards found</h2><p>Try another year or search term.</p></div>';
  }

  fetch(`data/club-awards.json?v=${Date.now()}`, {cache:'no-store'})
    .then(r => { if (!r.ok) throw new Error('Awards archive unavailable'); return r.json(); })
    .then(data => {
      seasons = Array.isArray(data.seasons) ? data.seasons : [];
      seasons.slice().sort((a,b)=>b.year-a.year).forEach(s => {
        const option = document.createElement('option');
        option.value = s.year;
        option.textContent = s.year;
        year.appendChild(option);
      });
      render();
    })
    .catch(err => { root.innerHTML = `<div class="awards-empty"><h2>Archive unavailable</h2><p>${esc(err.message)}</p></div>`; });

  search.addEventListener('input',render);
  year.addEventListener('change',render);
  document.getElementById('awards-clear').addEventListener('click',()=>{search.value='';year.value='';render();});
})();
