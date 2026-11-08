# Feature: Profile stats

**From build-plan:** feature 13
**Build attempt:** 1
**Branch:** feature/profile-stats
**Status:** verified

## Goal

A signed-in user opens `/profile` and sees statistics about their own library:
watched count, watchlist size, average rating, rating distribution, top 3
genres and list count. The numbers come from one `GET /api/profile/stats` call
backed by a MongoDB aggregation, with top genres counted by `genreIds` and named
through the cached TMDB genre list.

## In scope

- `GET /api/profile/stats` behind `requireAuth`, scoped to the authenticated
  user id from the verified token.
- One `SavedMovie.aggregate()` pipeline (`$match` on the user, then `$facet`)
  that produces status counts, average rating, rating distribution and genre
  counts; `List.countDocuments({ user })` for the list count.
- Genre ids resolved to names with the existing `getGenreMap()` from
  `services/tmdb.js`.
- `ProfilePage` replaces its placeholder with stat cards, a rating distribution
  and a top genres section, each with loading, error (with retry) and empty
  states.

## Out of scope

- Any schema change to `SavedMovie`, `List` or `User`; no new indexes (the
  existing `{ user, tmdbId }` index already serves the `$match`).
- Editing the profile (username, email, password), avatars, or account deletion.
- Charts libraries; the distribution is plain Tailwind bars.
- Caching stats on the server or client; the page fetches fresh on every visit.
- Loading skeletons, toasts and the wider keyboard pass (feature 14). Use the
  same plain text loading and error states the other pages use.
- Half-star ratings and favorites ("Later").

## Build loop

`workflow.stepReview` is `feature`: build all steps, then review the feature as
a whole. `workflow.checkpointCommits` is `disabled`: no commits between steps;
`/complete` creates the single feature commit. After each step run
`npm run lint` from the root and keep the app working.

## Build steps

- [x] **1. Stats endpoint.** Add `server/src/controllers/profileController.js`
  with a `stats` handler and `server/src/routes/profile.js` (`router.use(requireAuth)`,
  `router.get('/stats', stats)`), mounted in `server/src/index.js` as
  `app.use('/api/profile', profileRoutes)` before `notFound`. Run the aggregation,
  the list count and `getGenreMap()` in parallel with `Promise.all`, then shape
  the response described under Data / contracts.
  - Done when: signed in, `GET /api/profile/stats` returns the documented shape
    with values matching the user's library and lists (checked against a user
    with a few want, watched, rated and unrated movies and at least one list);
    a brand-new user gets all zeros, `averageRating: null`, five zero buckets and
    `topGenres: []`; signed out it returns 401 `{ message }`; another user's
    movies and lists never appear in the counts; `npm run lint` passes.

- [x] **2. Profile page with stat cards.** Add `client/src/hooks/useProfileStats.js`
  (same `loading | ready | error` + `retry` pattern as `useLists`/`useGenres`,
  with `AbortController`) and rebuild `client/src/pages/ProfilePage.jsx` with a
  `Profile` `h1` and a grid of stat cards in `client/src/components/profile/StatCard.jsx`:
  *Watched*, *Want to watch*, *Average rating* and *Lists*.
  - Done when: `/profile` shows `Loading your stats...` in a `role="status"`
    element while loading; on failure shows a `role="alert"` message with a
    *Try again* button that refetches (focus moves to the stats section first,
    as `ListsPage` does); on success shows the four cards with the API values;
    average rating shows as `4.2 / 5` with the count of rated movies, or
    `No ratings yet` when `averageRating` is null; the grid is one column at
    320px and wider on larger screens; `npm run lint` and `npm run build` in
    `client/` pass.

- [x] **3. Rating distribution and top genres.** Add
  `client/src/components/profile/RatingDistribution.jsx` and
  `client/src/components/profile/TopGenres.jsx` and render them under the cards.
  - Done when: the distribution lists 5 down to 1 stars, each row with a text
    label (`5 stars`, `1 star`), its count, and a bar whose width is the count's
    share of the largest bucket; with no rated movies it shows
    `Rate movies you've watched to see your rating distribution.` instead of
    bars. Top genres shows up to three genres in order with their movie counts
    (`Drama · 7 movies`); with none it shows
    `Save some movies to see your top genres.`; `npm run lint` and
    `npm run build` pass.

- [x] **4. Repair F-25: count each genre once per movie.** In the genres facet
  of `server/src/controllers/profileController.js`, de-duplicate `genreIds`
  with `$setUnion` before `$unwind`, so a snapshot stored with repeated ids
  (the library only checks they are integers) still counts once.
  - Done when: a movie saved with `genreIds: [18, 18, 18]` adds 1, not 3, to
    Drama in `GET /api/profile/stats`; a movie with no genre ids still adds
    nothing; `npm run lint` passes.

## Files / areas

- New: `server/src/controllers/profileController.js`, `server/src/routes/profile.js`
- Edit: `server/src/index.js` (mount the router)
- Read only: `server/src/services/tmdb.js` (`getGenreMap`),
  `server/src/models/SavedMovie.js`, `server/src/models/List.js`,
  `server/src/middleware/requireAuth.js`
