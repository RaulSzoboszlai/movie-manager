# Feature: Watched & rating

**From build-plan:** feature 10
**Build attempt:** 1
**Status:** verified
**Branch:** feature/watched-rating

## Goal

A signed-in user can mark any movie as watched, whether or not it is on their watchlist, give it 1-5 whole stars, change or clear that rating, and find it under a *Watched* tab on the library page. Marking a movie watched records the date. The data stays private to each account.

## In scope

- `PATCH /api/library/:tmdbId` to change `status` and to set or clear `rating`, behind `requireAuth` and scoped by `req.userId`.
- An optional `status` on `POST /api/library`, so an unsaved movie can be saved directly as watched in one request.
- A `Watched` toggle on movie cards and the details page, shown for every movie once the library has loaded.
- A `StarRating` component: on cards only when the movie is watched; always on the details page, disabled until the movie is watched.
- *Watched* tab on `/library`, with keyboard tab switching and the selected tab kept in the URL.
- Moving a watched movie back to *Want to watch*, which clears its rating and `watchedAt`, with a confirmation when that would discard a rating.
- Resolving finding F-15 by using `save()` in the PATCH handler.

## Out of scope

- A direct *Remove* on watched movies. By decision, a watched movie is removed in two steps: back to *Want to watch*, then off the watchlist.
- Editing `watchedAt`. It records the day the movie was marked, even for a film seen long ago.
- Showing the watched date anywhere, half stars, reviews, rewatches and the watch diary (all "Later").
- Custom lists (features 11-12), profile stats (feature 13).
- Toasts, skeletons and the wider accessibility pass, including F-05, F-09 and F-18 (feature 14 or their own fixes).
- Live sync between browser tabs, pagination or sorting controls on the library page.

## Build loop

- `workflow.stepReview` is `feature`: work through all the steps, then stop for one review at the end. Do not pause for review between steps.
- `workflow.checkpointCommits` is `disabled`: no commits during the build. `/complete` creates the final feature commit.
- Tick each step here as it is finished. Run `npm run lint` from the root after each step. There is no test or typecheck command.

## Build steps

- [x] **1. Server: PATCH endpoint and POST status.** Add `updateLibraryMovie` to `server/src/controllers/libraryController.js` and route it as `router.patch('/:tmdbId', ...)`. Follow **PATCH contract** below. Load the document with `findOne` and call `save()`, never a query update. Extend `addToLibrary` following **POST change** below.
  - Done when: with a running server, curl (or equivalent) shows each row of the outcome table, including 400 for a rating on a `want` movie with no document change (F-15); `watchedAt` is set on the first `status: "watched"` and unchanged by a repeat; 400 for each invalid body listed; 404 for a movie not in the library; 401 with no cookie; a second account gets 404 for the first account's movie and changes nothing. POST with no `status` still creates a `want` movie; POST with `status: "watched"` returns 201 with `watchedAt` set; POST with a bad `status` returns 400; POST for a movie already saved returns 200 with the record unchanged. `npm run lint` passes.

- [x] **2. Client: shared update and action hook.** Add `update(tmdbId, changes)` to `LibraryContext`. It PATCHes, replaces the movie in state in its current position only after the server succeeds, and rejects on failure. Give `add` an optional second argument, `add(movie, status)`, sent as `status` in the POST body. Add `client/src/hooks/useLibraryAction.js`, moving `pending`, `failed`, the `event.detail > 1` guard and `ignoreKeyRepeat` out of `WatchlistButton`, and switch `WatchlistButton` to it.
  - Done when: `WatchlistButton` behaves exactly as before in the browser: add and remove work, a double click makes one change, a held Enter on a library card removes one movie, and a blocked request shows the inline error. `npm run lint` passes.

- [x] **3. Watched toggle on cards and details.** Add `client/src/components/movies/WatchedButton.jsx` and `client/src/components/movies/LibraryControls.jsx`. Render `LibraryControls` in place of `WatchlistButton` in `MovieCard` and `MovieHero`. Follow **Controls** below.
  - Done when: in the browser, unsaved and `want` movies both show `+ Watched`; pressing it swaps to a green `✓ Watched` and the watchlist button goes away, with keyboard focus still on the toggle; an unsaved movie marked this way appears under *Watched* and not under *Want to watch*, and a double click on it leaves it watched; pressing `✓ Watched` returns the movie to want; unrated movies ask nothing, rated movies ask first and Cancel changes nothing; the same movie in two rows updates in both; state survives a reload; a blocked request shows the inline error and keeps the old state; a Top 10 row with mixed card states stays aligned and only the row scrolls. `npm run lint` passes.

