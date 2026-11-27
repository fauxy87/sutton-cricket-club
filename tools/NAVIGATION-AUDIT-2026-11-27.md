# Main navigation audit — 27 November 2026

## Coverage
Audited all 55 HTML pages in the repository. 49 public pages contain the shared `.main-nav` and include `script.js` (including cache-busted script URLs). The remaining six are deliberately separate admin, thank-you or standalone pages.

All 49 static navigation blocks were checked for duplicate destination URLs; none were found in the source markup. The reported duplicate Shop was instead caused by dynamically adding a second link when a page already defined it.

## Fixes
- `script.js` now assembles a canonical ordered primary and More menu, reuses existing header links where possible, and removes stray duplicate header links.
- Each public main menu has seven main destinations: Home, Fixtures, Teams, 2027 Season, Juniors, News and Contact.
- More holds unique secondary destinations, including Shop, History, Honours, Highlights, Sponsors, anniversary information, historical photos and the sharing/sponsorship enquiry links.
- Removed a redundant mobile-only list that duplicated links already accessible via primary/More navigation.
- Explicitly hide the closed More submenu in CSS so it cannot be exposed by an author-level `display:flex` declaration.
- Set the main nav accessible label and the menu button's `aria-controls` / `aria-expanded` / open-close label.
- The mobile menu closes after following a link, on an outside click, on Escape and after returning to desktop width.
- Escape closes the More dropdown, and the keyboard focus is kept inside the open mobile menu.
- The site health script now checks duplicate static header links and missing shared navigation scripts.

## Verification
- `script.js` parsed successfully as JavaScript after the edit.
- The navigation checks cover every repository HTML page.
- The site CSS contains the explicit closed-state selector.
- A live browser accessibility audit, visual responsive test, GitHub Actions success status and deployed-site cache refresh could not be independently confirmed here.

## Follow-up
Check the live homepage, History, 2027 Season Hub and a team page at phone, tablet and desktop widths. Use keyboard Tab/Shift+Tab and Escape. Confirm only one Shop link appears under More. Confirm the Actions workflow `site-health.yml` succeeds.
