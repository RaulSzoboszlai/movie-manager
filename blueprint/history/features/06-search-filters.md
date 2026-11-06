# Feature: Search filters

**From build-plan:** feature 6
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/search-filters`

## Goal

Let a signed-in user narrow the search page by genre and release year, with or
without a title. Filters live in the URL next to the query, so a filtered search
can be reloaded, linked to, and returned to from a movie page. With no title, the
page browses TMDB by the chosen filters.

## In scope

- An authenticated `GET /api/movies/genres` endpoint served from the existing
  cached genre map (`getGenreMap`).
- `genre` and `year` parameters on `GET /api/movies/search`, with the server-side
  split from the project plan: with a text query, call `/search/movie` and filter
  the results by genre; without one, call `/discover/movie` with genre and year.
- Labelled genre and year dropdowns on `/search`, built as custom menus with
  Headless UI's `Listbox` (user decision: the open list must match the page), with
  `genre` and `year` kept in the URL as well as `q`.
- Loading, failed and retry states for the genre list, and a filter-aware prompt,
  heading and empty message.
- Results for a page where filtering leaves few or no movies, including a first
  page with no matches while later pages remain.

## Out of scope

- The details page and similar movies (features 7-8). Cards keep linking to the
  existing `/movie/:tmdbId` placeholder.
- Other filters or sorting: rating, runtime, sort order, several genres at once.
- A "Clear filters" button. Each select has an "All" option, and the navbar's
  Search link resets the page.
- Showing genre names on cards. `genreIds` stay in the payload for feature 9.
- Refreshing the genre cache. It stays cached until the process restarts, as
  feature 4 left it.
- Server-side scanning across TMDB pages, and caching of TMDB responses.
- Skeletons, toasts and the keyboard accessibility pass (feature 14). This feature
  uses the same text states as search.

## Build loop

`workflow.stepReview` is `feature`: work through all build steps, then stop once
for review at the end, not after each step. `workflow.checkpointCommits` is
`disabled`: make no commits during the build. `/complete` creates the final
feature commit. Run `npm run lint` after each step.

## Build steps

- [x] **1. Genres endpoint.** Add a `genres` controller that reads `getGenreMap()`
  and returns the list sorted by name, and register `GET /genres` under the
  existing `requireAuth`.
  **Done when:** a signed-in request to `/api/movies/genres` returns the shape in
  Data / contracts, sorted by name; a second request makes no new TMDB call; a
  TMDB failure returns a 500 with `{ message }`, and a later request tries TMDB
  again; a request with no session returns 401; `npm run lint` passes.

- [x] **2. Search vs. discover on the server.** Add `parseGenre` and `parseYear`,
  and change `parseSearchQuery` so a blank `q` is allowed when a filter is present.
  Change `searchMovies` to take `{ query, genre, year, page }` and branch between
  `/search/movie` and `/discover/movie`, sharing one helper for results parsing
  and the `total_pages` check.
  **Done when:** each row of the behavior table in Data / contracts gives the
  described results, confirmed against live TMDB, including that
  `primary_release_year` is honored by both TMDB endpoints; every invalid input in
  the parameter table returns its 400; a request with `q=alien` and no filters
  still behaves as in feature 5; `npm run lint` passes.

- [x] **3. Results driven by filters in the URL.** `SearchPage` parses `genre` and
  `year` from the URL and passes them to `SearchResults`, with a key covering all
  three values. `useMovieSearch` sends them with every page. Add the filter-aware
  prompt, heading and empty messages, and the "no new matches" state. Writing the
  query from the input must keep the current filters.
  **Done when:** opening `/search?genre=28&year=1999` shows browse results and
  `/search?q=alien&genre=878` shows filtered results; `/search?genre=abc` shows the
  prompt and sends no request; typing in the input keeps `genre` and `year` in the
  URL; with a stubbed first page of no matches and later pages remaining, the page
  shows the "no new matches" message and Load more, not the empty message; with a
  stubbed final page of no matches and an empty list, the empty message appears
  and receives focus; `npm run lint` passes.

- [x] **4. Genre and year selects.** Install `@headlessui/react` in `client/`, add
  `useGenres` and `FilterSelect`, render both menus in the search form, and write
  changes straight to the URL.
  **Done when:** the open list matches the page's theme and scrolls within its own
  height; each menu opens, moves, selects and closes by keyboard (arrow keys, typing
  a letter, Enter, Escape) and returns focus to its button; choosing a genre or year
  updates the URL and results at once, with
  one search request per change; choosing a filter within the debounce window of
  typing sends one request holding both the new text and the filter; "All genres"
  and "Any year" remove the parameter; reload, back from a movie, and back and
  forward restore the selects and results; the navbar's Search link clears the
  input and both selects; a blocked genre request shows the error, "Try again"
  recovers, and the input and year select keep working meanwhile;
  `/search?genre=99999` and `/search?year=2099` show that value selected rather
  than a false "All"; the form fits a 320px viewport with no sideways page scroll;
  `npm run lint` at the root and `npm run build` in `client/` pass.

## Files / areas

Changed:

- `server/src/services/tmdb.js` - `searchMovies` takes an options object and holds
  the branch; shared page parsing
- `server/src/controllers/movieController.js` - `genres` handler, `parseGenre`,
  `parseYear`, updated `parseSearchQuery` and `search`
- `server/src/routes/movies.js` - `GET /genres`, under the existing `requireAuth`
- `client/src/pages/SearchPage.jsx` - URL parsing and writes, selects, prompt
- `client/src/hooks/useMovieSearch.js` - filter params, "no new matches" flag,
  focus when the list ends up empty
- `client/src/components/movies/SearchResults.jsx` - filter-aware text, "no new
  matches" state, focus on the empty message

New:

- `client/src/hooks/useGenres.js` - loads the genre list, following `useMovieList`
- `client/src/components/movies/FilterSelect.jsx` - labelled Headless UI `Listbox`;
  the button is styled like the input in `FormField`, the open list uses the theme
  tokens
- `@headlessui/react` in `client/package.json` and its lockfile

Not changed: `MovieCard`, `MovieGrid`, `useMovieList`, `getGenreMap`, and the
navbar and routes. The API table in `project-overview.md` already lists both
endpoints.

## Data / contracts

### `GET /api/movies/genres`

Requires a session through the router's `requireAuth`. Nothing is persisted.

```json
{ "genres": [{ "id": 28, "name": "Action" }, { "id": 12, "name": "Adventure" }] }
```

Sorted by name. A TMDB failure stays a plain `Error`, so the central handler
returns a 500 and a TMDB 401 never signs the user out. `getGenreMap` already clears
its cache on failure, so the next request retries.

### `GET /api/movies/search`

Requires a session. Nothing is persisted. The response shape from feature 5 does
not change.

| Param | Rule |
| --- | --- |
| `q` | Optional string, trimmed. Blank counts as absent. A repeated `q` arrives as an array and gets 400 `{ "message": "A search query or filter is required" }`. |
| `genre` | Optional. Absent or empty means no filter. Otherwise a string matching `^[1-9]\d{0,8}$`, or 400 `{ "message": "Genre must be a TMDB genre id" }`. Format only: it is not checked against the genre list, so an unknown id simply finds nothing. |
| `year` | Optional. Absent or empty means no filter. Otherwise a string matching `^(19\|20)\d{2}$`, or 400 `{ "message": "Year must be a four-digit year from 1900 to 2099" }`. |
| `page` | Unchanged: digits from 1 to 500, defaulting to 1, or the existing 400. |

With no `q`, `genre` or `year`: 400 `{ "message": "A search query or filter is required" }`.
Repeated `genre` or `year` values arrive as arrays and get their own 400.

| Request | TMDB call | Result |
| --- | --- | --- |
| `q` only | `/search/movie` with `query`, `page` | As in feature 5 |
| `q`, `year` | `/search/movie` with `query`, `primary_release_year`, `page` | Movies from that year |
| `q`, `genre` (and optional `year`) | As above, then keep movies whose `genreIds` include the genre | Possibly fewer than a full page, possibly none |
| `genre` and/or `year`, no `q` | `/discover/movie` with `with_genres`, `primary_release_year`, `page` | TMDB's default popularity order |

- `primary_release_year` is used on both endpoints so the filter agrees with the
  year shown on the card, which comes from `release_date`. Only pass parameters
  that have values: `tmdbGet` would otherwise send the text `null`.
- `page` and `totalPages` are TMDB's own values, with `totalPages` capped at
  `MAX_PAGE`. In the `q` + `genre` case they count unfiltered TMDB pages, so
  `movies` can be empty while `page < totalPages`.
- A missing `results` array or an invalid `total_pages` stays a plain `Error`, for
  both TMDB endpoints.
- Leave `include_adult` unset on both, so TMDB's default of `false` applies.

### URL

- `/search?q=<text>&genre=<id>&year=<yyyy>`, each present only when set.
- The client parses `genre` and `year` with the same patterns as the server. A
  value that doesn't match counts as absent, so a hand-edited URL never produces a
  400 error state. It disappears from the URL on the next write.
- Every write uses `replace: true`, as in feature 5, so typing and changing filters
  add no history entries. Back from a movie page returns to the same search.

### Client behavior

**Input and selects (`SearchPage`):**

- The selects are controlled directly by the parsed URL values, so reload, back,
  forward and the navbar link update them with no extra sync.
- Changing a select writes the URL immediately with the trimmed current input and
  also updates `latestQuery`, so text still inside the debounce window goes out
  with the filter in one request instead of two.
- The debounce and form submit keep the current `genre` and `year` when they write
  `q`. The input-sync rule from feature 5 is unchanged.
- A search runs when any of the three values is set. Otherwise show the muted
  prompt "Type a movie title or choose a filter to search." and send no request.
- `<SearchResults>` gets `key={JSON.stringify([query, genre, year])}`, so any change
  starts from clean state.

**Selects:**

| Select | Label | First option | Other options |
| --- | --- | --- | --- |
| Genre | "Genre" | "All genres" | From `GET /movies/genres` |
| Year | "Release year" | "Any year" | Next calendar year down to 1900, built on the client |

- If the URL holds a valid value that isn't in the list, add one option for it,
  labelled "Unknown genre" or the year itself, so the select never claims "All".
- Each menu is a Headless UI `Listbox` with a visible label tied to it through
  `Field` and `Label`, inside the existing `<form role="search">`. Keyboard and
  screen reader behavior comes from `Listbox`.
- The open list is anchored to its button and matches its width, has a maximum
  height with its own scrolling, and uses `modal={false}` so opening it doesn't lock
  page scroll. Long option labels truncate instead of widening the page.

**Genre list states (`useGenres`):**

| State | Behavior |
| --- | --- |
| Loading | The genre menu's button is disabled and reads "Loading genres...". |
| Error | `role="alert"`, "We couldn't load genres." and a "Try again" button, in the select's place. The input and year select keep working, and a `genre` already in the URL still applies to results. |
| Ready | The select as above. |

The hook follows `useMovieList`: `AbortController`, ignoring aborted results, and an
`attempt` counter for retry. It fetches when `SearchPage` mounts.

**Results text (`SearchResults`):**

| State | With `q` | No `q` (filters only) |
| --- | --- | --- |
| Loading, error | Unchanged from feature 5 | Unchanged |
| Heading | `Results for "<query>"` | `Filtered movies` |
| Empty, no filters | `No movies found for "<query>".` | Not reachable |
| Empty, with filters | `No movies found for "<query>" with these filters.` | `No movies match these filters.` |

The selects show which filters are active, so the heading doesn't repeat them.

**Pages with few or no matches:**

- The empty message appears only when `movies` is empty and `hasMore` is false.
- `useMovieSearch` returns `noNewMatches`, true when the latest successful page
  added no movies and `hasMore` is still true. This includes the first page.
- While it is true, the always-rendered `role="status"` element beside Load more
  shows "No new matches yet. Load more to keep looking." as visible text. Its
  "Loading more movies..." text stays visually hidden, as in feature 5.
- With no movies yet, render the heading, that message and Load more, and omit
  `MovieGrid`, so there is no empty list.
- If a last page leaves the list empty, Load more disappears, so move focus to the
  empty message, which gets `tabIndex={-1}`. `nextFocusCard` must not return
  index `-1` for a card lookup. Otherwise the focus rules from feature 5 stand.
- A failed Load more keeps the current state, shows the existing alert, and retries
  the same page.

**Requests and rendering:**

- Filter params go through the shared `api` instance. Omit empty ones.
- Requests abort on unmount, which covers filter changes because of the `key`. A
  session that expires gets a 401, and the `AuthContext` interceptor handles it.
- Genre names and the query render only as React text. Long values keep
  `wrap-anywhere`.
- The input and selects share one form. The selects wrap onto their own line at
  narrow widths, with no sideways page scroll at 320px.

## Testing

No test runner is configured, so there are no automated tests and tests are not a
gate. No combined Verify command exists. Checks are `npm run lint` at the root and
`npm run build` in `client/`, plus running each step's `Done when` by hand with a
real `TMDB_API_KEY`. Trigger failure states by blocking requests in browser
devtools. Sparse pages can't be forced reliably with live data, so stub
`/api/movies/search` responses in the browser for those checks.

## Notes for the AI

- Register `/genres` and `/search` above any future `/:tmdbId` route. Feature 7 adds
  that route and must keep it after the named paths.
- Keep branching in the service and input validation in the controller. Hand-written
  parsers stay, in the style of `parsePage`.
- Keep filtering one TMDB page per request. A `q` + `genre` search can look sparse,
  and the user pages through it with Load more. Don't add a server-side loop to
  fill a page.
- The `Try again` button in the genre error state unmounts on click and focus falls
  to the page, the same as the existing search and row retries. Feature 14's keyboard
  pass owns that pattern.
- The year list starts at 1900, so earlier films can't be filtered by year. The
  `2099` server ceiling is only a format bound and needs no yearly change.
- Feature 13 also uses `getGenreMap`. Don't change what it returns.
- Known limitation in Headless UI 2.2.10: closing a menu within about 350ms of typing
  a letter keeps that letter in its type-ahead buffer, so the first letter typed
  after reopening finds no match. The buffer clears after a brief pause and arrow
  keys are unaffected. No workaround was added.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":15650,"specSha256":"04c58106df64d36bc7ce42db46ce9258c5697705707a5682d86d80a0fdbb239d","branch":"refs/heads/feature/search-filters","head":"fd538b93bee2f8a69d0ba67e4418b3ed1c48bea0","baseRef":"refs/heads/main","baseCommit":"fd538b93bee2f8a69d0ba67e4418b3ed1c48bea0","sourceTree":"eb850b3847132a34f50c7cc657348e37184a48e8","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

With the dev servers running and signed in, open http://localhost:5173/search. Open the Genre menu and choose Action, then open the Release year menu and choose 1999.

Expected:

The URL becomes `/search?genre=28&year=1999`, the heading reads "Filtered movies", and a grid of movie cards from 1999 appears. Both open menus match the dark theme, and the menus keep showing Action and 1999 after a reload.

This proves:

Genre and year filters work without a title, stay in the URL, and the custom menus match the page.