- New: `client/src/hooks/useProfileStats.js`,
  `client/src/components/profile/StatCard.jsx`,
  `client/src/components/profile/RatingDistribution.jsx`,
  `client/src/components/profile/TopGenres.jsx`
- Edit: `client/src/pages/ProfilePage.jsx` (already routed at `/profile` under
  `ProtectedRoute` in `App.jsx`; the navbar already links to it)

## Data / contracts

`GET /api/profile/stats` (auth cookie required) responds `200`:

```json
{
  "stats": {
    "watchedCount": 12,
    "watchlistCount": 5,
    "ratedCount": 9,
    "averageRating": 3.8,
    "ratingDistribution": [
      { "rating": 1, "count": 0 },
      { "rating": 2, "count": 1 },
      { "rating": 3, "count": 2 },
      { "rating": 4, "count": 4 },
      { "rating": 5, "count": 2 }
    ],
    "topGenres": [
      { "id": 18, "name": "Drama", "count": 7 },
      { "id": 28, "name": "Action", "count": 5 },
      { "id": 35, "name": "Comedy", "count": 4 }
    ],
    "listCount": 3
  }
}
```

- `watchedCount` / `watchlistCount`: SavedMovie documents with `status`
  `"watched"` / `"want"`.
- `ratedCount`: documents with a non-null `rating` (only watched movies can have
  one). `averageRating`: mean of those ratings rounded to one decimal, or `null`
  when `ratedCount` is 0.
- `ratingDistribution`: always exactly five entries, ratings 1 to 5 ascending,
  zero-filled on the server for missing buckets.
- `topGenres`: count each genre id once per saved movie across the whole library
  (both statuses; see Open questions), drop ids the genre map does not know,
  sort by count descending then name ascending, keep the first 3. May hold fewer
  than 3 or be empty.
- `listCount`: the user's `List` documents.
- `401 { message: "Not authenticated" }` without a valid cookie (existing
  `requireAuth`). Any other failure, including a failed TMDB genre fetch, reaches
  the central handler as `500 { message: "Internal server error" }`; the genre
  cache does not store failures, so the client's *Try again* retries it.

## Testing

No test runner is configured, so tests are not a gate. Gates are `npm run lint`
(root) and `npm run build` (in `client/`). Manual checks for `/check`: the Done
when items above, run against a local MongoDB with two accounts to confirm
per-user scoping. Do not claim browser or live-data evidence that was not run.

## Notes for the AI

- `aggregate()` does not cast like `find()` does: `$match` on
  `{ user: new mongoose.Types.ObjectId(req.userId) }`, or the pipeline silently
  matches nothing. `req.userId` comes only from the verified JWT; never read a
  user id from query, params or body.
- `List.countDocuments({ user: req.userId })` casts normally.
- Count genres with `$unwind: '$genreIds'` then `$group` by genre id; a movie
  with an empty or missing `genreIds` contributes nothing. `POST /library` does
  not de-duplicate `genreIds`, so de-duplicate with `$setUnion` before the
  `$unwind` (F-25).
- Keep the handler under about 50 lines: small helper functions for the
  pipeline and for shaping each facet are fine; no new service file.
- Express 5 forwards async rejections, so the handler can just `await`.
- Genre names come from TMDB: render them as React text only, never as HTML.
- The bar width is a truly dynamic value, so an inline `style={{ width }}` is
  allowed there; mark the bar `aria-hidden="true"` because the label and count
  carry the information. Guard the largest-bucket divisor against 0.
- Pluralize counts (`1 movie`, `2 movies`; `1 star`, `2 stars`); reuse
  `formatMovieCount` from `client/src/lib/lists.js` if it fits.
- Follow the existing dark theme tokens (`bg-surface`, `border-border`,
  `rounded-card`, `text-muted`, `text-star-on`, `text-accent`).

## Open questions

- **Which movies count toward top genres?** The plans say only "counted by
  `genreIds`". This spec counts the whole library (watched and want to watch),
  so a new user who has only saved to the watchlist still sees genres. The
  alternative is watched movies only. Confirm or switch before Implement; it
  changes one `$match` stage and the empty-state wording.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9449,"specSha256":"507946c0fa57609620ee56cf2a2aa21b18fa88dfeeea427364a31dffc30fc982","branch":"refs/heads/feature/profile-stats","head":"e0cbb636bfe0e0aed892e15eb2d12fe91a0dcfb4","baseRef":"refs/heads/main","baseCommit":"7a7a45cf546bbeb457edbe5487b88b092f549735","sourceTree":"8a1e9263ad27c31950f02a4d62c2a1088fb11873","landing":"local-merge","absentOptional":[]} -->

## Findings

### 13/F-25 [P3] closed - Top genres trusts the client to send each genre id once

