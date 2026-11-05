# Feature: Home page rows

**From build-plan:** feature 4a
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/home-page-rows`

## Goal

Turn the home page from a single Top 10 into a browsable front door by adding
*Popular*, *Top rated* and *Upcoming* rows of regular movie cards under the Top 10.
The page stops being vertically centered because it now holds more than one row.

## In scope

- Three authenticated server endpoints: `GET /api/movies/popular`,
  `GET /api/movies/top-rated`, `GET /api/movies/upcoming`.
- Three home page rows, in this order, under the Top 10: *Popular*, *Top rated*,
  *Upcoming*.
- `MovieCard` without a rank: no rank number and no left offset, so it is just the
  poster, title and year.
- One sideways-scrolling row component shared by the Top 10 and the new rows.
- Independent loading, empty and error (with retry) states for each row, including
  the Top 10. One failing row does not affect the others.
- Home page layout starts at the top of the content area instead of centering.
- A valid heading order for the page (see Data / contracts).
- Replace the feature 4a TODO in `project-overview.md` by adding the three
  endpoints to its API table, and add the same rows to the API table in
  `project-plan.md`.

## Out of scope

- Search, filters, details page and similar movies (features 5-8). Cards keep
  linking to the existing `/movie/:tmdbId` placeholder.
- The watchlist button and watched state on cards (features 9-10).
- Loading skeletons, toasts and the keyboard accessibility pass (feature 14).
  Rows use the same text loading state the Top 10 has today.
- Server-side caching of TMDB responses, listed under Later in the build plan.
- *See all* links, pagination or arrow buttons on rows.
- Any change to the Top 10's look, its copy or its limit of 10.
- A test runner. Tests are not a gate in this project yet.

## Build loop

Build one small step at a time. `workflow.stepReview` is `feature`, so produce one
review packet after all steps rather than pausing after each one.
`workflow.checkpointCommits` is `disabled`, so make no checkpoint commits.
`/complete` makes the final feature commit. Split any diff too large to review.

## Build steps

- [x] **Step 1 - Server endpoints** - In `services/tmdb.js`, extract the shared
  fetch, results-array check, `isValidMovie` filter and `toMovieSummary` map into
  one internal helper. Have `getTrendingMovies` use it and keep its limit of 10. Add
  `getPopularMovies`, `getTopRatedMovies` and `getUpcomingMovies`, then thin
  controllers and routes for them. *Done when:* with a valid session each new
  endpoint returns `{ movies: [...] }` in the existing summary shape, an anonymous
  request returns 401, `GET /api/movies/trending` still returns 10 movies, and
  `npm run lint` passes.
- [x] **Step 2 - Generalize the list hook** - Replace `useTrendingMovies` with
  `useMovieList(path)`, keeping the same `{ status, movies, retry }` result and abort
  handling, with `path` in the effect dependencies. Point `HomePage` at
  `/movies/trending` and delete the old hook. *Done when:* the Top 10 still loads and
  retries as before, nothing imports `useTrendingMovies`, and `npm run lint` passes.
- [x] **Step 3 - Regular cards and the shared row** - Make `rank` optional on
  `MovieCard`: without it, render no rank number and set `[--offset:0px]`. Replace
  `TopTenRow` with `MovieRow({ movies, labelledBy, ranked })`, which renders an `ol`
  with ranks when `ranked` and a `ul` without them, and keeps the existing scroller
  classes and focus reveal. Change the card title from `h2` to `h3`. *Done when:* the
  Top 10 looks unchanged through `MovieRow ranked`, an unranked row shows posters
  flush left with no number, and `npm run lint` passes.
- [x] **Step 4 - Home page sections** - Add `MovieSection`, which owns its own
  `useMovieList` call, heading, optional subheading, and loading, error and empty
  states, and renders `MovieRow` when ready. Rebuild `HomePage` from one ranked
  section and three unranked ones, add the visually hidden `h1`, and remove
  `justify-center`. *Done when:* all four rows render top-down in order, the page
  scrolls vertically, and at 375px wide only the rows scroll sideways, never the
  page. Each row must show its own state: blocking one endpoint shows that row's
  error and working retry while the other rows still render. `npm run lint` and the
  client `npm run build` pass.
- [x] **Step 5 - Record the contract** - Add the three endpoints to the API tables
  in `blueprint/project-plan.md` and `blueprint/context/project-overview.md`, and
  remove the overview's feature 4a TODO. *Done when:* both tables list the endpoints
  and the TODO is gone.

## Files / areas

Server:

- `server/src/services/tmdb.js` - shared helper and three new functions
- `server/src/controllers/movieController.js` - three handlers
- `server/src/routes/movies.js` - three routes

Client:

- `client/src/hooks/useMovieList.js` - new, replaces `useTrendingMovies.js`
- `client/src/hooks/useTrendingMovies.js` - deleted
- `client/src/components/movies/MovieRow.jsx` - new, replaces `TopTenRow.jsx`
- `client/src/components/movies/TopTenRow.jsx` - deleted
- `client/src/components/movies/MovieSection.jsx` - new
- `client/src/components/movies/MovieCard.jsx` - optional rank, `h3` title
- `client/src/pages/HomePage.jsx` - rebuilt from sections, no centering

Docs:

- `blueprint/project-plan.md` and `blueprint/context/project-overview.md` - API tables

## Data / contracts

No persisted data changes.

**New endpoints.** These extend `GET /api/movies/trending` and follow its pattern.
They are protected by the existing `router.use(requireAuth)` in `routes/movies.js`.

| Our endpoint | TMDB source |
| --- | --- |
| `GET /api/movies/popular` | `/movie/popular` |
| `GET /api/movies/top-rated` | `/movie/top_rated` |
| `GET /api/movies/upcoming` | `/movie/upcoming` |

- **Success:** `200 { movies: MovieSummary[] }`, where `MovieSummary` is the existing
  `{ tmdbId, title, posterPath, releaseYear, genreIds }` from `toMovieSummary`.
- **Length:** every valid movie on TMDB's first page, normally up to 20, in TMDB's
  order. No extra limit, query parameters or pagination.
- **Region:** none is sent, matching trending. Results use TMDB's defaults.
- **Empty:** `200 { movies: [] }` when no result passes validation.
- **TMDB failure:** a network error, timeout, non-2xx response or missing `results`
  array throws through `tmdbGet` or the helper and reaches the central handler as a
  500. Errors must keep leaving out the URL (it holds the API key) and any TMDB HTTP
  status, so a TMDB 401 never signs the user out.

**Row copy.** Each section derives its messages from one noun. The Top 10 copy stays
exactly as it is today.

| Row | Heading | Noun |
| --- | --- | --- |
| Top 10 | Top 10 trending | trending |
| Popular | Popular | popular |
| Top rated | Top rated | top rated |
| Upcoming | Upcoming | upcoming |

- **Loading:** `Loading <noun> movies...` with `role="status"`.
- **Error:** `We couldn't load <noun> movies.` plus a *Try again* button, in a
  `role="alert"` container.
