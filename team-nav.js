(() => {
  const page = document.body.dataset.teamPage;
  if (!page) return;

  const teams = [
    { key: '1st', label: '1st XI', href: 'team-1st-xi.html' },
    { key: '2nd', label: '2nd XI', href: 'team-2nd-xi.html' },
    { key: 'development', label: 'Development XI', href: 'team-development.html' },
    { key: 'women', label: 'Women’s Cricket', href: 'team-women.html' },
    { key: 'u14', label: 'U14s', href: 'team-u14.html' }
  ];

  const hero = document.querySelector('body[data-team-page] .page-hero');
  if (!hero) return;

  const nav = document.createElement('nav');
  nav.className = 'team-switcher';
  nav.setAttribute('aria-label', 'Sutton Cricket Club teams');
  nav.innerHTML = `<div class="container team-switcher-inner">
    <a class="team-switcher-all" href="teams.html">All teams</a>
    <div class="team-switcher-links">
      ${teams.map(team => `<a href="${team.href}"${team.key === page ? ' class="active" aria-current="page"' : ''}>${team.label}</a>`).join('')}
    </div>
    <div class="team-switcher-actions">
      <a href="fixtures.html">Fixtures & results</a>
      <a href="honours.html">Statistics</a>
    </div>
  </div>`;

  hero.insertAdjacentElement('afterend', nav);

  if (!document.querySelector('script[data-sutton-preseason-fixtures]')) {
    const script = document.createElement('script');
    script.src = 'preseason-fixtures.js';
    script.dataset.suttonPreseasonFixtures = 'true';
    document.body.appendChild(script);
  }
})();
