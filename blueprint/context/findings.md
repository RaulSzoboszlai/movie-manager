# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to land while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] open - client/README.md is still the Vite template

**File:** client/README.md:1
**Found:** 2026-11-04 by /audit independent (scope: current; lens: quality)
**Why it matters:** Step 4's done-when says no starter content remains, but this file still opens with "# React + Vite" and describes the template. It is not on the spec's delete list and the In scope bullet names only markup and assets, so this is a loose end rather than a broken contract. Nothing renders it.
**Suggested fix:** Delete client/README.md or replace it with a line pointing at the root README. No current requirement would be lost.
**Resolution:**

### F-04 [P3] unverified - Form alert may not be announced when it stops being display:none

**File:** client/src/pages/LoginPage.jsx:25
**Found:** 2026-11-04 by /audit (scope: current; lens: quality)
**Why it matters:** The `role="alert"` element stays mounted, which helps announcements, but `empty:hidden` removes it from the accessibility tree until text arrives. Some browser and screen reader pairs announce a live region unreliably when it becomes visible and gains content in one update. The same markup is in RegisterPage.jsx:25. The DOM and visible text were checked in Chrome, but no screen reader was run, so this is a lead and not a confirmed defect.
**Suggested fix:** Test the failed-login message with NVDA or Narrator. If it is not announced, remove `empty:hidden` and drop the empty element's spacing another way. No current requirement would be lost.
**Resolution:** Re-examined by /audit independent at c006fba and still unverified, since no screen reader was run. The delta moved the lines above by one and adds the same pattern to the logout error at client/src/components/layout/AccountNav.jsx:59, so any test should cover that region too.

### F-05 [P3] open - "Try again" drops keyboard focus on every session retry

**File:** client/src/components/auth/ProtectedRoute.jsx:7
**Found:** 2026-11-04 by /audit independent (scope: current; lens: quality)
**Why it matters:** `retrySession` sets `loading` first (client/src/context/AuthContext.jsx:79), so the guard swaps the error block for the status text and React removes the focused "Try again" button (ProtectedRoute.jsx:23). Focus falls back to the document body. If the check fails again during an outage, a keyboard user has to Tab back through the navbar for each retry. This follows the spec's state table and is not a route change, so Feature 14's route-focus work does not obviously cover it. Found by reading the code path, not run in a browser.
**Suggested fix:** Move focus to the new "Try again" button when the guard re-enters `error` after a retry, or keep the button mounted with `aria-disabled` during the retry. No current requirement would be lost.
**Resolution:**

### F-06 [P3] open - Overview still lists the genre cache lifetime as an open question

**File:** blueprint/context/project-overview.md:307
**Found:** 2026-11-04 by /audit independent (scope: current; lens: quality)
**Why it matters:** The spec's Genre cache section says it answers this question and server/src/services/tmdb.js:73 implements the decision, but the delta leaves the overview entry in place. It still says Feature 4 should decide, and it assumes a fetch at startup, which the lazy design rules out. The overview is the project's source of truth, and Features 6 and 13 consume this cache, so they could reopen a settled decision. No runtime effect.
**Suggested fix:** Remove the bullet from Open questions and record the lazy fetch, uncached failure and process-lifetime cache under "Genre ids, not names", through the project's normal overview path. No current requirement would be lost.
**Resolution:** Re-examined by /audit independent at 41b8347 and still open. The bullet moved from line 302 to line 307 because the delta added plan lines above it. The code reference is unchanged.

### F-09 [P3] open - Search "Try again" drops keyboard focus on every retry

**File:** client/src/components/movies/SearchResults.jsx:20
**Found:** 2026-11-05 by /audit (scope: current; lens: quality)
**Why it matters:** A retry replaces the error block with the loading text, which removes the focused button. Reproduced in headless Chrome: after a retry that failed again, focus was on the document body. The spec's state table calls for this swap, so it is not a contract break. It is the same pattern as F-05, and `MovieSection` shares the markup, though that component was not run.
**Suggested fix:** Fix alongside F-05: move focus to the new "Try again" button when a retry fails, or keep the button mounted with `aria-disabled` during the retry. No current requirement would be lost.
**Resolution:** Re-examined by /audit on 2026-11-05 and still open: a fresh run again left focus on the document body after a failed retry. Re-examined by /audit on 2026-11-06 and still open: `MovieSection` (client/src/components/movies/MovieSection.jsx:32) is now confirmed to do the same, since feature 8's /check saw focus on the document body after a failed retry in the details page's similar row. Feature 8 reuses the component and did not cause this, so any fix should cover `MovieSection` too.

### F-10 [P3] unverified - Screen readers may not be told when search results arrive

**File:** client/src/components/movies/SearchResults.jsx:49
**Found:** 2026-11-05 by /audit (scope: current; lens: quality)
**Why it matters:** Results appear as the user types, but the results state has no live announcement, and the loading and empty `role="status"` elements (lines 22 and 41) mount with their text already inside, which some browser and screen reader pairs announce unreliably. No screen reader was run, so this is a lead and not a confirmed defect. Related to F-04.
**Suggested fix:** Test with NVDA or Narrator. If results or the empty message go unannounced, keep one `role="status"` element mounted in `SearchPage` and update its text (for example the empty message, or "Results loaded"). No current requirement would be lost.
**Resolution:**

### F-11 [P3] unverified - Browser Back from a similar movie probably lands at the top, not at the row

**File:** client/src/pages/MovieDetailsPage.jsx:8
**Found:** 2026-11-06 by /audit (scope: current; lens: quality)
**Why it matters:** The effect calls `window.scrollTo(0, 0)` on every `tmdbId` change, whichever way the user navigated. Feature 8 adds the first links from one movie to another, and they sit at the bottom of the page, so a user who opens a similar movie and presses Back would have to scroll down again to try the next one. The remount also refetches the details, which leaves the page short while it loads, so the browser may not be able to restore the position anyway. The spec only requires Back to return to the previous movie, so this is not a contract break. /check confirmed the movie and row come back, but did not measure the scroll position after Back, so this is a lead from reading the code.
**Suggested fix:** Measure scrollY after Back. If it does land at the top, decide whether that matters. A real fix means skipping the scroll on `useNavigationType() === 'POP'` and also restoring the position once the details have loaded, which is more than a one-line change. Feature 14's UX pass is a natural place for it. No current requirement would be lost.
**Resolution:**
