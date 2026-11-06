# Feature: Movie details page

**From build-plan:** feature 7
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/movie-details-page`

## Goal

Replace the `/movie/:tmdbId` placeholder with a real details page. A signed-in user
who opens a movie sees its backdrop, poster, title, overview, runtime, release date,
genres and top-billed cast, plus an embedded YouTube trailer when TMDB has one. An
id that does not match a movie gets a clear not-found state, not a generic error.

## In scope

- An authenticated `GET /api/movies/:tmdbId` endpoint that calls TMDB's
  `/movie/{id}` with `append_to_response=credits,videos` and returns a validated,
  camelCase payload.
- Telling "TMDB has no such movie" (404 to the client) apart from "TMDB failed"
  (500 to the client).
- The details page at the existing protected route, with loading, not-found and
  error-with-retry states, and empty handling for every optional field.
- A horizontally scrolling cast row and a responsive YouTube iframe.
- Opening the page at the top of the window, since the app has no scroll handling
  and a card can be clicked from far down the search results.

## Out of scope

- The "You might also like" row and `GET /movies/:tmdbId/similar` (feature 8).
- Watchlist buttons and saved state (feature 9), rating (feature 10), "Add to list"
  (feature 12). Those features add their own controls and read `genres[].id`.
- Person pages and links from the cast row (Later). Cast cards are not links.
- Teasers, clips or a list of several videos. Only one trailer is shown.
- A click-to-load trailer facade, autoplay, or localized TMDB text.
- Caching details responses on the server (Later).
- Skeletons, toasts and the keyboard accessibility pass (feature 14). This feature
  uses the same text states as the existing movie sections.
- Per-page document titles. The app has none today.
- Restoring scroll position on Back. Existing pages have no such handling either.

## Build loop

`workflow.stepReview` is `feature`: work through all build steps, then stop once
for review at the end, not after each step. `workflow.checkpointCommits` is
`disabled`: make no commits during the build. `/complete` creates the final
feature commit. Run `npm run lint` after each step.

## Build steps

- [x] **1. Details service.** In `services/tmdb.js`, add `tmdbStatus` to the HTTP
  failure error in `tmdbGet`, and add `getMovieDetails(tmdbId)`, which parses the
  response into the shape in Data / contracts and resolves to `null` on a TMDB 404.
  **Done when:** calling it through step 2 returns that shape for a real movie;
  other TMDB failures still reject; `err.status` is still never set, so a TMDB 401
  cannot reach the client as a 401; `npm run lint` passes.

- [x] **2. Details endpoint.** Add a `details` controller and register
  `GET /:tmdbId` after every static route in `routes/movies.js`.
  **Done when:** with a session, a real id returns 200 with `{ movie }`, `abc` and
  `0` return 400, and an unused id such as `999999999` returns 404, each error as
  `{ message }`; `/api/movies/trending`, `/search`, `/genres` and the other static
  routes behave as before; with no session the endpoint returns 401; a forced TMDB
  failure (for example a bad `TMDB_API_KEY`) returns 500 with no key in the response;
  `npm run lint` passes.

- [x] **3. Page data and states.** Add `useMovieDetails`, then the page shell with
  the loading, not-found and error states, keyed by id, and scroll to the top on
  open. Render the title once data is ready.
  **Done when:** a real id shows its title after the loading text; `/movie/abc` and
  `/movie/trending` show "Movie not found" without any API request; `/movie/999999999`
  shows "Movie not found" after a 404; with the server stopped the page shows the
  error and "Try again" recovers once it is back; clicking a card from a scrolled
  search page opens the details page at the top; `npm run lint` passes.

- [x] **4. Hero and overview.** Add `MovieHero` with the backdrop, poster, title,
  fact line and overview, plus the formatters.
  **Done when:** a movie with full data shows every field; a movie with no backdrop
  or poster, no overview, or no runtime or date still lays out cleanly with the
  behavior in Data / contracts; at 375px wide the page does not scroll sideways, even
  with a long title; `npm run lint` passes.

- [x] **5. Cast row and trailer.** Add `CastRow` and `TrailerEmbed` to the page.
  **Done when:** the cast row scrolls sideways on its own, including from the
  keyboard after tabbing to it; a movie with no cast shows the empty message; a
  movie with a trailer plays it in the embed at 16:9; a movie with no trailer has no
  Trailer section; `npm run lint` and `npm run build` in `client/` pass.

## Files / areas

Server:

- `server/src/services/tmdb.js`: `tmdbStatus` on the error, parsers, `getMovieDetails`.
- `server/src/controllers/movieController.js`: `details`, id parsing.
- `server/src/routes/movies.js`: `GET /:tmdbId`, last in the file.

Client:

- `client/src/hooks/useMovieDetails.js`: new, follows `useMovieList`.
- `client/src/lib/movieFormat.js`: new, `formatRuntime` and `formatReleaseDate`.
- `client/src/pages/MovieDetailsPage.jsx`: reads the param, scrolls to top, renders
  `<MovieDetails key={tmdbId} tmdbId={tmdbId} />`.
- `client/src/components/movies/MovieDetails.jsx`: new, the state switch and layout.
- `client/src/components/movies/MovieHero.jsx`: new.
- `client/src/components/movies/CastRow.jsx`: new.
- `client/src/components/movies/TrailerEmbed.jsx`: new.

No route, Layout or dependency changes. `App.jsx` already declares the protected
route, and no CSP or `helmet` exists that would block the iframe or images.

## Data / contracts

**Request:** `GET /api/movies/:tmdbId`, behind the router's existing `requireAuth`.
`tmdbId` must match `/^[1-9]\d{0,8}$/`, the same bound the genre filter uses.

| Case | Status | Body |
| --- | --- | --- |
| Found | 200 | `{ movie }` |
| Malformed id | 400 | `{ message: 'Movie id must be a TMDB movie id' }` |
| TMDB returns 404 | 404 | `{ message: 'Movie not found' }` |
| No session | 401 | Existing `requireAuth` response |
| TMDB failure or invalid payload | 500 | `{ message: 'Internal server error' }` |

**Response:**

```js
{
  movie: {
    tmdbId: 27205,
    title: 'Inception',
    overview: '...',                 // '' when missing
    posterPath: '/abc.jpg',          // null unless a string starting with '/'
    backdropPath: '/def.jpg',        // same rule
    releaseDate: '2010-07-15',       // null unless YYYY-MM-DD and parseable
    runtime: 148,                    // minutes; null unless a positive integer
    genres: [{ id: 28, name: 'Action' }],
    cast: [{ id: 6193, name: 'Leonardo DiCaprio', character: 'Cobb', profilePath: '/x.jpg' }],
    trailerKey: 'YoHD9XEInc0',       // null when there is no trailer
  },
}
```

**Parsing (TMDB responses are untrusted):**

- A payload failing the existing `isValidMovie` check throws, giving a 500.
- `genres` keeps entries passing the existing `isValidGenre`; a missing array is `[]`.
- `cast` comes from `credits.cast` in TMDB's order, which is billing order. Keep
  entries with a positive integer `id` and non-empty string `name`, keep only the
  first entry per person id (one actor can have two credits, and the id is the React
  key), then take the first 12 (`CAST_LIMIT`). `character` is `''` when not a string;
  `profilePath` follows the `posterPath` rule. Missing `credits` is `[]`, not a failure.
- `trailerKey` comes from `videos.results`, considering only entries with
  `site === 'YouTube'`, `type === 'Trailer'` and a `key` matching
  `/^[\w-]+$/`, because the key goes into an iframe URL. Take the first with
  `official === true`, otherwise the first. Missing `videos` gives `null`. A teaser
  alone counts as no trailer.

**Telling a missing movie from a failure:** `tmdbGet` keeps its existing rule of not
setting `status`, which the central handler would forward. It adds a separate
`tmdbStatus` property to the HTTP failure error. `getMovieDetails` catches only
`tmdbStatus === 404` and resolves to `null`, and the controller turns `null` into
`httpError(404, 'Movie not found')`. Update the comment above `tmdbGet` to match.

**`useMovieDetails(tmdbId)`** returns `{ status, movie, retry }`, with `status` one
of `loading`, `ready`, `notFound`, `error`.

- The client tests the param against the same pattern before any request. An
  invalid param starts as `notFound` and sends nothing. This is required, not an
  optimization: `/movie/trending` would otherwise request `/api/movies/trending`,
  which is a different route and returns 200 with `{ movies }` and no `movie`.
- A 404 response gives `notFound`. Any other failure gives `error`. A 401 needs no
  handling here because the `AuthContext` interceptor signs the user out and
  `ProtectedRoute` redirects.
- Abort on unmount and on retry, with the `controller.signal.aborted` checks used in
  `useMovieList`.
- `MovieDetails` is keyed by `tmdbId`, so moving between movies (feature 8's row,
  browser Back) remounts it and never shows the previous movie's data.

**Page states:**

| State | Behavior |
| --- | --- |
| Loading | `role="status"` text: "Loading movie..." |
| Not found | `h1` "Movie not found", then muted text and a link home, matching `NotFoundPage` |
| Error | `role="alert"`, "We couldn't load this movie." in `text-error`, a "Try again" button styled like `MovieSection`'s |

**Field rendering:**

| Field | Present | Missing |
| --- | --- | --- |
| Backdrop | `w1280` image in the page column, rounded, `alt=""`, fading into the page color at the bottom | No banner; the hero starts at the poster and title |
| Poster | `w500` image, 2:3, 128px wide on phones and 192px from `min-[860px]` (user decision after design review), `alt=""` because the title sits beside it | Raised surface with the title, as in `MovieCard`, `aria-hidden` |
| Title | `h1`, `wrap-anywhere` | Never missing; the server rejects it |
| Runtime, release date | Fact line, for example `148 min` shown as `2h 28m`, and a medium date | That item is left out; no fact line if both are missing |
| Genres | Text or pills beside the facts | Left out |
| Overview | Paragraph | "No overview available." in `text-muted` |
| Cast | `h2` "Cast" and the row | `h2` "Cast" and "No cast information available." |
| Cast photo | `w185` image, `alt=""` because the name sits below it, `loading="lazy"` | Raised surface, no text |
| Cast character | Muted line under the name | Line left out |
| Trailer | `h2` "Trailer" and the embed | Whole section left out, since the plan says "when TMDB has one" |

**Formatting (`lib/movieFormat.js`):** `formatRuntime(148)` is `2h 28m`, `45` is
`45m`, `120` is `2h`. `formatReleaseDate` uses
`toLocaleDateString(undefined, { dateStyle: 'medium', timeZone: 'UTC' })` on
`new Date(releaseDate)`: a date-only string parses as UTC, so without the time zone
users west of UTC would see the previous day.

**Trailer iframe:** `https://www.youtube-nocookie.com/embed/${trailerKey}`, with
`title={`${title} trailer`}`, `loading="lazy"`, `allowFullScreen`,
`referrerPolicy="strict-origin-when-cross-origin"` (YouTube refuses to play embeds
that send no referrer) and
`allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"`.
Use `aspect-video w-full` in a rounded, bordered wrapper that fills the page column,
so it lines up with the backdrop (user decision after design review).
No autoplay and no `sandbox`, which the player does not work under.

