# Feature: Watchlist

**From build-plan:** feature 9
**Build attempt:** 1
**Status:** verified
**Branch:** feature/watchlist

## Goal

A signed-in user can add any movie to their watchlist, or remove it, from any movie card or the details page. Every watchlist button shows whether the movie is saved, and the library page lists saved movies under a *Want to watch* tab. The data stays private to each account.

## In scope

- `SavedMovie` Mongoose model with the locked shape from the project overview, including `genreIds[]`, the `status`/`rating` pairing and the unique `{ user, tmdbId }` index.
- `GET /api/library?status=`, `POST /api/library` and `DELETE /api/library/:tmdbId`, all behind `requireAuth` and scoped by `req.userId`.
- Client library state, shared by every card and page under `ProtectedRoute`.
- `WatchlistButton` on `MovieCard` (home rows, search grid, similar row, library grid) and on the details page.
- `/library` page with a *Want to watch* tab and loading, empty and error states.

## Out of scope

- `PATCH /library/:tmdbId`, `watchedAt` being set, stars, the watched card state and the *Watched* tab (feature 10). The schema fields exist; nothing writes them yet.
- Lists and "Add to list" (features 11-12), profile stats (feature 13).
- Toasts, skeletons and the wider accessibility pass (feature 14). This feature uses the existing plain text states and inline errors.
- Refreshing snapshots from TMDB, pagination or sorting controls on the library page, and live sync between browser tabs.

## Build loop

- `workflow.stepReview` is `feature`: work through all the steps, then stop for one review at the end. Do not pause for review between steps.
- `workflow.checkpointCommits` is `disabled`: no commits during the build. `/complete` creates the final feature commit.
- Tick each step here as it is finished. Run `npm run lint` from the root after each step. There is no test or typecheck command.

## Build steps

- [x] **1. Server: model and library API.** Add `server/src/models/SavedMovie.js`, `server/src/controllers/libraryController.js` and `server/src/routes/library.js`; mount the router at `/api/library` in `server/src/index.js`; export `parseTmdbId` from `movieController.js` and reuse it for `DELETE`. Follow **Data / contracts** below.
  - Done when: with a running server, curl (or equivalent) shows that POST returns 201 and then 200 for the same movie with one document stored; a bad body returns 400 `{ message }`; `GET /library`, `?status=want` and `?status=watched` filter correctly; `?status=bogus` returns 400; DELETE returns 204, including on a repeat; every route returns 401 with no cookie; a second account sees none of the first account's movies and cannot delete them. `npm run lint` passes.

- [x] **2. Client: shared library state.** Extend `useMovieList` to also return `setMovies(update)`. Add `client/src/context/LibraryContext.jsx` (`LibraryProvider`) and `client/src/hooks/useLibrary.js`, mirroring `AuthContext` and `useAuth`. The provider calls `useMovieList('/library')` and exposes `{ status, movies, retry, add, remove }`. Wrap the `<Outlet />` in `ProtectedRoute` with it.
  - `add(movie)` POSTs only the five snapshot fields and upserts the returned movie by `tmdbId`, newest first. `remove(tmdbId)` sends the DELETE and then filters the movie out. Both update state only after the server succeeds, and both reject on failure.
  - Done when: the app behaves as before, `GET /api/library` fires once per session load (plus the StrictMode repeat in development), and a failure of that request does not block any page. `npm run lint` passes.

- [x] **3. WatchlistButton on cards.** Add `client/src/components/movies/WatchlistButton.jsx`, taking a `movie` with the snapshot fields, and render it in `MovieCard` under the title and year, aligned to the poster with `ml-(--offset)`. Make the `<article>` `flex h-full flex-col` and give the button wrapper `mt-auto`, so buttons in a row line up despite long titles. The button stays outside the `<Link>`. Follow **Button behaviour** below.
  - Done when: in the browser, adding and removing works on home and search; the same movie appearing in two rows updates in both; saved state survives a reload; ranked Top 10 buttons line up under the poster, not under the rank number; a blocked request shows the inline error and keeps the old state; Tab reaches the link and then the button. `npm run lint` passes.

- [x] **4. WatchlistButton on the details page.** In `MovieHero`, render the button between the genres and the overview, in a fixed-width wrapper. Build the snapshot from the details payload: `genreIds` from `genres[].id`, and `releaseYear` from the first four characters of `releaseDate`, or `null`.
  - Done when: adding from the details page stores the right `genreIds` and `releaseYear` (check the `GET /api/library` response, including a movie with no release date if one is at hand); the state matches the cards in the similar row. `npm run lint` passes.