- [x] **4. Star rating.** Add `client/src/components/movies/StarRating.jsx` and render it from `LibraryControls`. Follow **Star rating** below.
  - Done when: in the browser, a watched card shows five stars at the narrowest poster width (8rem) without overflow; pressing a star sets the rating and pressing the current star clears it, and both survive a reload; on the details page, stars are disabled with the hint for unsaved and `want` movies and become usable as soon as the movie is marked watched, without a reload; a blocked request shows the inline error and keeps the old rating; Tab reaches each star and Enter and Space work. `npm run lint` passes.

- [x] **5. Watched tab.** Update `client/src/pages/LibraryPage.jsx`. Follow **Library tabs** below.
  - Done when: in the browser, `/library` opens on *Want to watch* and `/library?tab=watched` on *Watched*; Left, Right, Home and End move between tabs and only the selected tab is in the Tab order; opening a watched movie and pressing Back returns to *Watched*; the most recently watched movie is first; marking a movie watched takes it off *Want to watch* and puts focus on the first button of the card now in its place, and the same applies moving one back from *Watched*; acting on the last card focuses the tabpanel; each tab shows its own empty state; loading and error states work, and *Try again* recovers; the page works at phone width. `npm run lint` and `npm run build` in `client/` pass.

## Files / areas

**New**
- `client/src/hooks/useLibraryAction.js`
- `client/src/components/movies/WatchedButton.jsx`
- `client/src/components/movies/LibraryControls.jsx`
- `client/src/components/movies/StarRating.jsx`

**Changed**
- `server/src/controllers/libraryController.js`, `server/src/routes/library.js`
- `client/src/context/LibraryContext.jsx`
- `client/src/components/movies/WatchlistButton.jsx`, `MovieCard.jsx`, `MovieHero.jsx`
- `client/src/pages/LibraryPage.jsx`

No schema change. `SavedMovie` already has `status`, `rating`, `watchedAt` and the document-level rating rule.

## Data / contracts

### PATCH contract

**`PATCH /api/library/:tmdbId`** with body `{ status?, rating? }` → 200 `{ movie }`, using the existing `toSavedMovie` projection. The owner always comes from `req.userId`. Any other body field, including `user` and `watchedAt`, is ignored. Errors are `{ message }` from the central handler.

Check in this order:

1. `tmdbId` through `parseTmdbId`: 400 if invalid.
2. Body, read as `req.body ?? {}`: 400 if both fields are absent.
   - `status`, when present, must be exactly `"want"` or `"watched"`. Do not reuse `parseStatus`, which treats `""` as unset for the query string.
   - `rating`, when present, must be `null` or an integer from 1 to 5. `0`, `6`, `3.5`, `"3"` and `true` are 400.
3. `findOne({ user: req.userId, tmdbId })`: 404 if nothing matches, including another user's movie.
4. Work out the resulting status (`status` from the body, else the stored one). If a non-null `rating` is sent and the result is not `watched`, return 400. Check this in the controller: the model's rule stays as the backstop, but its `ValidationError` has no `status` and would reach the client as a 500.

Then apply and `save()`:

| Stored | Body | Result |
| --- | --- | --- |
| `want` | `{ status: "watched" }` | `watched`, `watchedAt` = now, rating `null` |
| `want` | `{ status: "watched", rating: 4 }` | `watched`, `watchedAt` = now, rating 4 |
| `want` | `{ rating: 4 }` or `{ status: "want", rating: 4 }` | 400 "Rating is only allowed on a watched movie" |
| `want` | `{ rating: null }` or `{ status: "want" }` | 200, unchanged |
| `watched` | `{ status: "watched" }` | 200, `watchedAt` unchanged, so a double click or stale tab is safe |
| `watched` | `{ rating: 1-5 }` | rating set, `watchedAt` unchanged |
| `watched` | `{ rating: null }` | rating cleared, still `watched` |
| `watched` | `{ status: "want" }`, with or without `rating: null` | `want`, rating `null`, `watchedAt` `null` |
| `watched` | `{ status: "want", rating: 4 }` | 400, as above |

Marking a movie watched again after moving it back records a new `watchedAt`.

`DELETE` is unchanged. The server still accepts it for a watched movie; only the UI requires the two steps.

### POST change