**Cast row accessibility:** a `ul` with `aria-labelledby` pointing at the heading,
horizontal `overflow-x-auto` with the same classes as `MovieRow`, and `tabIndex={0}`
with a visible `focus-visible` ring. Its cards hold nothing focusable, so without the
tab stop keyboard users could not scroll it in every browser. Do not reuse `MovieRow`
or `MovieCard`: those are movie links, and these are not.

**Rendering safety:** all TMDB text renders as React text. No
`dangerouslySetInnerHTML`. Long titles and names use `wrap-anywhere`, and the page
must not scroll sideways at phone width.

**Styling:** existing `@theme` tokens only; dark, mobile-first. Poster and text stack
on small screens and sit side by side from the existing `min-[860px]` breakpoint.
Text sits on the page color rather than over the image, so it stays readable on any
backdrop.

## Testing

No test command exists, so tests are not a gate and this feature adds none. Evidence
comes from:

- `npm run lint` at the root and `npm run build` in `client/`.
- API checks against the running server for each row of the status table, signed in
  and signed out. These need a working `TMDB_API_KEY` in `server/.env`.
- Browser checks of each step's done-when, including 375px width and tabbing to the
  cast row. Movies with missing fields can be found through TMDB or forced by
  temporarily stubbing the response; remove any stub before finishing.

