# Feature: Add to list

**From build-plan:** feature 12
**Build attempt:** 1
**Branch:** feature/add-to-list
**Status:** verified

## Goal

A signed-in user can add any movie to one or more of their custom lists, from a
movie card or the details page, and can remove it again, either from the same
menu or from the list's detail page, which now shows its movies as cards.

## In scope

- `POST /api/lists/:id/movies` (add a movie snapshot) and
  `DELETE /api/lists/:id/movies/:tmdbId` (remove it), both behind `requireAuth`
  and scoped to the signed-in user's own list.
- `GET /api/lists?tmdbId=<id>`: the existing summaries plus a `hasMovie` boolean
  per list, so the menu can show which lists already hold the movie.
- An "Add to list" button on every movie card (home rows, search, similar,
  library) and on the details page. It opens a dialog listing the user's lists
  as checkboxes. Checking one adds the movie, unchecking removes it.
- The list detail page renders its movies as cards (poster, title, link to the
  details page) with a "Remove" button on each, and the movie count updates.

## Out of scope

- Creating a list from inside the dialog. The empty state links to `/lists`.
- Reordering movies in a list (a "Later" idea), release year or genres on list
  cards (the locked `List.movies` shape has neither), watchlist/watched controls
  on list cards.
- Profile list count (feature 13). Toasts, skeletons and the wider keyboard pass
  (feature 14).
- Any change to the `List` schema or the `List.movies` item shape.

## Build loop

`workflow.stepReview` is `feature`: build all steps, then review the feature as a
whole. `workflow.checkpointCommits` is `disabled`: no commits between steps;
`/complete` makes the single feature commit. Run `npm run lint` from the root
after each step.

## Build steps

- [x] **1. Server: add and remove a list movie.** In
  `server/src/controllers/listController.js` add `addListMovie` and
  `removeListMovie`; wire `router.post('/:id/movies', addListMovie)` and
  `router.delete('/:id/movies/:tmdbId', removeListMovie)` in
  `server/src/routes/lists.js`. Validate the body with `parseTmdbId` (already
  exported from `movieController.js`) and the same title and poster-path rules
  as `POST /library`: extract those two checks from `parseSnapshot` in
  `libraryController.js` into exported helpers and use them in both places, so
  the rules and messages stay identical. Add atomically with a single
  `List.findOneAndUpdate({ _id, user: req.userId, 'movies.tmdbId': { $ne: tmdbId } }, { $push: { movies: { $each: [snapshot], $position: 0 } } }, { new: true })`;
  when it returns null, fall back to `findOwnList` (404 when missing, otherwise
  the movie was already there: 200 with the unchanged list). Remove with
  `findOneAndUpdate({ _id, user }, { $pull: { movies: { tmdbId } } })`; null is
  404, otherwise 204 whether or not the movie was in the list. Malformed list ids
  are 404, as elsewhere.
  **Done when:** with curl and a session cookie, adding returns 201 and the movie
  first in `movies`; adding again returns 200 with no duplicate; removing returns
  204 twice; another user's list id, a malformed id, a bad `tmdbId`, a missing
  title and a bad poster path return 404/404/400/400/400; `POST /library` still
  accepts and rejects the same bodies; lint passes.

- [x] **2. Server: membership on the lists summary.** `listLists` reads an
  optional `tmdbId` query. Empty or absent keeps today's response exactly. A
  value goes through `parseTmdbId` (400 when invalid, arrays included) and each
  summary gains `hasMovie: movies.some((movie) => movie.tmdbId === tmdbId)`.
  **Done when:** `GET /api/lists` is unchanged, `GET /api/lists?tmdbId=<id>`
  marks exactly the lists holding that movie, `?tmdbId=abc` is 400; lint passes.

