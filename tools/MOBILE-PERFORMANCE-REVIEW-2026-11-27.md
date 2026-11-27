# Mobile performance review — 27 November 2026

## Measured repository sizes (uncompressed)
- Public Play-Cricket feed: `data/play-cricket.json` — **382,903 bytes (374 KiB)**.
- Optional match-scorecard highlights: `data/play-cricket-scorecards.json` — **1,732,717 bytes (1.65 MiB)**.
- Eight gallery archive-image CSS files (embedded images): **291,967 bytes (285 KiB)**.
- Homepage hero image: `assets/sutton-cc-home-hero.jpg` — **373,216 bytes**; already preloaded and still used.
- Most large editorial and award images already had native `loading="lazy"` and `decoding="async"`.

## Fixes deployed to the repository
1. **Historical gallery:** Eight archive-image stylesheets now use `media="print"` + `onload="this.media='all'"`, allowing initial content and controls to render without waiting for all embedded archive photographs. `<noscript>` stylesheets preserve images if JavaScript is disabled. Each archive group now uses `content-visibility:auto` with an intrinsic size estimate so offscreen thumbnails need not paint until they are approached. The original CSS photographs and the lightbox identification form were not changed.
2. **Shared Play-Cricket data:** `script.js` now exposes `getSuttonPlayCricketData()`, which shares one per-page promise for `data/play-cricket.json` between the live match renderer and `match-links.js`. Failed requests are cleared for retry. The feed remains fresh on every new page load.
3. **Scorecard helper:** Observes relevant match containers rather than the whole `document.body`, and batches rescans via `requestAnimationFrame`; the same scorecard links and 12-second observation limit remain.
4. **Fixtures page:** Builds the initial results immediately from the compact Play-Cricket feed. The larger scorecard JSON is requested only when the results section approaches the viewport (300px root margin), with immediate loading as a fallback where IntersectionObserver is unavailable. Existing match highlights are hydrated when loaded. This avoids delaying first results rendering and may avoid the 1.65 MiB transfer for visitors who don't scroll down to results.
5. **Homepage caching:** Updated the `script.js` version query on `index.html` to prompt browsers to fetch the new shared script.

## Checks
- Both edited JavaScript files parsed successfully.
- All eight non-blocking gallery links and eight no-script fallbacks verified in the repository.
- The same statistics, fixtures, forms, teams, sponsor files and season rollover assets were kept in place.
- This is a **source-level** audit, not a completed mobile performance lab test; actual Core Web Vitals, bandwidth savings and device behaviour still need a browser/network test.
- The live site could not be fetched through the available browser service, so production propagation was not independently confirmed.

## Remaining larger opportunities
- Safely create responsive WebP/AVIF image derivatives for the big sponsorship/awards photos and verify visual quality against originals.
- Run Lighthouse (mobile emulation) with a genuine production deployment and inspect LCP/CLS/INP.
- Consider generating a slim scorecard highlights summary file from the sync pipeline, rather than loading the full scorecards data, if visitors frequently scroll to results.
- Test `onload` stylesheet activation on real iOS Safari and Android Chrome before treating the gallery as fully validated.