Report any check that could not be run rather than inferring it from the code.

**Evidence from `/implement`:**

- Observed: `npm run lint` and `npm run build` in `client/` pass. Throwaway scripts
  ran the controller against stubbed TMDB responses (malformed ids, TMDB 401, 404 and
  500, network failure, invalid payload, missing and malformed fields, cast and trailer
  selection). The real router and error handler, on an ephemeral port with a token
  signed in memory, gave every status in the table except a real login session, and
  the static routes still resolve. Live TMDB returned `credits` and `videos` for
  27205, so the `%2C` encoding works.

**Evidence from `/check`:**

- Observed: every done-when, in headless Chrome over the DevTools protocol, against a
  production build with an isolated API and a throwaway database. 32 checks passed,
  covering a real login session, the status table, page states, 375px layout, keyboard
  scrolling of the cast row, scroll to top, and error then retry. Screenshots show the
  trailer playing. Lint passes.
- Design review: after the first `/check`, the user asked for a smaller poster and a
  larger player. Resizing exposed the poster stretching to the height of the text
  column, which `self-start` fixed. The checks were rerun after both changes.
- Not observed: React dev-only warnings, because the build was production; browsers
  other than Chrome; screen reader announcements; focus after "Try again", which
  probably matches F-05 and F-09. The phone screenshot was viewed before the
  `self-start` fix, though the 375px overflow checks ran after it.

