# Feature: Similar movies

**From build-plan:** feature 8
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/similar-movies`

## Goal

A signed-in user on a movie's details page sees a "You might also like" row of regular
movie cards below the trailer, and can open any of them to go to that movie's details.
The row is served by a new protected endpoint, `GET /api/movies/:tmdbId/similar`.

## In scope

- `GET /api/movies/:tmdbId/similar`, behind the router's existing `requireAuth`,
  returning the first page of TMDB's `/movie/{id}/similar` as movie summaries.
- A "You might also like" row at the bottom of the details page, with loading, empty
  and error states. An error in the row offers "Try again" and leaves the rest of the
  page usable.
- Moving between movies through the row: the page shows the new movie, scrolls to the
  top, and loads that movie's own similar row.

## Out of scope

- Pagination or "Load more" in the row. The row shows TMDB's first page as returned,
  with no extra limit, like the Popular row.
- TMDB's `/recommendations` endpoint and personal recommendations (Later list).
- Watchlist buttons on the cards (feature 9) and "Add to list" (feature 12).
- Loading skeletons and toasts (feature 14). The row uses the same text states as the
  home page rows.
- Server-side caching of TMDB responses (Later list).
- Tests and a test runner. None is configured.

## Build loop

`workflow.stepReview` is `feature`: work through all build steps, then stop once for
review at the end, not after each step. `workflow.checkpointCommits` is `disabled`:
make no commits during the build. `/complete` creates the final feature commit. Run
`npm run lint` after each step.

## Build steps

- [x] **1. Similar movies endpoint.** Add `getSimilarMovies(tmdbId)` to
  `server/src/services/tmdb.js`, built on `fetchMovieSummaries`, resolving to `null`
  when TMDB answers 404. Move the id check in `details` into a `parseTmdbId` helper in
  the controller, used by `details` and a new `similar` handler. Register
  `router.get('/:tmdbId/similar', similar)`.
  **Done when:** signed in, `GET /api/movies/27205/similar` returns 200 with
  `{ movies: [...] }` in the summary shape; every other row of the status table below
  behaves as listed, including `GET /api/movies/27205` still returning details and
  `GET /api/movies/trending` still resolving to its static route; `npm run lint` passes.
  Confirm against live TMDB that an unknown id really answers 404. If it answers
  differently, report that instead of assuming the table holds.

- [x] **2. "You might also like" row.** In the ready branch of
  `client/src/components/movies/MovieDetails.jsx`, render `MovieSection` last, after the
  trailer, with `path={`/movies/${movie.tmdbId}/similar`}`,
  `heading="You might also like"` and `noun="similar"`. No new hook or component.
  **Done when:** in the browser, a movie with similar titles shows the row below the
  trailer (or below the cast when there is no trailer), with a heading at `h2` level
  matching "Cast"; while loading it shows "Loading similar movies..."; a stubbed empty
  result shows "No similar movies right now."; a forced failure shows "We couldn't load
  similar movies." with "Try again", the hero, cast and trailer stay in place, and retry
  recovers the row without reloading the details; the "Movie not found" and details
  error states make no request to `/similar`; `npm run lint` and `npm run build` in
  `client/` pass.

- [x] **3. Navigate through the row.** No code is expected here beyond step 2: the
  `key={tmdbId}` in `MovieDetailsPage` already remounts the details on a new id. Verify
  it, and fix only what fails.
  **Done when:** activating a card, by mouse and by keyboard, changes the URL to
  `/movie/<id>`, scrolls to the top, shows that movie's details and a row of that
  movie's similar titles with no stale content from the previous movie; browser Back
  returns to the previous movie; tabbing through the cards brings each focused card into
  view; at 375px the row scrolls sideways and the page itself does not.

## Files / areas

- `server/src/services/tmdb.js`: add `getSimilarMovies`.
- `server/src/controllers/movieController.js`: add `parseTmdbId` and `similar`; `details`
  uses the helper.
- `server/src/routes/movies.js`: register the route.
- `client/src/components/movies/MovieDetails.jsx`: render `MovieSection`.

Reused unchanged: `MovieSection`, `MovieRow`, `MovieCard`, `useMovieList`, `client/src/lib/api.js`,
the central error handler and `requireAuth`.

## Data / contracts

No persisted data. No new environment variables or dependencies.

**`GET /api/movies/:tmdbId/similar`**

Success body, the same summary shape as the other movie lists:

```json
{
  "movies": [
    {
      "tmdbId": 123,
      "title": "Some movie",
      "posterPath": "/abc.jpg",
      "releaseYear": 2010,
      "genreIds": [28, 878]
    }
  ]
}
```

`posterPath` and `releaseYear` can be `null`, and `genreIds` can be empty. Results
without a valid id or title are dropped by the existing `isValidMovie` filter. Query
parameters are ignored.

| Case | Status | Body |
| --- | --- | --- |
| Signed in, known movie | 200 | `{ movies: [...] }` |
| Signed in, known movie with no similar titles | 200 | `{ movies: [] }` |
| Not signed in | 401 | `{ message }` from `requireAuth` |
| Id fails `/^[1-9]\d{0,8}$/` | 400 | `{ message: 'Movie id must be a TMDB movie id' }` |
| TMDB answers 404 | 404 | `{ message: 'Movie not found' }` |
| TMDB fails otherwise, times out, or returns no `results` array | 500 | `{ message }` from the central handler |

A TMDB 401 must stay a 500. It must not reach the client as a 401, which would sign the
user out. `tmdbGet` already guarantees this by setting `tmdbStatus` and never `status`.

**Client states**, all from `MovieSection` with `noun="similar"`:

| State | Shows |
| --- | --- |
| Loading | `role="status"`: "Loading similar movies..." |
| Empty | "No similar movies right now." |
| Error, including a 404 from this endpoint | `role="alert"`: "We couldn't load similar movies." and "Try again" |
| Ready | `MovieRow` of regular, unranked cards, labelled by the heading |

Titles render as React text, so TMDB strings are escaped. The row's failure never
replaces the details page, because `useMovieList` holds its own state.

## Testing

No test command exists, so tests are not a gate and this feature adds none. Evidence
comes from:

- `npm run lint` at the root and `npm run build` in `client/`.
- API checks against the running server for each row of the status table, signed in and
  signed out. These need a working `TMDB_API_KEY` in `server/.env`. Cases TMDB can't be
  made to produce on demand (failure, empty results) can be forced by a temporary stub,
  removed before finishing.
- Browser checks of each step's done-when, including 375px width and keyboard use of the
  row.

Report any check that could not be run rather than inferring it from the code.

**Evidence from `/implement`:**

- Observed: `npm run lint` at the root and `npm run build` in `client/` pass. A throwaway
  script ran the real router, `requireAuth` and error handler on an ephemeral port, with
  a token signed in memory, and every row of the status table passed. Live TMDB gave 200
  for 27205 and 404 for unknown id 999999999, and `/27205` and `/trending` still resolve.
  Malformed ids and a missing cookie made no TMDB call. Stubbed TMDB gave the empty,
  invalid-entry, 404, 401, 500, missing `results` and network-failure cases. No response
  contained the API key. The live row for 27205 had 20 titles, without the movie itself
  or duplicate ids.
- Not observed at this stage: a real login session; everything in steps 2 and 3, which
  `/check` covered below.

**Evidence from `/check`:**

- Observed: every done-when of steps 2 and 3, in headless Chrome over the DevTools
  protocol, against the Vite dev build and an isolated API on a throwaway local database,
  dropped afterwards. The session came from registering through the form, and the test
  user was confirmed absent from the real database. Similar titles came from live TMDB.
  Loading, empty, error and no-trailer states were forced by intercepting responses in
  the browser, so no source was stubbed. Covered: placement with and without a trailer;
  the `h2` rendering the same as "Cast"; cards matching the API response in order; all
  row states; retry recovering the row without refetching the details; no `/similar`
  request for an unknown movie, a malformed id, a details error or a signed-out visit;
  mouse and keyboard navigation with no stale content; scroll from 1619px to the top;
  browser Back; Tab through all 20 cards, each fully in view with a focus ring; and
  sideways scrolling at 375px with no page overflow. There were no React warnings,
  console errors or exceptions. The only network errors logged were the signed-out 401,
  the unknown-movie 404 and the forced 500s. Screenshots were viewed for the ready, error,
  keyboard-focus and 375px states.
- Not observed: screen reader announcements; browsers other than Chrome; a real touch
  swipe, since the sideways scroll was set from script; the production build rendering
  in a browser, though it builds; the scroll position after Back (F-11). The headless
  window's 15px scrollbar left 360px of content width in the 375px check. After a failed
  retry, focus falls to the document body, recorded under F-09.

## Notes for the AI

- Register the route with the others in `server/src/routes/movies.js`. `/:tmdbId/similar`
  has two segments, so it can't collide with `/:tmdbId` or the static routes.
- Follow the 404 handling in `getMovieDetails`: catch only `err.tmdbStatus === 404` and
  rethrow everything else. Don't log or expose the TMDB URL, which holds the key.
- Render the row only in the ready branch, so a missing or failed movie never requests
  `/similar`. Keep the empty state visible rather than hiding the section: the project
  requires every data view to have one.
- Don't add self-exclusion, de-duplication or a result limit. None is a stated
  requirement, and the other rows do without them. If live data shows the current movie
  or a duplicate id in the row, report it at review.
- `MovieSection` puts the heading at `h2` and `MovieCard` titles at `h3`, which fits the
  details page's existing `h1` and "Cast" `h2`. `--poster-width` is global in
  `client/src/index.css`, so the cards size correctly here.
- Keep the row's text states as they are. Feature 14 replaces them with skeletons.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":10567,"specSha256":"783590020aa29ec7e69dcc741500b0a352cbc3d501dc2c82522b16b3d5cda912","branch":"refs/heads/feature/similar-movies","head":"f6414e4370d640e9a587554dd2da44a064d31144","baseRef":"refs/heads/main","baseCommit":"f6414e4370d640e9a587554dd2da44a064d31144","sourceTree":"65ba18bffc4c19c12bcaa98dde29b6ab0ff888c8","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

With the dev servers running and signed in, open http://localhost:5173/movie/27205, scroll to the bottom, then click the first card in the "You might also like" row.

Expected:

Below Inception's Trailer section is a "You might also like" heading with a sideways-scrolling row of movie cards (20 when this was checked; TMDB's list can change). Clicking a card changes the URL to that movie's `/movie/<id>`, returns to the top of the page, and shows that movie's details with its own, different row.

This proves:

The details page shows similar titles from live TMDB through `GET /api/movies/:tmdbId/similar`, and the row's cards lead to other movies' details.
