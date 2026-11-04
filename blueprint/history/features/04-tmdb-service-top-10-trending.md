# Feature: TMDB service + Top 10 trending

**From build-plan:** feature 4
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/tmdb-service-top-10-trending`

## Goal

The home page becomes the app's front door. A signed-in user sees this week's 10
most popular movies in one sideways-scrolling row, with large outlined rank numbers
behind the posters. All movie data comes through a new server-side TMDB wrapper, so
the API key never reaches the browser.

## Design reference

- `prototypes/home.html` for the row and card structure, and `prototypes/theme.css`
  for the sizing tokens. Read both before Step 4. They are deleted in Step 5.
- "Visual direction" in `blueprint/project-plan.md` stays as the lasting reference.
- Do not port the prototype's `--poster-a` to `--poster-j` gradients, or its
  `.is-hover` and `.is-focus` classes. They exist only for mockup review.
- The prototype's navbar, footer and page wrapper already exist in the app.

## In scope

- `server/src/services/tmdb.js`: authenticated TMDB requests, trending movies, and a
  cached genre list (id to name).
- `TMDB_API_KEY` added to the server's required startup variables.
- `GET /api/movies/trending`, behind `requireAuth`.
- Home page with loading, error (with retry), empty and populated states.
- `MovieCard` and the Top 10 row, matching Visual direction, including hover,
  keyboard focus and reduced-motion behavior.
- Deleting `prototypes/` as the last step.

## Out of scope

- The watchlist button and watched state with stars (Features 9 and 10). The card
  ends after the year. No disabled or placeholder button.
- `GET /movies/genres` and any use of the genre list (Features 6 and 13).
- Search, the details page content (Feature 7), and similar movies. Cards link to
  the existing `/movie/:tmdbId` placeholder.
- Caching trending responses ("TMDB caching" is under Later in the build plan).
- Loading skeletons, toasts and focus management after retry (Feature 14). Loading
  is a plain status line, as in `ProtectedRoute`.
- Scroll arrows, snap scrolling or other row controls.
- New dependencies, a test runner, or changes to `errorHandler.js`.

## Build loop

`workflow.stepReview` is `feature`: build all steps in order without stopping for
per-step approval, and keep the project working after each one. Review happens at
`/check` and `/audit current`. `workflow.checkpointCommits` is `disabled`: make no
commits during the build. `/complete` creates the final feature commit.

## Build steps

- [x] **1. TMDB service.** Add `server/src/services/tmdb.js` following Data /
  contracts, using Node's native `fetch`. Export `getTrendingMovies()` and
  `getGenreMap()`. Add `TMDB_API_KEY` to the `missing` check in
  `server/src/index.js`.
  **Done when:** the stubbed-fetch rows under Testing behave as written, the server
  exits with the existing message when `TMDB_API_KEY` is unset, and `npm run lint`
  passes.
- [x] **2. Trending endpoint.** Add `server/src/controllers/movieController.js` and
  `server/src/routes/movies.js`, and mount the router at `/api/movies` in
  `server/src/index.js`. The whole router uses `requireAuth`.
  **Done when:** every row of the API table under Testing behaves as written, and
  `npm run lint` passes.
- [x] **3. Home page data states.** Add `client/src/hooks/useTrendingMovies.js`,
  which returns `{ status, movies, retry }` and aborts its request on unmount. Update
  `HomePage.jsx` to render the heading, the intro "What people are watching this
  week.", and each state. In the populated state, a plain ordered list of titles is
  enough until Step 4.
  **Done when:** the state rows of the UI table under Testing behave as written, and
  `npm run lint` and `npm run build` in `client/` pass.
- [x] **4. MovieCard and Top 10 row.** Port the sizing tokens to
  `client/src/index.css`, add `client/src/components/movies/MovieCard.jsx` and
  `client/src/components/movies/TopTenRow.jsx`, and render the row from `HomePage`.
  **Done when:** the visual rows of the UI table under Testing are observed at about
  360px and 1280px wide, and `npm run lint` and `npm run build` in `client/` pass.
- [x] **5. Remove the prototype.** Delete `prototypes/`.
  **Done when:** the folder is gone, `git grep -n "prototypes/" -- client server`
  finds nothing, `npm run build` in `client/` passes, and the home page still renders
  as in Step 4.

## Files / areas

- New: `server/src/services/tmdb.js`, `server/src/controllers/movieController.js`,
  `server/src/routes/movies.js`, `client/src/hooks/useTrendingMovies.js`,
  `client/src/components/movies/MovieCard.jsx`,
  `client/src/components/movies/TopTenRow.jsx`
- Changed: `server/src/index.js`, `client/src/pages/HomePage.jsx`,
  `client/src/index.css`, `client/src/components/layout/Layout.jsx`
- Deleted: `prototypes/home.html`, `prototypes/theme.css`
- Reused unchanged: `requireAuth`, the central `errorHandler`, the shared Axios
  instance and its 401 interceptor, the `/movie/:tmdbId` route, the Inter font link
  in `client/index.html` (it already loads weight 900).

## Data / contracts

### `GET /api/movies/trending`

Requires a valid session cookie. The data is the same for every user, so there is no
ownership scope. The endpoint takes no input.

`200`, in TMDB's order, at most 10 items:

```json
{
  "movies": [
    {
      "tmdbId": 693134,
      "title": "Dune: Part Two",
      "posterPath": "/abc.jpg",
      "releaseYear": 2024,
      "genreIds": [878, 12]
    }
  ]
}
```

These field names match the SavedMovie snapshot that Feature 9 stores. An empty
`movies` array is a valid `200`. `401` is `{ "message": "Not authenticated" }` from
`requireAuth`. Any TMDB failure is `500` `{ "message": "Internal server error" }`
from the central handler.

### TMDB requests

- Source: page 1 of `GET https://api.themoviedb.org/3/trending/movie/week`, and
  `GET /genre/movie/list` for genres, both in TMDB's default language.
