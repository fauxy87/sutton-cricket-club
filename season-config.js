/* Sutton Cricket Club current-season configuration.
 *
 * The active cricket season rolls over automatically on 1 March each year.
 * Historical news, awards, honours and archive data keep their original
 * years and must not use this value.
 */
(() => {
  const now = new Date();
  // Keep the previous cricket season active through January and February,
  // while fixtures and programme details for the new season are being prepared.
  const CURRENT_SEASON = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;

  window.SUTTON_CC = Object.freeze({
    ...(window.SUTTON_CC || {}),
    currentSeason: CURRENT_SEASON,
    nextSeason: CURRENT_SEASON + 1
  });

  const applySeasonLabels = () => {
    document.querySelectorAll('[data-current-season]').forEach((element) => {
      element.textContent = String(CURRENT_SEASON);
    });
    document.querySelectorAll('[data-next-season]').forEach((element) => {
      element.textContent = String(CURRENT_SEASON + 1);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySeasonLabels, { once: true });
  } else {
    applySeasonLabels();
  }
})();