## Notes for the AI

- Choices made here with no product contract behind them, all easy to change: a cast
  limit of 12, the `youtube-nocookie` host, and preferring official trailers.
- Keep `GET /:tmdbId` after the static routes. Feature 8 adds `/:tmdbId/similar`,
  which does not conflict.
- Keep `genres` as `{ id, name }` objects: feature 9 reads `genres[].id` on this page.
- Keep image base URLs as local constants per component, as `MovieCard` does. Each
  component uses a different size, so a shared helper is not needed yet.
- `URLSearchParams` encodes the comma in `credits,videos` as `%2C`. Confirm on the
  first live call that `credits` and `videos` both come back.
- Follow the coding standards: no em dashes, comments only for the why, functions
  under 50 lines.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":15388,"specSha256":"cb7cd3c59bc219d8590dbdc061fa606c4ba52c0800cd97bc8ec75f421aab25d6","branch":"refs/heads/feature/movie-details-page","head":"2a1eaccc8d4a5a0da1a4c6bd064be7b1d52d055a","baseRef":"refs/heads/main","baseCommit":"2a1eaccc8d4a5a0da1a4c6bd064be7b1d52d055a","sourceTree":"e447635aa8837c1a7ad8ff809a13c86cbcbf84e8","landing":"local-merge","absentOptional":[]} -->

## Try it now

Run or do:

With the dev servers running and signed in, open http://localhost:5173/movie/27205, then open http://localhost:5173/movie/trending.

Expected:

Inception shows its backdrop, a 192px poster overlapping the backdrop, a line like `Jul 15, 2010 · 2h 28m`, genre pills and the overview. Below that is a Cast row of 12 starting with Leonardo DiCaprio, then a Trailer section whose YouTube player fills the page column and plays when clicked. The second URL shows "Movie not found".

This proves:

The details page renders live TMDB data, and a non-numeric id does not reach the static API routes.