- Auth: the v3 key as an `api_key` query parameter, read once at module load.
- Timeout: 8 seconds with `AbortSignal.timeout`.

### Field validation for trending results

Drop an entry unless `id` is a positive integer and `title` is a non-empty string.
Take the first 10 entries left. A missing or non-array `results` is a failure, not an
empty list. For kept entries:

| Output | Rule |
| --- | --- |
| `tmdbId` | `id` |
| `title` | `title` |
| `posterPath` | `poster_path` if it is a string starting with `/`, otherwise `null` |
| `releaseYear` | leading 4 digits of `release_date` as a Number, otherwise `null` |
| `genreIds` | the integers in `genre_ids`, otherwise `[]` |

### Failure handling in the wrapper

- Network errors, timeouts, non-2xx responses, unparseable JSON and invalid shapes all
  throw a plain `Error` whose message names the TMDB path and reason, never the full
  URL. Do not keep the original error as `cause`.
- The thrown error must have no `status` or `statusCode`. Otherwise the central
  handler would forward TMDB's 4xx, and a TMDB `401` would look like an expired
  session and sign the user out.
- The API key never appears in a response or a log line.

### Genre cache

`getGenreMap()` resolves to a `Map<number, string>`.

- **Fetched lazily on first call**, not at startup. A TMDB outage cannot stop the
  server from booting, and trending does not depend on the genre list.
- **Concurrent callers share one in-flight request.**
- **A failure is not cached.** The failed promise is cleared so the next call
  retries.
- **A successful list lasts for the life of the process.** A restart refreshes it.
- **Invalid data is a failure.** Keep entries with an integer `id` and a non-empty
  string `name`. A missing `genres` array or no valid entries throws, so an empty map
  is never cached.

This answers the open question in `project-overview.md`. Features 6 and 13 must still
handle an id missing from the map.