- [x] **3. Client: the Add to list dialog.** Add
  `client/src/components/lists/AddToListButton.jsx` (trigger and dialog) and
  `client/src/hooks/useListMembership.js` (fetch on open, toggle). Render the
  button at the end of `LibraryControls.jsx`, so cards and the details hero both
  get it, with `aria-label={`Add to list: ${title}`}` and the existing button
  classes from `useLibraryAction.js`. Pressing it opens a native `<dialog>` with
  `showModal()` (top layer, so the sideways-scrolling rows cannot clip it; Escape
  closes natively), titled "Add “<title>” to a list" via `aria-labelledby`, with a
  "Done" close button. On every open it requests `GET /lists?tmdbId=`.
  States: `role="status"` "Loading lists..."; `role="alert"` "We couldn't load
  your lists." with "Try again"; empty "You have no lists yet." with a link to
  `/lists`; ready: one labelled checkbox per list (`checked` = `hasMovie`,
  list name as React text). Changing a checkbox sends POST (with
  `{ tmdbId, title, posterPath }` from the card's movie) or DELETE, ignores
  further changes to that row while pending (`aria-busy`), updates the checkbox
  only on success, and on failure leaves it as it was and shows a
  `role="alert"` "Couldn't update “<list name>”. Try again." that clears on the
  next change. A 404 on toggle (list deleted elsewhere) refetches the lists.
  Closing by Done, Escape or backdrop click returns focus to the trigger.
  **Done when:** in the browser, from a home row card, a search card and the
  details page, the dialog opens over the page, shows the user's lists with
  correct ticks, adding and removing change that list's movie count on
  `/lists`, Escape returns focus to the trigger, and a user with no lists sees
  the empty state; lint passes.

- [x] **4. Client: list movies on the detail page.** `MovieCard.jsx` takes an
  optional `controls` prop that replaces `LibraryControls` when given, and shows
  the year only when `releaseYear` is a number (list snapshots have none).
  `MovieGrid.jsx` passes a `renderControls(movie)` prop through. In
  `ListDetailsPage.jsx` render `list.movies` in `MovieGrid` under an `h2`
  "Movies" (`labelledBy`), each with a "Remove" button
  (`aria-label={`Remove ${title} from ${list.name}`}`), keeping the empty state.
  `useList.js` gains `removeMovie(tmdbId)` that calls DELETE and filters the
  movie out (a 404 means the list is gone: switch to `notFound`). Removing
  shows a pending state, an inline `role="alert"` on failure, and moves focus to
  the "Movies" heading (`tabIndex={-1}`) or, for the last movie, the empty-state
  text, since the pressed button disappears.
  **Done when:** in the browser, a list with movies shows them newest-added
  first as cards linking to `/movie/:tmdbId`, Remove drops the card and the count
  without a reload and keeps focus on the page, removing the last movie shows
  "No movies in this list yet.", and other grids still show watchlist controls
  and years; lint passes.

## Files / areas

- Server: `server/src/controllers/listController.js`,
  `server/src/routes/lists.js`, `server/src/controllers/libraryController.js`
  (extract shared title and poster checks only).
- Client: new `client/src/components/lists/AddToListButton.jsx`,
  `client/src/hooks/useListMembership.js`; changed
  `client/src/components/movies/LibraryControls.jsx`,
  `client/src/components/movies/MovieCard.jsx`,
  `client/src/components/movies/MovieGrid.jsx`,
  `client/src/hooks/useList.js`, `client/src/pages/ListDetailsPage.jsx`.
- No change: `server/src/models/List.js`, `client/src/App.jsx` routes,
  `server/src/index.js` mount.

## Data / contracts

All routes require the auth cookie; the owner is always `req.userId` from the
verified JWT. `user` and `addedAt` are never taken from the body; unknown body
fields are ignored. Errors are `{ message }` from the central handler.

| Request | Success | Errors |
| --- | --- | --- |
| `GET /lists?tmdbId=603` | 200 `{ lists: [{ id, name, description, movieCount, hasMovie, createdAt, updatedAt }] }` (no `hasMovie` without the query) | 400 `Movie id must be a TMDB movie id` |
| `POST /lists/:id/movies` `{ tmdbId: number, title: string, posterPath: string \| null }` | 201 `{ list }` when added; 200 `{ list }` unchanged when already present | 400 id / `Title is required` / `Poster path must be a TMDB image path`; 404 `List not found` |
| `DELETE /lists/:id/movies/:tmdbId` | 204, also when the movie was not in the list | 400 bad `tmdbId`; 404 `List not found` |

- `{ list }` is the existing full shape `{ id, name, description, movies, createdAt, updatedAt }`.
- Stored item: `{ tmdbId, title, posterPath, addedAt }`, `addedAt` set by the
  server, inserted at index 0 so `movies` is newest-added first.
- One entry per `tmdbId` per list, guaranteed by the `$ne` filter in the same
  atomic update; concurrent duplicate adds cannot both push.
- `posterPath` absent is stored as `null`. The title snapshot is never
  refreshed on a repeat add.

## Testing

No test runner is configured, so tests are not a gate. Each step's evidence is
`npm run lint` plus the curl or browser checks in its Done when. Do not claim
browser evidence that was not run.

## Notes for the AI

- The plan says "menu"; a modal `<dialog>` is the chosen rendering because card
  rows scroll sideways and would clip an absolutely positioned popover. Do not
  add a popover library.
- List names and movie titles are user or TMDB text: render as React text only.
- Toggle requests are not optimistic; the checkbox reflects server state.
- Fetch membership on each open rather than adding a lists context; lists change
  on other pages and the call is cheap at this scale.
- Keep the double-press guard pattern from `useLibraryAction` (`event.detail > 1`
  and key repeat) for Remove buttons, since the next card's button slides under
  the pointer.
- The `LibraryControls` card buttons are `w-full`; the new button matches.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9750,"specSha256":"52529189c4d2a7f7761dd43975dff0908bfca4959e633ea5d05a2b552638cf16","branch":"refs/heads/feature/add-to-list","head":"ba72d08102c46d0c45a3edb2ee525070fe4afe6f","baseRef":"refs/heads/main","baseCommit":"bdabae5f78f27dc15916c531408a07c5785ef530","sourceTree":"10b25ab644b337278014555239a78a3fd9428528","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** ba72d08102c46d0c45a3edb2ee525070fe4afe6f
**Base commit:** bdabae5f78f27dc15916c531408a07c5785ef530
**Base ref:** main
**Spec hash:** 52529189c4d2a7f7761dd43975dff0908bfca4959e633ea5d05a2b552638cf16
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-11-08T09:40:32Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-08T09:42:38Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npm run lint` (root, client oxlint then server oxlint): pass
- `npm run build` (client/): pass
- Test command: unavailable (no test runner configured)
- Typecheck command: unavailable (plain JavaScript project)

## Evidence

- Freshness: HEAD, merge-base of main and HEAD, and the SHA-256 of the raw current-feature.md bytes all match the request; the only working-tree difference was blueprint/context/review.md.
- Reviewed the full delta for all 10 product files in server/src and client/src, plus the callers and contracts they depend on: List model, requireAuth router mount, parseTmdbId, useLibraryAction, useList, LibraryControls callers (MovieRow, MovieGrid, MovieHero), App routes.
- Security: both new routes sit behind `router.use(requireAuth)`; every query filters on `user: req.userId`; body fields are validated with the shared library helpers and `user`/`addedAt` are never read from the body; malformed ids give 404; user and TMDB text is rendered as React text only.
- Data integrity: the add uses one `findOneAndUpdate` with a `movies.tmdbId: { $ne }` filter and `$push` at position 0, so concurrent duplicate adds cannot both insert; the List schema is unchanged.
- Spec contract checked against code: status codes and messages in the Data / contracts table, `hasMovie` only when `tmdbId` is given, array query rejected, non-optimistic toggle, 404 refetch, focus return on dialog close, `controls` and `renderControls` props, numeric-only year.

## Findings

- F-23 [P3] open (new): dialog reload drops focus
- F-24 [P3] open (new): overlapping removals can leave focus on the body
- F-18, F-19, F-21 [P3] open: re-examined and updated with the new copy, importers and line references

## Remaining risk

- No test command exists, so no automated test covered the new routes or components.
- No typecheck command exists (plain JavaScript).
- Check was not required and was not run. This review did not run the browser flows or curl the API; behavior evidence comes from reading the code.
- No screen reader was run, so how the new `role="alert"` and `role="status"` messages in the dialog are announced is unverified (see F-04 and F-10).
- Performance is from reading the code only: each movie card now mounts its own dialog and membership hook, and every open sends one `GET /lists`. Both look negligible at this scale but were not profiled.

## Try it now

Run or do:

With `npm run dev` running, sign in at http://localhost:5173, create a list named `Weekend picks` on http://localhost:5173/lists, then open http://localhost:5173/movie/603. Press **Add to list**, tick **Weekend picks**, press **Done**, and open that list from http://localhost:5173/lists.

Expected:

The dialog titled "Add “The Matrix” to a list" shows **Weekend picks** unticked; after ticking it stays ticked, and Done closes the dialog with focus back on **Add to list**. The list page shows "1 movie" and a The Matrix card with a **Remove** button; pressing Remove drops the card and shows "No movies in this list yet."

This proves:

A movie can be added to a list from the details page and removed from the list page, with the list's movies rendered as cards.