**`POST /api/library`** gains an optional `status` in its body. This replaces Feature 9's rule that any `status` in the body is ignored. Everything else about the endpoint stays the same, and `user`, `rating` and `watchedAt` in the body are still ignored.

- Absent: creates a `want` movie, as today.
- `"want"`: creates a `want` movie.
- `"watched"`: creates a `watched` movie with `watchedAt` = now and rating `null`.
- Anything else, including `null` and `""`: 400 "Status must be want or watched". Do not reuse `parseStatus`, which treats `""` as unset.
- Movie already saved: 200 with the existing record unchanged, so this can never reset a rating or a date. A stale tab that sends `"watched"` for a saved `want` movie gets `want` back and shows `+ Watched`, and pressing it again sends a PATCH.

### Controls

`LibraryControls({ movie, alwaysShowRating = false })` reads the saved entry for `movie.tmdbId` from `useLibrary()` and stacks its controls with a small gap:

| Saved state | Shows |
| --- | --- |
| library loading or error | `WatchlistButton` only, with its existing states |
| not saved, or `want` | `WatchlistButton` above `WatchedButton` |
| `watched` | `WatchedButton`, then `StarRating` |

Keep `WatchedButton` at the same position in the React tree across all three saved states (`{!watched && <WatchlistButton />}` then `{status === 'ready' && <WatchedButton />}`), so the same DOM button survives the press and keeps keyboard focus.

`MovieCard` uses the default. `MovieHero` passes `alwaysShowRating`, which also renders `StarRating` as disabled for a not-saved or `want` movie once the library state is `ready`. Keep the `w-40` wrapper in `MovieHero`.

`WatchedButton` mirrors `WatchlistButton`, including its base class, focus ring, `motion-reduce` handling, pending behaviour (`aria-busy` and `aria-disabled`, never the `disabled` attribute) and failure message:

| State | Visible text | Accessible name | Click |
| --- | --- | --- | --- |
| not saved | `+ Watched` | `Watched: {title}`, `aria-pressed="false"` | `add(movie, 'watched')` |
| `want` | `+ Watched` | `Watched: {title}`, `aria-pressed="false"` | `update(tmdbId, { status: 'watched' })` |
| `watched` | `✓ Watched`, using `border-watched bg-watched-soft text-watched` | `Watched: {title}`, `aria-pressed="true"` | moves back to want, see below |

Moving back sends `{ status: 'want' }`, including for a movie that was never on the watchlist, which then needs `✓ Watchlist` to leave the library. When `rating` is not null, first call `window.confirm` with `Move "{title}" back to Want to watch? This clears your {rating}-star rating.` Cancel sends nothing. An unrated movie asks nothing.

### Star rating

`StarRating({ movie })` reads the saved entry itself. Whole stars only.

- Wrapper: `role="group"` with `aria-label` `Your rating for {title}: {n} out of 5 stars`, or `Your rating for {title}: not rated`.
- Five `<button type="button">` elements with a `★` glyph marked `aria-hidden`, at least 24 by 24 CSS pixels so five fit the 8rem poster. Stars up to the rating use `text-star-on`, the rest `text-star-off`.
- Each star's `aria-label` is `Rate {n} out of 5`, with `aria-pressed` true only on the star equal to the rating.
- Pressing a star sends `{ rating: n }`. Pressing the star equal to the current rating sends `{ rating: null }`. That star's `aria-label` and `title` become `Clear rating`, so clearing is discoverable without taking extra card width.
- Pending: `aria-busy` on the group, `aria-disabled` on the stars, clicks ignored, using `useLibraryAction`. Failure: the same inline `<p role="alert">` as the other controls, keeping the old rating.
- Disabled (not watched, details page only): native `disabled` on all five stars, since they cannot be holding focus when this state applies, plus a muted hint `Rate this movie once you've watched it.` linked by `aria-describedby`.
- Include a `focus-visible` ring and `motion-reduce` handling on the stars.

### Library tabs

- Selected tab comes from the `tab` URL parameter via `useSearchParams`: `watched` selects *Watched*, anything else selects *Want to watch*. Selecting *Want to watch* removes the parameter. Use `{ replace: true }` so tab switches do not add history entries.
- `role="tablist"` with two `role="tab"` buttons, each with its own `useId`. The selected tab has `aria-selected="true"` and `tabIndex={0}`, the other `aria-selected="false"` and `tabIndex={-1}`. Left and Right wrap, Home and End jump, and focus moves with the selection (automatic activation).
- One `role="tabpanel"` with `aria-labelledby` and `MovieGrid`'s `labelledBy` pointing at the selected tab.
- Lists filter the shared client state. *Want to watch* keeps context order. *Watched* sorts by `watchedAt`, newest first.