### Client states

| State | Render |
| --- | --- |
| Loading | `role="status"` text "Loading trending movies..." |
| Error | `role="alert"` text "We couldn't load trending movies." and a "Try again" button styled like the one in `ProtectedRoute` |
| Empty | Muted text "No trending movies right now." |
| Populated | The Top 10 row |
| Session expired (401) | Handled by the existing interceptor, which redirects to `/login`. No code in the hook. |

The heading and intro show in every state. Retry returns to Loading and sends a new
request. At the user's request, the home page content is vertically centered between
the navbar and footer. `Layout` stretches its content area so a page can do this, and
other pages stay top-aligned.

### Card and row

- `TopTenRow` is an `<ol>` with `overflow-x-auto`, labelled by the page heading.
  Its scrollbar is hidden at the user's request, and the row still scrolls by
  trackpad, touch, Shift+wheel and keyboard focus.
  Rank is the array index plus 1. Keep the prototype's small padding with matching
  negative margin, so the poster lift and focus ring are not clipped. When focus
  enters a card, scroll its link fully into view with `scroll-px-2` as the margin.
  Chrome's default leaves the poster off-screen when only the rank number shows.
- `MovieCard` takes `movie` and `rank`, and follows the prototype's structure: a link
  to `/movie/:tmdbId` (React Router `Link`) holding the rank, the poster and an `<h2>`
  title, then the year outside the link. Omit the year when `releaseYear` is `null`.
- Poster: `https://image.tmdb.org/t/p/w342` + `posterPath`, with `alt=""` because the
  title is in the same link, and `loading="lazy"`. This image CDN needs no key, so it
  does not conflict with "the client never calls TMDB directly".
- With no `posterPath`, the poster area is `surface-raised` and shows the title as
  `aria-hidden` text, as the prototype's placeholders do.
- Rank: page-colored text, `2px` muted outline, weight 900, behind the poster's left
  edge. The outline turns accent blue on hover. Leave it readable to screen readers,
  so the link is announced as "1 Dune: Part Two".
- The "10" card uses the wide offset, so all numerals stay the same size.
- Hover lifts the poster 4px with the stronger border and the lift shadow. The focus
  ring sits on the poster, using `group-focus-visible`, and the link's own outline is
  removed. With reduced motion, there is no transition and no lift.

### Tokens

Add to `client/src/index.css`, with the values from `prototypes/theme.css`:

- `--poster-width`, `--rank-size`, `--rank-offset` and `--rank-offset-wide` on `:root`
  inside `@layer base`, and read them through `var()` in arbitrary values. They are
  not utility namespaces, and Tailwind may drop unused `@theme` variables.
- `--shadow-lift` in `@theme`, for a `shadow-lift` utility.

## Testing

No test command exists, so tests are not a gate, and there is no Verify command to
run. Use the evidence below and report anything not run as not run.

**Stubbed fetch (service).** Run a throwaway script from the scratchpad, not committed,
that sets `TMDB_API_KEY=test`, replaces `globalThis.fetch`, and imports the service:

| Stubbed TMDB behavior | Expected |
| --- | --- |
| 12 valid results | 10 items in order, exact shape, no snake_case keys |
| Entry with no `id`, or an empty title, among the results | Dropped, and the next entry fills the slot |
| `poster_path: null`, `release_date: ""`, `genre_ids` missing | `null`, `null`, `[]` |
| `results: []` | Resolves to `[]` |
| `results` missing | Rejects |
| Fetch rejects, or returns 401 | Rejects with no `status`, and the key is absent from message and stack |
| `getGenreMap()` called twice at once, then again | One fetch in total |
| `getGenreMap()` fails, then is called again | Second call fetches again and succeeds |
| `genres: []` | Rejects and is not cached |

**API (running server).** The first two rows need no valid TMDB key. The rows after
them need a real one.