**File:** server/src/controllers/profileController.js:21
**Found:** 2026-11-08 by /audit independent (scope: current; lens: quality, security)
**Why it matters:** The stats contract counts each genre once per saved movie, and the spec relies on saved snapshots being de-duplicated. `parseSnapshot` in `server/src/controllers/libraryController.js:63` only checks that `genreIds` is an array of integers, so a request body such as `genreIds: [18, 18, 18]` is stored as is and `$unwind` counts that movie three times for Drama. The real client sends TMDB's unique ids, and only the user's own stats are affected, so the impact is limited to a self-inflicted wrong count. Found by reading the code path, not run against a database.
**Suggested fix:** De-duplicate at write time in `parseSnapshot` with `[...new Set(genreIds)]`, or add `{ $project: { genreIds: { $setUnion: ['$genreIds', []] } } }` before the `$unwind` in the genres facet. No current requirement would be lost.
**Resolution:** Fixed by /implement (spec step 4): the genres facet now de-duplicates with `$setUnion` before `$unwind`, which also covers rows already stored with repeated ids. Checked against local MongoDB: a movie saved with `[18, 18, 18]` adds 1 to Drama, and one saved with `[]` adds nothing. Awaiting re-review. Closed by /audit independent at e0cbb63 (2026-11-08): server/src/controllers/profileController.js:22 projects `genreIds` through `$setUnion: ['$genreIds', []]` before the `$unwind` at line 23, so each id counts at most once per movie, including rows already stored with repeats. An empty array unwinds to nothing. A missing field makes `$setUnion` return null, which `$unwind` also drops, and the schema defaults `genreIds` to an array anyway. The `$project` only feeds the genres facet, so the statuses and ratings facets are unchanged. The repair adds no new defect. Verified by reading the code, not run against a database in this pass.

## Independent review

**Status:** passed
**Target commit:** e0cbb636bfe0e0aed892e15eb2d12fe91a0dcfb4
**Base commit:** 7a7a45cf546bbeb457edbe5487b88b092f549735
**Base ref:** main
**Spec hash:** 507946c0fa57609620ee56cf2a2aa21b18fa88dfeeea427364a31dffc30fc982
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-11-08T10:02:15Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-08T10:03:34Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `git rev-parse HEAD`, `git merge-base main HEAD`, `sha256sum blueprint/context/current-feature.md`, `git status --porcelain --untracked-files=all`: pass (freshness confirmed)
- `npm run lint` (root, client and server oxlint): pass, exit 0
- `npm run build` (client/): pass

## Evidence

- Freshness: HEAD equals the target, `main` gives the recorded merge base, the tracked spec's raw-byte SHA-256 matches, and only review.md and findings.md differ from the target.
- Delta reviewed: 8 code files plus the spec (profileController.js, routes/profile.js, index.js, useProfileStats.js, ProfilePage.jsx, StatCard.jsx, RatingDistribution.jsx, TopGenres.jsx). Read for context: SavedMovie.js, List.js, requireAuth.js, errorHandler.js, tmdb.js `getGenreMap`, libraryController.js validation, lib/lists.js, ListsPage.jsx, index.css theme tokens.
- Security: the router applies `requireAuth` to everything. The `$match` and `countDocuments` use only `req.userId` from the verified JWT and read no id from the client. Genre names render as React text. Errors go to the central handler.
- Contract: five zero-filled buckets in ascending order. The model enforces integer ratings from 1 to 5, and only on watched movies, so `ratedCount` from the buckets is exact. Average is rounded to one decimal or null. Genre map keys and `$group` ids are both numbers. Top genres drop unknown ids, sort by count then name, and keep 3.
- F-25 re-examined at profileController.js:22 and closed (see ledger).
- Performance: one aggregation using the `{ user, tmdbId }` index prefix, a parallel count, and the cached genre map. The work is bounded by one user's library.
- Client: AbortController in the hook. Retry moves focus to the stats section, which stays mounted. Bar is `aria-hidden` and guards division by zero. Grid is one column below 480px.

## Findings

- None new. F-25 moved from fixed to closed. F-18 re-examined, still open (P3; new copy at ProfilePage.jsx:61).

## Remaining risk

- No test command exists in either package, so the tests lens found no automated coverage of the stats endpoint or profile UI.
- No typecheck command exists (plain JavaScript).
- Check was not required and was not run. No live MongoDB, two-account scoping or browser evidence was gathered in this pass. The `$setUnion` behavior and aggregation results were verified by reading the code only.
- The spec's open question (whether top genres count the whole library or only watched movies) is still listed. The implementation follows the spec's stated default of the whole library.
- No screen reader was run. The error alert mounts with its text already inside, the same announcement pattern tracked as F-04 and F-10.

## Try it now

Run or do:

With `npm run dev` running from the repo root, sign in to an account that has a few saved and rated movies and open http://localhost:5173/profile.

Expected:

A "Profile" heading and four cards with your counts and average rating (for example `4.3 / 5` and `from 3 movies`), a rating distribution from 5 stars down to 1 star with bars and movie counts, and up to three numbered top genres such as `Drama · 3 movies`. A new account shows zeros, `No ratings yet`, and both empty-state messages.

This proves:

`/profile` shows the signed-in user's own stats from `GET /api/profile/stats`.