| State | Behaviour |
| --- | --- |
| loading | `role="status"`: "Loading your library..." |
| error | `role="alert"`: "We couldn't load your library." with *Try again*, keeping the existing `handleRetry` focus handling |
| empty, *Want to watch* | Existing text and `/search` link |
| empty, *Watched* | "Nothing watched yet." with the same `/search` link |

Focus after a card leaves the list keeps the F-13 rule and needs two changes:

- Cards now hold several buttons, so `buttons[removedIndex]` is wrong. Select the `article` at that index, or the last one, and focus its first `button`. Use the tabpanel when the list is empty.
- Track the ids of the selected tab's list, and reset the stored ids without moving focus when the tab changes. A switch to a shorter list must not count as a removal, since some browsers leave focus on `body` after a click on a tab.

## Testing

No test runner is configured, so tests are not a gate, and none are added here. Evidence comes from `npm run lint`, `npm run build` in `client/`, the API checks in step 1 and manual browser checks in steps 2-5, which need a running MongoDB and a valid `TMDB_API_KEY`. Record only checks that were actually run, and say so if any could not be.

## Notes for the AI

- F-15: load and `save()` is the fix. After step 1, record the 400 for a rating on a `want` movie against that finding.
- `useLibraryAction` exists because three controls now need the same pending, failure and repeat-click handling. Keep it that small. The guards still matter: on the library page, the next card's button takes the place of one that moved away, under both pointer and focus.
- `movie` on a card may be a raw TMDB-shaped item with no `status`. Always read `status`, `rating` and `watchedAt` from the saved entry in `useLibrary()`, never from the `movie` prop.
- `add` can return an existing movie from a stale tab (200), whichever status it asked for. The upsert already handles it, and the controls follow the returned status.
- Every unsaved card now has two buttons, which makes cards taller and adds a Tab stop per card. Check the home rows and the search grid for this in step 3.
- A PATCH that returns 404 because another tab removed the movie shows the inline error until a reload. Live sync is out of scope, so no special case.
- Accepted risk: two different PATCHes for one movie landing within milliseconds of each other could leave a rating on a `want` movie, since `save()` writes only modified paths. It needs one user acting on separate controls at once and touches only their own data, so no locking is added.
- Render `title` as React text only. `window.confirm` shows it as plain text.
- Check that `MovieRow`'s `revealFocusedCard` still scrolls properly now that cards can hold up to six buttons.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":16824,"specSha256":"92706db6fb727031e635f05abc202cf71c3bbc6fea386fcbf1ed91ee071e8db7","branch":"refs/heads/feature/watched-rating","head":"2b114459db0a08493956d7a3ac8b2861fb33e160","baseRef":"refs/heads/main","baseCommit":"824ecb9d6e5939d204b2f6e5bda4232faeb2639b","sourceTree":"76cbadfbbb8edf426444c078e7e6acf992743584","landing":"local-merge","absentOptional":[]} -->

## Findings

### 10/F-15 [P3] closed - The rating and status rule will not run on update queries

**File:** server/src/models/SavedMovie.js:30
**Found:** 2026-11-06 by /audit (scope: current; lens: security)
**Why it matters:** The rule that a rating needs `status: "watched"` lives in `pre('validate')`, which runs on `save()` and `create()`. Query updates such as `findOneAndUpdate` skip it. Nothing in the server uses those today, so this cannot happen yet, but feature 10's `PATCH /library/:tmdbId` could store a rating on an unwatched movie if it uses one. The behaviour of the hook on update queries comes from Mongoose's documented rules and was not run here.
**Suggested fix:** In feature 10, load the document and call `save()` in the PATCH handler, and cover a rating on a `want` movie in its checks. No change needed in this feature.
**Resolution:** Re-examined by /audit independent at 2988cc0 and still unverified. `validate()` on the model rejects a rating on a `want` movie, so the hook works on documents, and server/src still has no query update on SavedMovie, so the gap cannot be reached yet. The update-query behaviour itself was not run. Feature 10, step 1: `updateLibraryMovie` loads the document and calls `save()`, with no query update. Run against the real routes on a throwaway database, `{ rating: 4 }` and `{ status: "want", rating: 4 }` on a `want` movie each returned 400 "Rating is only allowed on a watched movie" and left the stored document unchanged. Closed by /audit independent at 2b11445: server/src/controllers/libraryController.js:101 loads with `findOne` and :122 calls `save()`, the controller checks the rule before saving at :108, and server/src has no query update on SavedMovie. A no-database harness ran the real controller and model validation: both bodies returned 400 and `validate()` still rejects a rating on a `want` movie. The repair introduced no new defect. The hook itself still does not run on query updates, so a later query update on SavedMovie would reopen the gap, but none is reachable now.