- [x] **5. Library page.** Replace the placeholder in `client/src/pages/LibraryPage.jsx`. Keep the "My library" heading, then a `role="tablist"` holding one selected `role="tab"` (*Want to watch*) and a labelled `role="tabpanel"` that reads from `useLibrary()` and filters to `status === 'want'`. Render movies with `MovieGrid`.
  - States: loading (`role="status"` text); error (`role="alert"` with a *Try again* button calling `retry`, same pattern as `MovieSection`); empty ("Nothing on your watchlist yet", with a link to `/search`).
  - Focus: the tabpanel has `tabIndex={-1}`. Step 6 sets where focus goes after a removal.
  - Done when: saved movies appear newest first and open their details page; removing one takes it off the page right away; removing the last one shows the empty state; a failed load shows the error and *Try again* recovers; the page works at phone width. `npm run lint` and `npm run build` in `client/` pass.

- [x] **6. Repair audit findings F-12, F-13 and F-14.**
  - F-12: *Try again* on the library page moves focus to the tabpanel before retrying, so focus survives the button being removed. This covers only the library page; F-05 and F-09 stay separate.
  - F-13: when a removal makes the list shorter and focus has fallen to `document.body`, focus the button of the card now in the removed card's position, or the new last card's button if the last card was removed. Use the tabpanel only when the list is empty.
  - F-14: validate the POST `tmdbId` through `parseTmdbId` and delete `MAX_TMDB_ID`. Only a JSON number is accepted, as before.
  - Done when: in the browser, keyboard removal puts focus on the expected neighbouring button and the next Tab moves on from that card; removing the last remaining movie focuses the tabpanel; after *Try again*, focus is on the tabpanel and the next Tab reaches the first card, or *Try again* if the retry failed; the POST validation checks still pass. `npm run lint` and `npm run build` in `client/` pass.

- [x] **7. Repair audit findings F-16 and F-17.** In `WatchlistButton`, ignore repeated Enter on the toggle (`preventDefault()` on `keydown` when `event.repeat` is true) and ignore the later clicks of a multi-click (`event.detail > 1`). Keyboard activation reports `detail` 0, so it is unaffected.
  - Done when: in the browser, holding Enter on a library card removes one movie, and a fresh press after releasing removes one more; holding Space removes one; a double click removes one, and two separate single clicks remove two; a double click on a home card adds the movie and leaves it added. The earlier checks still pass. `npm run lint` and `npm run build` in `client/` pass.

## Files / areas

**New**
- `server/src/models/SavedMovie.js`
- `server/src/controllers/libraryController.js`
- `server/src/routes/library.js`
- `client/src/context/LibraryContext.jsx`
- `client/src/hooks/useLibrary.js`
- `client/src/components/movies/WatchlistButton.jsx`

**Changed**
- `server/src/index.js` - mount the router
- `server/src/controllers/movieController.js` - export `parseTmdbId`
- `client/src/hooks/useMovieList.js` - add `setMovies`
- `client/src/components/auth/ProtectedRoute.jsx` - wrap `<Outlet />` in the provider
- `client/src/components/movies/MovieCard.jsx`, `MovieHero.jsx`
- `client/src/pages/LibraryPage.jsx`

## Data / contracts

### SavedMovie (`timestamps: true`)

| Field | Definition |
| --- | --- |
| `user` | ObjectId, ref `User`, required |
| `tmdbId` | Number, required |
| `title` | String |
| `posterPath` | String, default `null` |
| `releaseYear` | Number, default `null` |
| `genreIds` | `[Number]` |
| `status` | String, enum `want`, `watched`, required |
| `rating` | Number, whole 1-5, default `null` |
| `watchedAt` | Date, default `null` |

- Unique compound index `{ user: 1, tmdbId: 1 }`.
- Document-level validation rejects a non-null `rating` unless `status` is `watched`, so it holds whichever field changes. Mongoose 9 `pre` hooks take no `next` callback.

### Serialized movie

An explicit projection, never the raw document. `user`, `_id` and `__v` are not returned.

`{ tmdbId, title, posterPath, releaseYear, genreIds, status, rating, watchedAt, createdAt }`

