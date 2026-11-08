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
**Resolution:** Re-examined by /audit independent at c006fba and still unverified, since no screen reader was run. The delta moved the lines above by one and adds the same pattern to the logout error at client/src/components/layout/AccountNav.jsx:59, so any test should cover that region too. Re-examined by /audit independent at 7d1db4c and still unverified, since no screen reader was run. Feature 11 adds the same `role="alert"` plus `empty:hidden` pattern in client/src/components/lists/ListFields.jsx:8 (list form errors) and client/src/pages/ListDetailsPage.jsx:59 (delete failure), so any test should cover those too.

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

### F-18 [P3] open - The "Try again" block is now copied into six components

**File:** client/src/pages/LibraryPage.jsx:113
**Found:** 2026-11-06 by /audit independent (scope: current; lens: quality)
**Why it matters:** This feature adds a sixth copy of the same alert, button markup and long class string, alongside ProtectedRoute.jsx:22, MovieSection.jsx:28, MovieDetails.jsx:35, SearchPage.jsx:107 and SearchResults.jsx:41. The focus defects F-05 and F-09 live in this markup, and the coding standards ask for shared primitives as local components, so the outstanding fix would have to be repeated in each copy and the copies have already started to differ, with only the library page handling focus. Nothing is broken today.
**Suggested fix:** Extract a small local retry component that takes the message and the retry handler, and fix F-05 and F-09 there. The library page keeps its focus handling through the handler it passes. No current requirement would be lost.
**Resolution:** Re-examined by /audit independent at 2b11445 and still open. Feature 10 moved the library page's copy from line 61 to line 113 without adding another copy. The spec leaves this finding out of scope. Re-examined by /audit independent at 7d1db4c and still open: feature 11 adds two more copies at client/src/pages/ListsPage.jsx:41 and client/src/pages/ListDetailsPage.jsx:107. Both move focus to a container that stays mounted before retrying, so they avoid the F-05/F-09 focus loss, and they take the button classes from client/src/components/lists/listStyles.js, so the copies now differ further. A shared retry component would also replace those two. Re-examined by /audit independent at ba72d08 and still open: feature 12 adds another copy in the Add to list dialog at client/src/components/lists/AddToListButton.jsx:105, and this one has the F-05/F-09 focus loss (see F-23). Re-examined by /audit independent at e0cbb63 and still open: feature 13 adds another copy at client/src/pages/ProfilePage.jsx:61. Like ListsPage, it moves focus to the stats section, which stays mounted, before retrying (ProfilePage.jsx:41), and it takes `PRIMARY_BUTTON` from listStyles.js, so it avoids the focus loss.

### F-19 [P3] open - Button class strings are exported from the action hook

**File:** client/src/hooks/useLibraryAction.js:3
**Found:** 2026-11-06 by /audit independent (scope: current; lens: quality)
**Why it matters:** `BUTTON_BASE_CLASS` and `BUTTON_IDLE_CLASS` have nothing to do with pending or failure handling, yet `WatchlistButton` and `WatchedButton` import them from this hook file. The coding standards keep hooks for reusable logic and the spec asks to keep this hook small, listing only `pending`, `failed` and the two repeat guards. The next control that wants the button look will have to import styling from a state hook. Nothing is broken today.
**Suggested fix:** Move the two constants to a small module beside the buttons, such as client/src/components/movies/libraryButtonClasses.js, and import them from there. No current requirement would be lost.
**Resolution:** Re-examined by /audit independent at ba72d08 and still open. Feature 12's spec asks for these classes, so two more files now import styling from the hook: client/src/components/lists/AddToListButton.jsx:4 and client/src/pages/ListDetailsPage.jsx:5. Moving the constants would mean updating four importers instead of two.

### F-20 [P3] open - The status check is written twice in the library controller

