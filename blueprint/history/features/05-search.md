# Feature: Search

**From build-plan:** feature 5
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/search`

## Goal

Let a signed-in user find any movie on TMDB by title. Typing in the search page
runs a debounced search, results appear in a grid of movie cards, "Load more"
fetches further pages, and the query lives in the URL so a search can be reloaded,
linked to, and returned to from a movie page.

## In scope

- An authenticated `GET /api/movies/search?q=&page=` endpoint backed by TMDB's
  `/search/movie`.
- The `/search` page replaces its placeholder: labelled search input, debounced
  URL update, results grid, "Load more".
- The `q` URL parameter as the source of truth for the search, including browser
  back and forward and the navbar's Search link.
- Prompt (no query), loading, empty, error with retry, and failed "Load more"
  states.

## Out of scope

- `genre` and `year` parameters, `GET /movies/genres`, and the search-vs-discover
  split (feature 6). The server ignores those parameters for now.
- The details page content (feature 7). Cards keep linking to the existing
  `/movie/:tmdbId` placeholder.
- The watchlist button and watched state on cards (features 9-10).
- Loading skeletons, toasts and the keyboard accessibility pass (feature 14). This
  feature uses the same text loading state as the home rows.
- Server-side caching of TMDB responses, and autocomplete or search suggestions.
- Keeping the loaded page count or scroll position in the URL (see Notes).

## Build loop

`workflow.stepReview` is `feature`: work through all build steps, then stop once
for review at the end, not after each step. `workflow.checkpointCommits` is
`disabled`: make no commits during the build. `/complete` creates the final
feature commit. Run `npm run lint` after each step.

## Build steps

- [x] **1. Server search endpoint.** Give `tmdbGet` an optional query parameter
  object, set through `url.searchParams` so user text is always encoded and stays
  out of logged error messages. Share the results parsing with
  `fetchMovieSummaries`. Add `searchMovies(query, page)`, a `search` controller
  with validation, and the route.
  **Done when:** a signed-in request to `/api/movies/search?q=alien` returns the
  shape in Data / contracts; `page=2` returns a different page; a query containing
  `&` or `#` is searched literally; missing, blank or repeated `q` and an invalid
  `page` return 400 with `{ message }`; a request with no session returns 401;
  `npm run lint` passes.

- [x] **2. Results from the URL.** Add `useMovieSearch`, `MovieGrid` and
  `SearchResults`. `SearchPage` reads `q` from the URL and renders the prompt when
  it is empty, or `<SearchResults key={query} query={query} />` when it is not, so
  that a new query starts from clean state.
  **Done when:** opening `/search?q=alien` directly shows the results grid, from
  two columns on a 320px viewport upward, with no sideways page scroll;
  `/search` and `/search?q=%20` show the prompt and send no request; a query with
  no matches shows the empty message; a failed request shows the error and
  "Try again" recovers; `npm run lint` passes.

- [x] **3. Debounced input.** Add the labelled input in a search form. Typing
  updates the URL after the debounce, Enter updates it immediately, and URL changes
  from elsewhere update the input.
  **Done when:** typing "alien" sends one search rather than one per keystroke and
  the URL becomes `/search?q=alien`; typing a space after a word neither removes
  the space nor starts a new search; clearing the input removes `q` and shows the
  prompt; a slow earlier response never replaces newer results; reloading keeps the
  query and results; going to a movie and pressing back restores the query and
  results; clicking the navbar's Search link clears the input and results;
  `npm run lint` passes.

- [x] **4. Load more.** Add `loadMore` to `useMovieSearch` and the button with its
  loading, failure and last-page behavior.
  **Done when:** "Load more" appends the next page below the current results and
  moves focus to the first new card; it is gone after the last page, and for a
  single page of results; repeated clicks during a request send only one request;
  a failed request keeps the loaded results, shows the error, and clicking the
  button again retries the same page; `npm run lint` and `npm run build` in
  `client/` pass.

- [x] **5. Repair audit findings F-07 and F-08.** Stop the page's own URL write from
  resetting the input, and keep focus when a last page adds no new movies.
  **Done when:** real key events about 292-316ms apart never lose a character, and
  the URL settles on the full text; a key pressed right after the URL write is
  kept; pressing Enter straight after a late keystroke searches the full text; back,
  forward and the navbar's Search link still update the input; a last page of only
  duplicates moves focus to the last card; `npm run lint` and `npm run build` in
  `client/` pass.

## Files / areas

Changed:

- `server/src/services/tmdb.js` - `tmdbGet` params, shared results parsing,
  `searchMovies`
- `server/src/controllers/movieController.js` - `search` handler and validation,
  using `httpError` from `server/src/middleware/errorHandler.js`
- `server/src/routes/movies.js` - `GET /search`, under the existing `requireAuth`
- `client/src/pages/SearchPage.jsx` - heading, form, debounce and URL sync, prompt

New:

- `client/src/hooks/useMovieSearch.js` - page 1 fetch, retry, `loadMore`
- `client/src/components/movies/SearchResults.jsx` - results states and Load more
- `client/src/components/movies/MovieGrid.jsx` - grid of regular `MovieCard`s

