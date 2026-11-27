# Sutton Cricket Club website health check — 27 November 2026

## Scope reviewed
- Repository file tree: 279 entries at the start of this audit.
- HTML: 55 pages, including news articles and the secure-admin subdirectory.
- Stylesheets: 50 CSS files.
- Static URL references in HTML and CSS compared with GitHub repository paths.
- Local same-page navigation anchors, duplicate IDs, image alt attributes and H1 counts checked across the HTML pages.
- Confirmed responsive navigation breakpoints inspected in the shared CSS.

## Fixes committed
1. **Historical previews:** Five history/gallery image URLs pointed to missing .webp files. Existing archive images are embedded as CSS background images in `assets/history/featured-images.css`. Replaced broken image requests with transparent image placeholders so the authentic CSS photos remain visible; connected the same CSS to the 150th anniversary preview with the correct `history-photo` selectors. No photos or identifying information were removed.
2. **Logo cache references:** Updated older `20260912c` badge references on the 404 page, template/player/match pages, legacy junior pages and selected news pages.
3. **Mobile navigation:** The More menu was changing to mobile layout below 1000px while the full navigation remains desktop until 850px. Aligned this More-menu breakpoint to 850px.
4. **Regression checks:** Added `tools/check_site_links.py` and `.github/workflows/site-health.yml` to check static links, assets and basic page markup on future HTML/CSS/asset changes.

## Findings and deliberate exclusions
- Missing image requests in the historical previews were verified from the repository tree and repaired.
- The `/api/*` routes are dynamic backend endpoints, not static files. They were excluded from static broken-file findings.
- The admin dashboard has two navigation targets produced by JavaScript, so they are excluded from static anchor failures.
- Remote websites and dynamic content (including Play-Cricket, FormSubmit, GitHub OAuth, fantasy cricket and Google Apps Script) need runtime checks; no simulated enquiry or authorisation was submitted.
- Live URL fetches of the deployed site were not accessible from the available external browsing environment. Mobile browser rendering, JavaScript runtime behaviour, external link availability and production deployment were therefore **not** verified in this audit.
- The new GitHub Actions workflow is committed but its first successful run has **not** been independently confirmed.
- 2027 junior dates and anniversary events remain provisional. No schedule content was changed.
- Sponsorship Google Sheets endpoint requires separate Google Apps Script deployment and website connection.

## Recommended follow-up
1. Check the new **Website static health check** GitHub Actions run and correct any unexpected failures.
2. Open the homepage, History, 150th Anniversary, Historical Gallery, 2027 Hub and individual team pages in a real phone browser at 375px and 768px, plus desktop width, checking images, navigation, forms and overflow.
3. Verify the production deployment uses the latest commit, including the historical photo and More-menu fixes.
4. Test Play-Cricket result/fixture loading, 2027 season rollover, email enquiry forms and secure admin sign-in with an authorised account.
5. Deploy the Google Apps Script sponsor receiver before changing the sponsor enquiry form action.