| Request | Expected |
| --- | --- |
| No cookie | `401` `{ "message": "Not authenticated" }` |
| Signed in, server started with a deliberately invalid `TMDB_API_KEY` | `500` `{ "message": "Internal server error" }`, the session stays valid (`GET /api/auth/me` is `200`), and the key is not in the server log |
| Signed in, valid key | `200` with 10 movies in the contract shape |
| Network response in the browser | The `TMDB_API_KEY` value does not appear |

**UI (browser, when available).**

| Scenario | Expected |
| --- | --- |
| Slow load (throttled network) | Loading line, then the row |
| API failing | Error message and "Try again", and the user stays signed in |
| Retry after restoring the API | Loading, then the row |
| Empty `movies` (intercepted response) | Empty message |
| Cookie cleared, then reload or retry | Redirect to `/login` |
| Missing poster (intercepted response) | Placeholder tile with the title, and the layout stays aligned |
| 360px and 1280px | One row. It scrolls sideways, and the page does not (`documentElement.scrollWidth` equals `clientWidth`) |
| Row | Numerals are the same size, "10" is wider, and titles line up under the posters |
| Hover | Poster lifts and the outline turns blue |
| Tab through the row | The ring shows on the poster, is not clipped, and each focused card scrolls into view |
| Reduced motion emulated | No lift and no transition |
| Enter on a focused card | Goes to `/movie/:tmdbId` |

## Notes for the AI

- `server/.env` has a v3 `TMDB_API_KEY` that TMDB accepted on `GET /genre/movie/list`
  during planning, so the valid-key rows can run. Never print the value.
- Express 5 forwards async rejections to the error handler, so the controller needs
  no wrapper. It stays thin: call `getTrendingMovies()` and send `{ movies }`.
- `/api/movies/trending` must stay ahead of any future `/:tmdbId` route.
- React escapes TMDB text. Do not use `dangerouslySetInnerHTML`.
- `client/src/index.css` has no `:root` block yet. Keep `@import` and `@theme` as they
  are, and add to the existing `@layer base`.
- Tailwind has no text-stroke utility, so use arbitrary properties such as
  `[-webkit-text-stroke:2px_var(--color-muted)]`. Keep inline `style` out of the card.
- Follow the writing standards: no em dashes in comments or docs.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":14181,"specSha256":"f92a205587581ed3302bd46792c8ae1f5ed6f7a839d77dabb871041d59ea4dba","branch":"refs/heads/feature/tmdb-service-top-10-trending","head":"41b8347ad01ba5a7daa732edc653a7077055049b","baseRef":"refs/heads/main","baseCommit":"01dafb19195013a2e79d0ebdf00cb15603bd97c0","sourceTree":"ef9bc3cc4fbf8ca9c2b1c2692759da52f4cebf39","landing":"local-merge","absentOptional":[]} -->

## Findings

No finding was resolved by this work. F-01, F-04, F-05 and F-06 stay in the live ledger at their current status.

## Independent review

