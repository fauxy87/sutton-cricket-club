/* Sutton Cricket Club current-season configuration.
 *
 * The active season rolls over automatically on 1 January each year.
 * Historical news, awards, honours and archive data keep their original
 * years and must not use this value.
 */
(() => {
  const now = new Date();
  const CURRENT_SEASON = now.getFullYear();

  window.SUTTON_CC = Object.freeze({
    ...(window.SUTTON_CC || {}),
    currentSeason: CURRENT_SEASON
  });

  const applySeasonLabels = () => {
    document.querySelectorAll('[data-current-season]').forEach((element) => {
      element.textContent = String(CURRENT_SEASON);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySeasonLabels, { once: true });
  } else {
    applySeasonLabels();
  }
})();