Not changed: `MovieCard`, `MovieRow`, `useMovieList`, and the navbar and routes,
which already include `/search`. The API table in `project-overview.md` already
lists this endpoint.

## Data / contracts

### `GET /api/movies/search`

Requires a session through the router's `requireAuth`. Nothing is persisted.

| Param | Rule |
| --- | --- |
| `q` | Required string. Trimmed before use; must be non-empty afterward. Otherwise 400 `{ "message": "Search query is required" }`. A repeated `q` arrives as an array and gets the same 400. |
| `page` | Optional, defaults to 1. A string of digits with a value from 1 to 500, TMDB's maximum page. Otherwise 400 `{ "message": "Page must be a whole number from 1 to 500" }`. |

The 200 response:

```json
{
  "movies": [
    { "tmdbId": 348, "title": "Alien", "posterPath": "/abc.jpg", "releaseYear": 1979, "genreIds": [27, 878] }
  ],
  "page": 1,
  "totalPages": 12
}
```

- `movies` uses the existing `toMovieSummary` shape, with invalid results filtered
  by `isValidMovie` as in the other endpoints.
- `page` is the validated requested page.
- `totalPages` comes from TMDB's `total_pages`, capped at 500. It is 0 when nothing
  matches. A missing or non-integer `total_pages`, or a missing `results` array, is
  an unexpected TMDB response: throw a plain `Error`, which the central handler
  returns as a 500.
- TMDB failures keep the existing `tmdbGet` behavior: a plain `Error` with no HTTP
  status, so a TMDB 401 never signs the user out.

### URL

- `/search?q=<text>`, where `q` is the trimmed query. `/search` with no `q`, or a
  blank one, means no search.
- Every URL update from the input uses `replace: true`, so typing adds no history
  entries. Back from a results page leaves the search page, and back from a movie
  page returns to the same query.

### Client behavior

**Input and URL sync (`SearchPage`):**

- The input keeps its own text. The search itself uses only the URL's trimmed `q`.
- After 300ms without typing, if the trimmed input differs from `q`, update the URL.
  Submitting the form does this immediately. Clearing the input removes `q`.
- When `q` changes to anything other than the value this page last wrote or synced,
  set the input to `q`. The page's own write reaches `q` slightly late, so it must
  not trigger this, and it never overwrites text being typed, such as a trailing
  space or a key pressed just after the write.

**States (`SearchResults`):**

| State | Behavior |
| --- | --- |
| No query (in `SearchPage`) | Muted text: "Type a movie title to search." No request. |
| Loading | `role="status"`, "Searching for movies..." |
| Error | `role="alert"`, "We couldn't search for movies." and a "Try again" button styled like the one in `MovieSection`. |
| Empty | `role="status"`, `No movies found for "<query>".` |
| Results | `<h2>` `Results for "<query>"` labels the grid, then `MovieGrid`. |

**Load more:**

- Shown only while `page < totalPages`.
- During a request the button keeps focus, uses `aria-disabled` rather than
  `disabled`, and ignores further clicks. A visually hidden `role="status"` element
  says "Loading more movies...".
- On success, append the movies, dropping any `tmdbId` already shown, because TMDB
  can repeat a movie across pages and `tmdbId` is the React key. Then move focus to
  the link in the first newly added card. If every movie was a duplicate, advance
  the page and leave focus on the button, or move it to the last card's link when
  that was the last page and the button is gone.
- On failure, keep the movies and the current page, and show `role="alert"`
  "We couldn't load more movies." Clicking "Load more" clears the message and
  retries the same page.

**Requests:**

- Every request uses an `AbortController`, and results are ignored once it is
  aborted, as in `useMovieList`. Requests are aborted on unmount, which also covers
  a query change because of the `key`.
- A session that expires gets a 401, and the `AuthContext` interceptor already
  redirects to `/login`. No new handling is needed.

**Rendering and accessibility:**

- The query is shown only as React text, never as HTML. Headings and messages use
  `wrap-anywhere` so a long query can't widen the page.
- Heading order is `h1` Search, `h2` Results, then the `h3` in each card.
- The input has a visible `<label>` "Search movies" and `type="search"`, inside a
  `<form role="search">`.
- `MovieGrid` is a `ul` using
  `grid-cols-[repeat(auto-fill,var(--poster-width))]` with `justify-between`, since
  `MovieCard` is already sized by `--poster-width`.

## Testing

No test runner is configured, so there are no automated tests and tests are not a
gate. No combined Verify command exists. Checks are `npm run lint` at the root and
`npm run build` in `client/`, plus running each step's `Done when` by hand with a
real `TMDB_API_KEY`. Trigger failure states by blocking the request in browser
devtools. Slow-response ordering can be checked with network throttling.

## Notes for the AI

- Register `/search` above any future `/:tmdbId` route. Feature 7 adds that route
  and must keep it after the named paths.
- Leave `include_adult` unset. TMDB's default is `false`.
- No maximum query length: the input and API stay unlimited, and an over-long query
  that TMDB rejects lands in the normal error state.