## Independent review

**Status:** passed
**Target commit:** 2b114459db0a08493956d7a3ac8b2861fb33e160
**Base commit:** 824ecb9d6e5939d204b2f6e5bda4232faeb2639b
**Base ref:** main
**Spec hash:** 92706db6fb727031e635f05abc202cf71c3bbc6fea386fcbf1ed91ee071e8db7
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-11-06T15:54:03Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-06T15:57:50Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `824ecb9d6e5939d204b2f6e5bda4232faeb2639b..2b114459db0a08493956d7a3ac8b2861fb33e160` delta in a fresh session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npm run lint` (root, runs client and server oxlint): pass
- `npm run build` (in `client/`): pass
- No-database contract harness, a temporary script outside the repository that calls the real `updateLibraryMovie` and `addToLibrary` with real `SavedMovie` validation and stubbed persistence: pass, 47 of 47 checks
- Test command: unavailable, none declared
- Typecheck command: unavailable, none declared
- Security scanner command: unavailable, none declared
- Performance command: unavailable, none declared
- Browser tests command: unavailable, none declared

## Evidence

- Preconditions: `HEAD`, the merge base with local `main` and the raw spec SHA-256 all match the request, the adapter and model match, and only `blueprint/context/findings.md` and `blueprint/context/review.md` differ from the target.
- Reviewed the complete client and server delta for the range, plus `SavedMovie`, `requireAuth`, `errorHandler`, `server/src/index.js`, `useMovieList`, `MovieRow`, `MovieGrid` and `ProtectedRoute`.
- Harness coverage: every row of the spec's PATCH outcome table, the listed invalid ratings, statuses, ids and empty bodies, a 404 for a missing document, ignored extra fields, every POST status case including an existing movie returned unchanged, and the model's rating rule.
- Ownership: `router.use(requireAuth)` covers the new route, `findOne` is scoped by `req.userId`, `toSavedMovie` does not return `user`, and CORS keeps its single allowed origin. The cookie is `httpOnly` and `sameSite: lax`.
- Client read against the spec's Controls, Star rating and Library tabs sections: `WatchedButton` keeps its tree position, stars are 7.5rem wide against the 8rem minimum poster, and focus handling resets on a tab change.

## Findings

- New: F-19 [P3] open, F-20 [P3] open, F-21 [P3] open
- Closed: F-15 [P3]
- Re-examined: F-18 [P3] still open, line reference updated
- No P0 or P1 finding is open or fixed

## Remaining risk

- Browser behaviour was not exercised in this review: focus movement, tab keyboard handling, card layout and overflow, row scrolling, and `window.confirm`. This comes from reading the code and relies on the builder's recorded browser checks. The dev servers use the user's local database, so they were not driven.
- The API was not run over HTTP against a real MongoDB. The harness stubs persistence, so the 401 response, the second-account 404, the real duplicate-key path and persisted state rest on code reading.
- No test command is declared, so the PATCH state rules and the client hook have no automated regression coverage. Tests are not a gate in this project.
- No typecheck, security scanner, performance or browser test command is declared, so none could run. No dependency vulnerability scan was performed.
- The spec's accepted race remains: two different PATCHes for one movie landing together can leave a rating on a `want` movie, since `save()` writes only modified paths. The next status change on that movie corrects it.
- Unverified performance hypothesis: each card scans the library array up to three times per context update, so a very large library could render slowly. It was not profiled and is not expected at personal scale.

## Try it now

Run or do:

With `npm run dev` running, sign in at http://localhost:5173 with any account. On a Top 10 card, press `+ Watched`, then press the fourth star. Open http://localhost:5173/library?tab=watched and reload the page.

Expected:

The card shows a green `✓ Watched` in place of the watchlist button. After the reload, the movie is under *Watched* with four gold stars.

This proves:

A movie can be marked watched directly, without going through the watchlist, and it can be rated. Both the status and the rating persist and show under the *Watched* tab.