**File:** server/src/controllers/libraryController.js:13
**Found:** 2026-11-06 by /audit independent (scope: current; lens: quality)
**Why it matters:** `requireStatus` (line 21) repeats the same `includes` check and error message as `parseStatus` (line 13). The spec rules out using `parseStatus` for bodies because it treats `""` as unset, but that does not stop `parseStatus` from calling `requireStatus`. A change to the message or the allowed values now has two places to edit. `requireRating` also returns a value that its only caller ignores. Nothing is broken today.
**Suggested fix:** Have `parseStatus` return null for `undefined` or `""` and otherwise return `requireStatus(status)`, and drop the `return rating` from `requireRating`, renaming nothing else. No current requirement would be lost.
**Resolution:**

### F-21 [P3] open - A source comment cites a ledger ID that will not stay valid

**File:** server/src/controllers/libraryController.js:135
**Found:** 2026-11-06 by /audit independent (scope: current; lens: quality)
**Why it matters:** The comment ends with `(F-15)`, the only finding ID in client/src or server/src. Bare IDs are scoped to the live ledger: `/complete` archives this one under a work-item prefix and the ledger later restarts its numbering, so a future F-15 could be an unrelated finding and mislead a reader. The rest of the comment already explains the reason in full.
**Suggested fix:** Delete ` (F-15)` from the comment. No current requirement would be lost.
**Resolution:** Re-examined by /audit independent at ba72d08 and still open. The comment moved from line 121 to line 135 because feature 12 pulled the title and poster checks out into shared helpers above it.

### F-22 [P3] open - Cancelling the rename form during a save does not cancel the save

**File:** client/src/components/lists/EditListForm.jsx:21
**Found:** 2026-11-08 by /audit independent (scope: current; lens: quality)
**Why it matters:** Escape (line 21) and Cancel (line 41) call `onClose` even while `form.pending` is true, but the PATCH already in flight keeps running. If it succeeds, the heading changes after the user chose Cancel. If it fails (a 409 duplicate name or a network error), `useListForm` sets errors on a form that is no longer mounted, so the user is never told, and the coding standards ask the client not to swallow failures silently. The window is only as long as one request, so this is a small edge case. Found by reading the code path, not run in a browser.
**Suggested fix:** While `form.pending` is true, ignore Escape and mark Cancel `aria-disabled` (the pattern Save already uses), so the form stays open until the request settles. No current requirement would be lost.
**Resolution:**

### F-23 [P3] open - The Add to list dialog drops focus when it reloads its lists

**File:** client/src/hooks/useListMembership.js:17
**Found:** 2026-11-08 by /audit independent (scope: current; lens: quality)
**Why it matters:** `load` sets the loading state first, which unmounts whatever had focus inside the dialog. That happens in two places: pressing "Try again" (client/src/components/lists/AddToListButton.jsx:107) removes the focused button, and a 404 on a toggle (useListMembership.js:42) removes the focused checkbox. Focus then falls back to the document body while the modal is still open, so a keyboard or screen reader user loses their place and has to Tab back in. This is the F-05/F-09 pattern in new code, and inside a modal it is more disorienting. Found by reading the code path, not run in a browser.
**Suggested fix:** Before calling `load` from those two paths, move focus to an element that stays mounted, such as the dialog heading with `tabIndex={-1}` (the approach ListsPage and ListDetailsPage already use for their retries). No current requirement would be lost.
**Resolution:**

### F-24 [P3] open - Removing two movies quickly can leave focus on nothing

**File:** client/src/pages/ListDetailsPage.jsx:72
**Found:** 2026-11-08 by /audit independent (scope: current; lens: quality)
**Why it matters:** `handleRemove` decides `lastMovie` from the list as it was when the button was pressed. If a list has two movies and the user presses Remove on both before the first request returns, both calls see two movies and take the heading branch (line 77). The second one focuses the "Movies" heading just before the empty state replaces it, so focus ends on the document body instead of "No movies in this list yet.". This only happens when two removals overlap, which the per-button pending guard does not prevent. Found by reading the code path, not run in a browser.
**Suggested fix:** Decide the focus target after the removal lands rather than before. For example, let `removeMovie` report how many movies remain, or move focus in an effect that runs when `list.movies.length` changes. No current requirement would be lost.
**Resolution:**