- Only `q` is kept in the URL, not the loaded page count. Reloading or returning
  from a movie shows page 1 of the results. The project plan requires the query in
  the URL, and nothing requires restoring deeper pages.
- Feature 6 will add `genre` and `year` to the endpoint and allow an empty `q` when
  filters are present. The response shape must stay the same. Don't build for that
  now.
- Keep `useMovieList` as it is. Search needs paging state the rows don't, so it gets
  its own hook.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":11487,"specSha256":"9f5de5d32a8c4dc0b2114f7b7bb5a7c2b5e95c78962f1609e4d4313538341e38","branch":"refs/heads/feature/search","head":"314db69876ebc59ef8f859091b6c36fd2cb6a673","baseRef":"refs/heads/main","baseCommit":"314db69876ebc59ef8f859091b6c36fd2cb6a673","sourceTree":"68107bc5cdc3b3418427b157f0f40e46782c166e","landing":"local-merge","absentOptional":[]} -->

## Findings

### 5/F-07 [P1] closed - A keystroke landing just after the debounce fires is deleted

**File:** client/src/pages/SearchPage.jsx:18
**Found:** 2026-11-05 by /audit (scope: current; lens: quality)
**Why it matters:** The spec says the URL sync "never overwrites text being typed", and that contract breaks. The page's own URL write reaches `query` slightly later, so a key pressed in that gap makes `input.trim() !== query` true and line 18 resets the input to the older query. Real key events in headless Chrome, with stubbed search responses against the dev server, typed `a` then `b` about 292-316ms apart: the `b` vanished in 17 of 39 attempts at normal CPU speed and 6 of 39 at 6x throttling, leaving the input at `a` and the URL at `?q=a`. Forcing an input event as a separate task right after the URL write reproduced it in both variants tried. Someone typing with pauses near 300ms can hit this. /check did not catch it because its typing used 60ms gaps. The cause of the delay was not traced; a router transition is the likely source. The production build was not measured.
**Suggested fix:** Remember the value the page last wrote to the URL and skip the sync when `query` equals it, clearing that value whenever an outside URL change is synced so back and forward still update the input. Re-run the timing sweep plus the Step 3 back, forward and navbar checks. No current requirement would be lost.
**Resolution:** Repaired by /implement, awaiting /audit. `SearchPage` now keeps the last value it wrote or synced in a ref and only updates the input when `query` differs from it. The same sweep, still stubbed and on the dev build, lost 0 of 39 keystrokes at normal CPU speed and 0 of 39 at 6x throttling, with the URL settling on `?q=ab` each time. The forced input event kept `ab` in both variants, Enter straight after a late keystroke was right in 7 of 7 attempts, and back, forward and navbar checks passed. Closed by /audit on 2026-11-05 (scope: current; all lenses): client/src/pages/SearchPage.jsx:26-32 no longer compares the late query to the input, and a fresh run gave the same sweep results, 34 of 34 browser checks, and 5 of 5 correct results when a second URL write and more typing were forced right after the first write. That run did not confirm the first write was still pending, so the double-write case is not proven impossible; the code would reset the input only if an older write committed after a newer one was made. Dev build only, and the review was in the builder's session.

### 5/F-08 [P3] closed - Focus is lost when the last page holds only duplicates

**File:** client/src/hooks/useMovieSearch.js:75
**Found:** 2026-11-05 by /audit (scope: current; lens: quality)
**Why it matters:** `firstNewIndex` stays unchanged when no new movie arrives, and the Load more button unmounts on the last page, so focus falls to the document body. Reproduced in headless Chrome with a stubbed final page of repeats. A keyboard user would have to Tab back from the top of the page. It needs TMDB to return a final page of nothing but repeats, which should be rare. Duplicate filtering and the non-final all-duplicate case both behaved correctly in the same run.
**Suggested fix:** When the last page adds nothing, move focus to the last card's link. No current requirement would be lost.
**Resolution:** Repaired by /implement, awaiting /audit. `useMovieSearch` now returns a `focusCard` object, which points at the last card when a final page adds nothing. With the same stubbed final page, focus landed on the last card's link, and a non-final all-duplicate page still left focus on the button. Closed by /audit on 2026-11-05 (scope: current; all lenses): `nextFocusCard` at client/src/hooks/useMovieSearch.js:24 and the effect at client/src/components/movies/SearchResults.jsx:15 were re-read, and a fresh stubbed run repeated both results.

## Try it now

Run or do:

With the dev servers running and signed in, open http://localhost:5173/search and type a word slowly, pausing about a third of a second between letters. Then click the navbar's Search link and press back and forward.

Expected:

Every letter stays in the input, and the URL ends up as `?q=` plus the full word, with a `Results for "<word>"` heading above a grid of movie cards. Clicking Search clears the input, back restores the word, and forward clears it again.

This proves:

Typing with pauses near the debounce keeps every character, search results come from the URL, and URL changes from elsewhere still update the input. It does not cover Load more or the empty and error states.