**Status:** passed
**Target commit:** 41b8347ad01ba5a7daa732edc653a7077055049b
**Base commit:** 01dafb19195013a2e79d0ebdf00cb15603bd97c0
**Base ref:** main
**Spec hash:** f92a205587581ed3302bd46792c8ae1f5ed6f7a839d77dabb871041d59ea4dba
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-11-04T17:44:15Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-04T17:47:56Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `01dafb19195013a2e79d0ebdf00cb15603bd97c0..41b8347ad01ba5a7daa732edc653a7077055049b` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `git rev-parse HEAD`, `git merge-base main <target>`, `sha256sum blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass, all match the request; only review.md and findings.md differ from the target
- `git diff <base> <target>` and `git grep` over the target: pass, complete delta read; `git grep -n "prototypes/" -- client server` finds nothing
- `npm run lint` (root): pass, no diagnostics in client or server
- `npm run build` in client/: pass, 106 modules; output in ignored client/dist
- `node <scratchpad>/tmdb-stub.mjs` (real service with stubbed fetch, no network): pass, 17 of 17 cases
- `node <scratchpad>/inspect.cjs` (overview source hash and built CSS selectors): pass for the committed plan blobs and every selector checked
- Test command: unavailable, no runner configured
- Typecheck command: unavailable, plain JavaScript project
- Verify command: unavailable, not configured
- `/check`, API rows and UI rows of the spec's Testing section: not run, not required by this request and dev servers were out of bounds

## Evidence

- Read all of the code in the delta: server/src/services/tmdb.js, controllers/movieController.js, routes/movies.js, index.js; client/src/hooks/useTrendingMovies.js, pages/HomePage.jsx, components/movies/MovieCard.jsx, components/movies/TopTenRow.jsx, components/layout/Layout.jsx, index.css. Also read the plan diffs and the deletion of prototypes/.
- Followed callers and dependencies: requireAuth, errorHandler, lib/api.js, the 401 interceptor in context/AuthContext.jsx, ProtectedRoute.
- Security: the router-level `requireAuth` covers the endpoint, which takes no input. Thrown TMDB errors carried no `status`, `statusCode`, `cause`, URL or key in the stubbed rejected-fetch, 401 and bad-JSON cases, and the catch uses only `err.name`, so `errorHandler` returns 500 and logs no key. Only the server reads `TMDB_API_KEY`, and server/.env is ignored.
- Contract: stubbed cases cover the 10-item limit, order, exact shape, dropped invalid entries, poster, year and genre rules, empty and missing `results`, one shared genre fetch, and uncached genre failures.
- Client: the abort guard covers unmount and retry. A 401 reaches the existing interceptor, which sets the session anonymous, and ProtectedRoute then redirects.
- Styling: token values match the deleted prototypes/theme.css at the base commit. The built CSS holds the arbitrary-value utilities, and the reduced-motion rule sorts after the hover lift.
- Layout: the two pages that center with `mx-auto` also set `w-full`, so the new flex column does not shrink them.
- Performance: an uncached trending request per home mount is explicitly out of scope, each TMDB call has an 8 second timeout, and the payload is at most 10 movies.
- Tests: no skipped, focused or placeholder tests in the delta; none were added, as the spec states.

## Findings

- None new. F-06 [P3] re-examined and still open, with its line reference corrected. F-01, F-04 and F-05 cite files outside this delta and were left unchanged. No P0 or P1 finding is open or fixed.

## Remaining risk

- Test, typecheck and Verify commands are unavailable, so the logic has no committed regression coverage.
- Not run by this reviewer: the running-server API rows (including the invalid-key and valid-key rows), the live TMDB contract, and every browser UI row (360px and 1280px layout, hover, focus scrolling, reduced motion, retry, redirect). Visual claims rest on reading the code and the built CSS.
- No dependency or vulnerability scanner is declared, so none was run.
- "Try again" on the home page drops keyboard focus on retry, as F-05 records for the session guard. The spec defers this to Feature 14, so it is not recorded as a new finding.
- The overview's source hash matches the committed plan blobs (LF) but not the CRLF working copies under `core.autocrlf=true`, so a tool hashing working-tree bytes in this checkout could report false plan drift. Whether `/blueprint-status` does this was not tested.

## Try it now

Run or do:

With MongoDB running, run `npm run dev` in the project root, open http://localhost:5173, sign in, and scroll the row sideways.

Expected:

The home page shows "Top 10 trending" and 10 real posters in one row, vertically centered between the navbar and footer, with large outlined numbers 1 to 10 behind them and no scrollbar. The row scrolls sideways but the page doesn't. Hovering a card lifts its poster and turns its number's outline blue. Clicking a card opens `/movie/<id>`.

This proves:

A real signed-in session gets live TMDB data through the new endpoint and shows it in the Top 10 row.
