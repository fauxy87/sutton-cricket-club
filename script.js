const button = document.querySelector('.nav-toggle');
const nav = document.querySelector('.main-nav');

if (button && nav) {
  button.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('open');
    button.setAttribute('aria-expanded', String(isOpen));
  });

  document.querySelectorAll('.main-nav a').forEach(link => {
    link.addEventListener('click', () => {
      nav.classList.remove('open');
      button.setAttribute('aria-expanded', 'false');
    });
  });
}

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const filterButtons = document.querySelectorAll('.filter-btn');
if (filterButtons.length) {
  const filterable = document.querySelectorAll('[data-team]:not(.filter-btn)');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const selected = btn.dataset.team;
      filterable.forEach(item => { item.hidden = selected !== 'all' && item.dataset.team !== selected; });
    });
  });
}

const newsFilters = document.querySelectorAll('.news-filter');
if (newsFilters.length) {
  const newsCards = document.querySelectorAll('[data-news-card]');
  newsFilters.forEach(btn => {
    btn.addEventListener('click', () => {
      newsFilters.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.news;
      newsCards.forEach(card => { card.hidden = cat !== 'all' && card.dataset.newsCard !== cat; });
    });
  });
}