- **Empty:** `No <noun> movies right now.`

**Heading order.** The page must not jump from `h1` to `h3` or nest card titles level
with their row headings:

- `h1` - visually hidden (`sr-only`) "Home".
- `h2` - each row heading. *Top 10 trending* keeps its current large styling and
  subheading; the other three use a smaller style.
- `h3` - card titles.

Each row's list is labelled by its heading through `aria-labelledby`, using a
`useId` value from `MovieSection`.

## Testing

- No test runner or browser harness is configured, so no automated tests ship with
  this feature. The evidence is `npm run lint` at the root, the client
  `npm run build`, and the manual pass below.
- Manual pass, which needs `server/.env` with a real `TMDB_API_KEY`, MongoDB and a
  signed-in user:
  - Four rows appear in order, and the Top 10 still shows its rank numbers.
  - Regular cards have no number and no gap to the left of the poster.
  - A movie with no poster shows the title placeholder in a regular card.
  - The page starts at the top, and the footer sits below the rows.
  - At 375px wide the page has no horizontal scroll.
  - Tabbing through a row brings each focused card fully into view, with the focus
    ring on the poster.
  - Blocking one endpoint in dev tools shows only that row's error state, and
    *Try again* recovers it.
  - `GET /api/movies/popular` without the cookie returns 401.
- The empty state cannot be triggered with live TMDB data. Confirm it by intercepting
  a response with `{ movies: [] }` in dev tools, or report it as not exercised.

## Notes for the AI

- Use the `api` axios instance only. Client paths are relative to `/api`.
- Keep the new routes as literal paths. Feature 7 adds `GET /movies/:tmdbId` to this
  router, and it must register after them so `popular` is never read as an id.
- `--offset` feeds a `calc()`, so the unranked value must be `0px`, not a bare `0`.
  Keep all Tailwind class names as complete static strings.
- `HomePage` keeps no per-row state. Each `MovieSection` owns its hook, which is what
  isolates failures and retries. Keep the row configuration as a small constant.
- Four requests fire on load, and an expired session returns up to four 401s. The
  `AuthContext` interceptor's `setSession(ANONYMOUS)` is idempotent and the redirect
  aborts the rest, so no change is needed there.
- A movie can appear in several rows. Keys are per row, so this is fine and needs no
  de-duplication.
- TMDB's `/movie/upcoming` uses a release window that can include recently released
  films. Show its list as returned; do not add date filtering in this feature.
- Titles render as React text and posters only use `posterPath` values validated by
  `toMovieSummary`, so no extra sanitizing is needed.
- `process.env` is read only at module start in `tmdb.js`. Keep it that way.
- Do not start from `prototypes/`; it was deleted when feature 4 completed. Follow
  Visual direction in the project plan.

## Verification evidence

- `npm run lint` at the root and `npm run build` in `client/` pass.
- `/check` ran against the running dev servers with real TMDB data, a real session
  and headless Chrome. Every done-when passed, including 375px layout, tab focus,
  per-row failure and retry, and the expired-session redirect. The loading, empty,
  API 500 and no-poster states used intercepted responses.
- One `GET /api/movies/upcoming` returned an empty body in the first browser run,
  with its status unrecorded. It did not recur in about 360 parallel requests.
  The cause is unknown.
- After *Try again*, keyboard focus falls to the document body. Feature 14 owns this.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":10771,"specSha256":"ca5b5479010d7f19bda912758f8fcf34f7869c2b44f17c32ae282bf2655b0c27","branch":"refs/heads/feature/home-page-rows","head":"e6aefe25a0c148f0561f7ef6af08a2a579ecf82c","baseRef":"refs/heads/main","baseCommit":"e6aefe25a0c148f0561f7ef6af08a2a579ecf82c","sourceTree":"63be012997f7cf2134a221e550a6d2545473c507","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

Run `npm run dev` from the project root, open http://localhost:5173 and sign in, or register at `/register` if you have no account.

Expected:

The page starts at the top with *Top 10 trending* and its outlined rank numbers. Below it, in order, are *Popular*, *Top rated* and *Upcoming*, each a sideways-scrolling row of posters with no rank numbers and no gap left of the poster.

This proves:

The three new rows load through the new endpoints for a signed-in user, regular cards render without ranks, and the home page is no longer vertically centered.
