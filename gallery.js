(() => {
  const feed = document.getElementById('scoreboard-highlights');
  const status = document.getElementById('highlights-feed-status');
  if (!feed) return;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const fmtDate = value => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' });
  };

  function videoCard(item) {
    const title = item.title || 'Match highlights';
    const team = item.team || 'Sutton CC';
    const meta = [fmtDate(item.date), item.opponent, item.result].filter(Boolean).join(' · ');
    const tags = Array.isArray(item.moments) ? item.moments.slice(0, 6) : [];
    const poster = item.poster ? ` poster="${esc(item.poster)}"` : '';
    const type = item.type || 'video/mp4';
    const source = item.video_url || item.url || '';
    const matchUrl = item.match_id ? `match.html?id=${encodeURIComponent(item.match_id)}` : '';

    return `<article class="video-feature scoreboard-video-card">
      <div class="video-player-wrap">
        ${source ? `<video controls preload="metadata" playsinline${poster}><source src="${esc(source)}" type="${esc(type)}">Your browser does not support video playback.</video>` : `<div class="video-placeholder"><span class="play-button">▶</span><div><strong>${esc(title)}</strong><small>Video file awaiting upload</small></div></div>`}
      </div>
      <div class="video-copy">
        <div class="highlight-card-top"><span class="tag">${esc(team)}</span>${item.kind ? `<span class="highlight-kind">${esc(item.kind)}</span>` : ''}</div>
        <h3>${esc(title)}</h3>
        ${meta ? `<p>${esc(meta)}</p>` : ''}
        ${tags.length ? `<div class="moment-tags">${tags.map(t => `<span>${esc(t)}</span>`).join('')}</div>` : ''}
        ${matchUrl ? `<p class="highlight-match-link"><a class="text-link" href="${matchUrl}">View scorecard →</a></p>` : ''}
      </div>
    </article>`;
  }

  async function load() {
    try {
      const res = await fetch(`data/highlights.json?v=${Date.now()}`, { cache:'no-store' });
      if (!res.ok) throw new Error('Highlights feed unavailable');
      const data = await res.json();
      const items = Array.isArray(data.highlights) ? data.highlights : [];

      if (!items.length) {
        feed.innerHTML = `<article class="highlights-empty-state">
          <div class="highlights-empty-icon">▶</div>
          <div><p class="eyebrow dark">Connected and ready</p><h3>Scoreboard highlights will appear here automatically</h3><p>The website now reads a live highlight feed. Once a completed match video is published by Sutton Scoreboard OS, it will be added here without rebuilding this page.</p></div>
        </article>`;
        if (status) status.innerHTML = '<span class="status-dot"></span> Highlights feed ready';
        return;
      }

      const ordered = items.slice().sort((a,b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0));
      feed.innerHTML = ordered.map(videoCard).join('');
      if (status) {
        const updated = data.generated_at ? ` · updated ${fmtDate(data.generated_at)}` : '';
        status.innerHTML = `<span class="status-dot"></span> ${ordered.length} highlight${ordered.length === 1 ? '' : 's'} available${updated}`;
      }
    } catch (err) {
      feed.innerHTML = `<article class="highlights-empty-state"><div class="highlights-empty-icon">!</div><div><h3>Highlights feed is temporarily unavailable</h3><p>Please try again shortly.</p></div></article>`;
      if (status) status.textContent = 'Highlights feed unavailable';
    }
  }

  load();
})();