### Endpoints

All are behind `router.use(requireAuth)`. The owner always comes from `req.userId`, never from the request. Errors are `{ message }` from the central handler.

**`GET /api/library?status=`** → 200 `{ movies: [...] }`, newest first (`createdAt` then `_id`, descending).
- `status` absent or empty returns all of the user's movies; `want` or `watched` filters.
- Anything else, including a repeated parameter, returns 400.

**`POST /api/library`** with body `{ tmdbId, title, posterPath, releaseYear, genreIds }` → `{ movie }`.
- 201 when created. The server sets `status: "want"`; any `user`, `status`, `rating` or `watchedAt` in the body is ignored.
- 200 with the existing document when the movie is already saved. Use `create`, catch `err.code === 11000` and read the existing document. This makes double clicks and stale tabs safe, and it never overwrites the snapshot or resets a `watched` movie.
- Read the body as `req.body ?? {}` (Express 5 leaves it undefined with no JSON body). 400 unless:
  - `tmdbId`: integer from 1 to 999999999, the same range as `parseTmdbId`
  - `title`: non-empty string
  - `posterPath`: `null`, omitted, or a string starting with `/`
  - `releaseYear`: `null`, omitted, or an integer from 0 to 9999 (TMDB's year is any four digits)
  - `genreIds`: an array of integers, possibly empty

**`DELETE /api/library/:tmdbId`** → 204.
- Runs `deleteOne({ user: req.userId, tmdbId })`, and is 204 even when nothing matched, so a stale tab needs no special case.
- 400 for an invalid id, via `parseTmdbId`.

`movies` in `useMovieList` and the serialized movie share the `MovieCard` shape, so library items render without conversion.

### Button behaviour

Local `pending` and `failed` state in `WatchlistButton`; saved state comes from `useLibrary()`, where any saved entry for the `tmdbId` counts as saved.

| Library state | Visible text | Accessible name | Click |
| --- | --- | --- | --- |
| loading | `Watchlist` | `Watchlist: {title}` | ignored (`aria-disabled="true"`) |
| error | `Retry` | `Retry loading watchlist` | calls `retry` |
| ready, not saved | `+ Watchlist` | `Watchlist: {title}`, `aria-pressed="false"` | `add` |
| ready, saved | `✓ Watchlist`, accent-soft tint with accent border and text | `Watchlist: {title}`, `aria-pressed="true"` | `remove` |

- The `+` and `✓` glyphs are `aria-hidden`.
- The per-movie accessible name is needed because a page holds dozens of these buttons, and it keeps the visible word in the name.
- While a request is pending: `aria-busy="true"` and `aria-disabled="true"`, and clicks are ignored. Do not use the `disabled` attribute, which would drop keyboard focus.
- One held key or one double click makes one change: repeated Enter and the later clicks of a multi-click are ignored. On the library page the next card's button takes the removed card's place, under both the focus and the pointer, so without this a single gesture would remove several movies, and there is no undo.
- On failure: show `<p role="alert">` "Couldn't update. Try again." in `text-error` under the button, and keep the previous state. Clear it on the next click. A 401 needs no handling here, since the existing interceptor signs the user out.
- Include a `focus-visible` ring and `motion-reduce` handling, matching the other buttons.

## Testing

No test runner is configured, so tests are not a gate, and none are added here. Evidence comes from `npm run lint`, `npm run build` in `client/`, the API checks in step 1 and manual browser checks in steps 3-5, which need a running MongoDB and a valid `TMDB_API_KEY`. Record only checks that were actually run, and say so if any could not be.

## Notes for the AI

- `ProtectedRoute` unmounts the provider whenever the session is not authenticated, so one account's library cannot carry over to the next login. No `key` or manual reset is needed.
- Reuse `useMovieList` for fetching rather than writing a second fetch hook. It already handles abort, retry and the `{ movies }` response.
- The library tab filters the shared client state rather than calling `?status=want`, so a removal updates cards and the tab from one source. `?status=` is still implemented because it is part of the API contract in the project overview.
- Render `title` as React text only. `posterPath` is only ever appended to the fixed TMDB image base URL. The snapshot is client-supplied, but it only affects that user's own data.
- `MovieRow`'s `revealFocusedCard` now also fires for the button. Check that tabbing along a row still scrolls properly, and update its comment only if the behaviour changes.
- The year's `mb-3` in `MovieCard` only applies when there is a year. Put the spacing on the button wrapper so cards with no year keep the same gap.
- The tablist has one tab on purpose. Feature 10 adds *Watched*, keyboard switching between tabs, and any tab state in the URL.
- Feature 10 must decide how removal works for a watched movie, because `DELETE` would also discard its rating. No watched movies can exist until then.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":14217,"specSha256":"09414c68d2999362b9b534a82f2df7006bbfb77bf624f42a7943735a46c3d487","branch":"refs/heads/feature/watchlist","head":"2988cc020db0f3b15a7f71696cb37c33ee04a54d","baseRef":"refs/heads/main","baseCommit":"2fe3cc67a9a93981983ec4c86330f95be76c4aed","sourceTree":"26022193a9ffdbcbeddd8b8f4aabcc61b927a2d3","landing":"local-merge","absentOptional":[]} -->

## Findings

### 9/F-12 [P3] closed - Library "Try again" drops keyboard focus on every retry

**File:** client/src/pages/LibraryPage.jsx:54
**Found:** 2026-11-06 by /audit (scope: current; lens: quality)
**Why it matters:** A retry replaces the error block with the loading text, which removes the focused button. Reproduced in headless Chrome: after pressing Enter on *Try again* and a successful reload, focus was on the document body, so a keyboard user restarts from the top of the page. It is the same pattern as F-05 and F-09, and this feature adds another copy of it.
**Suggested fix:** Fix alongside F-05 and F-09. On this page, focus the tabpanel when a retry finishes, since it already has `tabIndex={-1}`. The retry block is now copied into five components, so a shared local component would keep the fix in one place. No current requirement would be lost.
**Resolution:** `handleRetry` moves focus to the tabpanel before retrying. Checked in headless Chrome: after a successful or a failed retry, focus is on the panel, and the next Tab reaches the first card or *Try again*. The shared retry component was not added, and F-05 and F-09 are unchanged. Awaiting re-review by /audit. Closed by /audit on 2026-11-06: re-read `handleRetry` at client/src/pages/LibraryPage.jsx:31, and the earlier Chrome run shows focus on the panel after a successful and a failed retry. No new defect from this repair. This was a self-review by the builder, not independent. Reconfirmed by /audit independent at 2988cc0 on 2026-11-06: in headless Chrome with a mock API, focus was on the panel during and after a successful retry and the next Tab reached the first card's link.

### 9/F-13 [P3] closed - Removing a movie sends the next Tab back to the first card

**File:** client/src/pages/LibraryPage.jsx:20
**Found:** 2026-11-06 by /audit (scope: current; lens: quality)
**Why it matters:** After a removal, focus moves to the tabpanel as the spec requires, and the page does not scroll (measured in headless Chrome: 0px with the keyboard, 7px with the mouse). But the panel comes before every card in tab order, so the next Tab goes to the first card. A keyboard user clearing a long watchlist loses their place after each removal. The next Tab itself was reasoned from DOM order, not run in a browser. This follows the approved spec, so it is a refinement and not a contract break.
**Suggested fix:** Move focus to the next card's button, or the previous one when the last card was removed, and use the tabpanel only when the list becomes empty. This changes behaviour the spec chose, so it needs your decision. No current requirement would be lost.
**Resolution:** By the user's /fix request, focus now moves to the button of the card that takes the removed card's place, or the new last card, and to the tabpanel only when the list is empty. Spec steps 5 and 6 were updated to match. Checked in headless Chrome on a 40-movie list with real keyboard and mouse input, including the next Tab and no page jump. Awaiting re-review by /audit. Re-examined by /audit on 2026-11-06 and not closed: the original defect is gone, but this repair introduced F-16, so it stays `fixed` until F-16 is resolved. Closed by /audit independent at 2988cc0 on 2026-11-06: re-read the effect at client/src/pages/LibraryPage.jsx:19 and ran the production build in headless Chrome with a mock API. Removing the first of 5 focused the new first card's button and the next Tab reached the following card's link; removing the last of 3 focused the new last button; removing the only movie focused the tabpanel; two overlapping removals left focus on the next button. F-16 is now closed, so the new defect this repair exposed is resolved.

### 9/F-14 [P3] closed - The TMDB id range is defined in two places

**File:** server/src/controllers/libraryController.js:5
**Found:** 2026-11-06 by /audit (scope: current; lens: quality)
**Why it matters:** `MAX_TMDB_ID` in the POST validation and the regex in `parseTmdbId` (server/src/controllers/movieController.js:51) state the same limit separately. If only one changes, a movie could be saved that `DELETE` then rejects with a 400, leaving it stuck in the library. The two agree today, so nothing is broken.
**Suggested fix:** Validate the POST id through one shared helper with `parseTmdbId`, and drop `MAX_TMDB_ID`. No current requirement would be lost.
**Resolution:** POST now validates `tmdbId` through `parseTmdbId` and `MAX_TMDB_ID` is gone. API checks cover zero, negative, fractional, huge, string, missing and over-range ids, plus saving and deleting the largest allowed id. Awaiting re-review by /audit. Closed by /audit on 2026-11-06: re-read `parseSnapshot` at server/src/controllers/libraryController.js:21, no `MAX_TMDB_ID` remains in server/src, and the 47 API checks pass. No new defect from this repair. This was a self-review by the builder, not independent. Reconfirmed by /audit independent at 2988cc0 on 2026-11-06: `MAX_TMDB_ID` is gone, and calling `addToLibrary` directly with Mongoose stubbed accepted 1 and 999999999 and returned 400 for 0, negative, fractional, 1000000000, 1e21, string, object and missing ids. The 47 API checks were not rerun.

### 9/F-16 [P1] closed - Holding Enter on the library page removes movie after movie

**File:** client/src/pages/LibraryPage.jsx:27
**Found:** 2026-11-06 by /audit (scope: current; lens: quality)
**Why it matters:** The F-13 repair moves focus to the next card's remove button as soon as a removal finishes. Enter key repeat then activates that button too, with no confirmation and no undo. Reproduced in headless Chrome: Enter held for about 0.8s, with repeats every 33ms, took a test library from 20 movies to 0. Real key repeat usually starts after a delay of around half a second, so a real hold would need to be longer, but the outcome is the same. Space does not do this: it removed one movie. The movies are not recoverable from the app, and the user may not remember what was saved. The earlier repair check "Enter again removes the next one straight away" passed because it tested separate presses and did not consider a held key.
**Suggested fix:** Ignore repeated Enter in `WatchlistButton`: `onKeyDown` calls `preventDefault()` when `event.repeat` is true. Then rerun this hold test. Reverting to panel focus also removes the risk, but brings back F-13. No current requirement would be lost.
**Resolution:** `WatchlistButton` calls `preventDefault()` on repeated Enter. Checked in headless Chrome with auto-repeat key events: a hold removes one movie, and a fresh press removes one more. The same hold on a home card toggles once, and held Space removes one. Awaiting re-review by /audit. Closed by /audit independent at 2988cc0 on 2026-11-06: re-read `ignoreKeyRepeat` at client/src/components/movies/WatchlistButton.jsx:36 and ran the production build in headless Chrome with a mock API, using key events flagged as auto-repeat every 33ms. From 20 movies, a 1.5s hold removed one with an instant response and one with a 300ms response, and a hold released before a 1.2s response also removed one. A fresh press then removed one more. As a control, 8 separate rapid presses removed 8, so the run could detect multiple removals. A hold on a home card made one POST and no DELETE. Chrome only, synthetic key events, no physical keyboard.

### 9/F-17 [P2] closed - Double-clicking remove also removes the next movie

**File:** client/src/components/movies/WatchlistButton.jsx:34
**Found:** 2026-11-06 by /audit (scope: current; lens: quality)
**Why it matters:** On the library page the removed card leaves the grid straight away, so the next card's button moves under the pointer. The `pending` guard only covers the card that was clicked. Reproduced in headless Chrome: two clicks 150ms apart at one point took a test library from 20 movies to 18, with no undo. This comes from the immediate removal in step 5, not from the F-13 repair. On the home page the same double click adds and then removes one movie, which leaves the state as it was. Only local response times were tested; a slower server would widen the protection of the `pending` guard for the first click but not change the outcome once the response arrives.
**Suggested fix:** Ignore the second click of a double click in `handleClick` with `if (event.detail > 1) return`. Keyboard activation reports `detail` 0, so it is unaffected. Whether Chrome reports `detail` 2 once the target has changed still needs testing, so rerun this double-click test after the change. No current requirement would be lost.
**Resolution:** `handleClick` ignores clicks with `event.detail > 1`. Checked in headless Chrome with mouse events carrying a click count: a double click or triple click removes one movie, two separate clicks remove two, and a double click on a home card adds and stays added. These were synthetic input events, not a physical mouse. Awaiting re-review by /audit. Closed by /audit independent at 2988cc0 on 2026-11-06: re-read `handleClick` at client/src/components/movies/WatchlistButton.jsx:40 and ran the production build in headless Chrome with a mock API. A double click removed one with an instant response and with a 400ms response, a triple click removed one, two clicks 600ms apart removed two, and a double click on a home card added the movie and left it added. Two taps through Chrome's touch emulation, 120ms and 250ms apart, reported `detail` 1 then 2 and removed one. Physical mouse and touch input and other browsers were not run.

## Independent review

**Status:** passed
**Target commit:** 2988cc020db0f3b15a7f71696cb37c33ee04a54d
**Base commit:** 2fe3cc67a9a93981983ec4c86330f95be76c4aed
**Base ref:** main
**Spec hash:** 09414c68d2999362b9b534a82f2df7006bbfb77bf624f42a7943735a46c3d487
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-11-06T10:52:02Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-06T11:05:01Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npm run lint` (root, client then server): pass
- `npm run build` (client): pass
- Library handlers and SavedMovie model called directly in Node with Mongoose calls stubbed, no database: pass
- Production client build in headless Chrome with every request answered by a mock API inside the browser: pass
- test command: unavailable, none declared
- typecheck command: unavailable, none declared
- security or dependency scanner: unavailable, none declared
- `/check`: not run, not required by this request

## Evidence

- Target, merge base from `main`, spec hash, model and working tree were verified before the review. Only `blueprint/context/review.md` differed from the target.
- All 13 product files in `2fe3cc6..2988cc0` were read, along with their callers and contracts.
- API: every query is scoped by `req.userId`. Body-supplied `user`, `status`, `rating` and `watchedAt` never reached `create`. Invalid POST fields, status values and DELETE ids returned 400, a duplicate returned the existing document without overwriting it, and the response carries only the projected fields.
- Auth: `requireAuth` returned 401 with no cookie and with a bad token. The cookie is httpOnly and `sameSite: lax`.
- Model: `validate()` rejected a rating on a `want` movie, ratings 0, 6 and 2.5, and a bad or missing status.
- Browser, held key: from 20 movies, a held Enter removed one at 0ms, 300ms and 1200ms response times, and a held Space removed one. The control of 8 separate presses removed 8.
- Browser, clicks: a double or triple click removed one, two separate clicks removed two, and two emulated touch taps removed one.
- Browser, focus: removing a movie moved focus to the expected neighbour, or to the tabpanel when the list emptied, and focus stayed on the button through the loading-to-ready and retry-to-ready changes.
- Browser, other states: a failed DELETE or POST showed the inline alert and kept the old state, a 401 redirected to `/login`, `GET /library` fired once per load, and details POST bodies had the right `genreIds` and `releaseYear`, including null. Row buttons lined up and pages had no horizontal scroll at 375px.

## Findings

- F-18 [P3] open (new, not blocking)
- F-13 [P3], F-16 [P1] and F-17 [P2] moved from fixed to closed
- F-12 and F-14 reconfirmed closed; F-15 re-examined and still unverified
- No P0 or P1 finding is open or fixed

## Remaining risk

- No test, typecheck or security scanner command is declared, so these signals are unavailable, and the validation logic has no automated tests. Dependencies were not scanned for vulnerabilities.
- The real server and MongoDB were not exercised, to protect the owner's data. The unique index, two-account isolation and Mongoose array serialization were read from code or stubbed, not run in this pass; the builder's API checks are the only runtime evidence for them.
- Browser runs used mock responses, synthetic input and Chrome only. A physical keyboard, mouse or touch screen, Firefox, Safari and any screen reader were not run. Visual fidelity was not inspected, since only positions were measured.
- `GET /api/library` is unpaginated by the spec's scope, and large libraries were not measured.
- Feature 10 must keep F-15 in mind, and the neighbour lookup in LibraryPage.jsx relies on each card holding exactly one button, so star buttons there would need that selector changed.

## Try guide

Not generated. `qualityGates.regular.tryGuide` selected it, and the user chose on 2026-11-06 to complete without running `/check guide`. No manual try-through is recorded as done.
