/* Sutton Cricket Club current-season configuration.
 *
 * Change CURRENT_SEASON once when the club moves to a new season.
 * Historical news, awards, honours and archive data should keep their
 * original years and must not use this value.
 */
(() => {
  const CURRENT_SEASON = 2026;

  window.SUTTON_CC = Object.freeze({
    ...(window.SUTTON_CC || {}),
    currentSeason: CURRENT_SEASON
  });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-current-season]').forEach((element) => {
      element.textContent = String(CURRENT_SEASON);
    });
  });
})();
