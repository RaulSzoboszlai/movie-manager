# Feature: Custom lists

**From build-plan:** feature 11
**Build attempt:** 1
**Status:** verified
**Branch:** feature/custom-lists

## Goal

A signed-in user can create, view, rename and delete their own named movie lists.
This adds the List model and its CRUD endpoints, a `/lists` page and a
`/lists/:id` detail page. Adding and removing movies is feature 12.

## In scope

- `server/src/models/List.js` with the locked shape from the project overview:
  `user`, `name`, `description`, `movies[] { tmdbId, title, posterPath, addedAt }`,
  timestamps, unique compound index `{ user, name }`.
- `GET /api/lists`, `POST /api/lists`, `GET /api/lists/:id`,
  `PATCH /api/lists/:id`, `DELETE /api/lists/:id`, all behind `requireAuth` and
  scoped by `req.userId`.
- Lists page: create form (name, optional description), the user's lists as
  links with their movie count, loading, empty and error states.
- List detail page: name, description, movie count, rename (name and description
  edit form), delete with confirmation, loading, not-found and error states, and
  an empty "no movies yet" state.

## Out of scope

- `POST /lists/:id/movies` and `DELETE /lists/:id/movies/:tmdbId`, the "Add to
  list" menu, and rendering list movies as cards. All feature 12. The detail page
  shows only the count and the empty state in this feature, since no list can
  hold a movie yet.
- Profile list count (feature 13), toasts and skeletons (feature 14).
- Reordering, sharing, public lists (Later).
- A cap on how many lists a user can have.

## Build loop

`workflow.stepReview` is `feature`: build every step, then stop once for review
of the whole feature. `workflow.checkpointCommits` is `disabled`: no commits per
step; `/complete` makes the single feature commit. After each step run
`npm run lint` from the root.

## Build steps

- [x] **1. List model.** Add `server/src/models/List.js` (default export,
  singular `List`). Embedded movie subdocument uses `{ _id: false }`; `name`
  required and trimmed; `description` default `''`; `movies` default `[]`;
  `{ timestamps: true }`; `listSchema.index({ user: 1, name: 1 }, { unique: true })`.
  Field types follow the overview (`tmdbId` Number required, `title` String,
  `posterPath` String default null, `addedAt` Date default now).
  **Done when:** the file lints clean and imports without error from the
  controller added in step 2.

- [x] **2. List endpoints.** Add `server/src/controllers/listController.js` and
  `server/src/routes/lists.js` (`router.use(requireAuth)`), mounted at
  `/api/lists` in `server/src/index.js`. Contract under Data / contracts.
  Validation lives in the controller using `httpError`, following
  `libraryController.js`. Duplicate-name `11000` maps to 409. Invalid ObjectId
  and lists owned by another user both return 404 from a query filtered by
  `{ _id, user: req.userId }`.
  **Done when:** with the dev server and a signed-in cookie, each endpoint returns
  the documented shapes and statuses (happy path, empty name, too-long name,
  duplicate name, bad id, another user's id, no cookie gives 401), and lint passes.

- [x] **3. Lists page.** Replace the placeholder `client/src/pages/ListsPage.jsx`.
  Add `client/src/hooks/useLists.js` (fetch `GET /lists` through the shared `api`
  instance with an `AbortController`, `loading | ready | error` and `retry`,
  following `useMovieDetails.js`). Add
  `client/src/components/lists/CreateListForm.jsx` using `FormField` for name and
  description. Client mirrors the server rules (trimmed name required, at most 60
  characters; description at most 500), shows the field error under the input via
  `FormField` (`aria-invalid`, `aria-describedby`), moves focus to the first
  invalid field on submit, clears a field's error when it is edited, and shows a
  server `message` (such as the 409) under the name field. Disable submit while
  saving. On success, clear the form and insert the new list at the top. Each list
  renders as a `Link` to `/lists/:id` with name and "N movies" (singular for 1).
  States: `role="status"` loading text, `role="alert"` error with "Try again",
  and an empty state ("No lists yet. Create your first one above.").
  **Done when:** in the browser, a new user sees the empty state, creates a list
  and sees it appear without reload, gets an inline error for a blank, too-long or
  duplicate name, and lint passes.

- [x] **4. List detail page.** Replace `client/src/pages/ListDetailsPage.jsx`.
  Add `client/src/hooks/useList.js` (`GET /lists/:id`, states
  `loading | ready | notFound | error`, `retry`, plus a setter so rename updates
  the page in place). Show name as `h1`, description (if any) and the movie count,
  then "No movies in this list yet." A "Rename" button reveals an edit form
  (`client/src/components/lists/EditListForm.jsx`, same field rules and error
  behavior as create, prefilled; Save and Cancel; Escape or Cancel closes it and
  returns focus to the Rename button; on open, focus moves to the name input; on
  success, the form closes, the heading updates and focus returns to Rename).
  A "Delete list" button asks `window.confirm` with the list name, calls
  `DELETE`, then navigates to `/lists`; a failed delete shows an inline
  `role="alert"` message and keeps the page usable. Not found (404 or a malformed
  id) shows "List not found" with a link back to `/lists`. A "Back to lists" link
  sits above the heading.
  **Done when:** in the browser, opening a list shows its details, renaming
  updates the heading and the `/lists` page, a duplicate rename shows the 409
  message inline, deleting returns to `/lists` without that list, a bad or foreign
  id shows "List not found", and lint passes.

## Files / areas

- New: `server/src/models/List.js`, `server/src/controllers/listController.js`,
  `server/src/routes/lists.js`, `client/src/hooks/useLists.js`,
  `client/src/hooks/useList.js`, `client/src/components/lists/CreateListForm.jsx`,
  `client/src/components/lists/EditListForm.jsx`.
- Changed: `server/src/index.js` (mount router),
  `client/src/pages/ListsPage.jsx`, `client/src/pages/ListDetailsPage.jsx`.
- Already in place, no change: `/lists` and `/lists/:id` routes in
  `client/src/App.jsx` under `ProtectedRoute`, the "Lists" navbar link.

## Data / contracts

Persisted shape: the List model above. The unique `{ user, name }` index uses
the collation `{ locale: 'en', strength: 2 }`, so after trimming, names compare
case-insensitively but accent-sensitively: "Favorites" and "favorites" collide
(409), while "Café" and "Cafe" are two lists. Names keep the capitalization the
user typed, and a rename that only changes a list's own capitalization succeeds.
Names are stored trimmed; descriptions are stored trimmed, `''` when absent.
Existing databases need the old case-sensitive `user_1_name_1` index dropped
once (after removing any case-only duplicates) so Mongoose can rebuild it with
the collation.

Validation (server, mirrored on the client):

- `name`: string, trimmed, 1 to 60 characters. Else 400 `Name is required` or
  `Name must be at most 60 characters`.
- `description`: optional string, trimmed, at most 500 characters. Non-string
  gives 400 `Description must be text`; too long gives 400
  `Description must be at most 500 characters`.
- `PATCH` needs at least one of `name` or `description`, else 400
  `Name or description is required`.
- Unknown body fields are ignored; `user` and `movies` are never taken from the
  body.

List summary (array items): `{ id, name, description, movieCount, createdAt, updatedAt }`.
Full list: `{ id, name, description, movies, createdAt, updatedAt }` where
`movies` items are `{ tmdbId, title, posterPath, addedAt }`. `id` is the
ObjectId as a string. `user` is never returned.

| Request | Success | Errors |
| --- | --- | --- |
| `GET /api/lists` | 200 `{ lists: [summary] }`, newest `createdAt` first, `_id` tiebreak | 401 |
| `POST /api/lists` `{ name, description? }` | 201 `{ list: full }` | 400, 401, 409 `You already have a list with that name` |
| `GET /api/lists/:id` | 200 `{ list: full }` | 401, 404 `List not found` |
| `PATCH /api/lists/:id` `{ name?, description? }` | 200 `{ list: full }` | 400, 401, 404, 409 |
| `DELETE /api/lists/:id` | 204 | 401, 404 |

All errors use the central `{ message }` shape. A malformed id is a 404, not a
400, so the client handles it like a missing list. Ownership comes only from
`req.userId`; another user's list is indistinguishable from a missing one.
`PATCH` uses `findOne` plus `save()` so model validation runs; a rename to the
list's own current name succeeds.

## Testing

No test runner is configured, so tests are not a gate. Each step is checked with
`npm run lint` and the manual checks in its Done when. API checks use the dev
server with a real cookie; this spec does not claim they have run.

## Notes for the AI

- List names and descriptions are user text: render them as React text children
  only, never `dangerouslySetInnerHTML`. Long names must wrap (`break-words`)
  rather than overflow at phone width.
- Reuse `FormField`, the `api` instance, the button and focus-ring classes from
  `LibraryPage.jsx`, and the theme tokens. No new dependencies.
- Express 5 forwards rejected async handlers to the error middleware; do not add
  a wrapper.
- Check `mongoose.isValidObjectId` (or catch `CastError`) before querying so a bad
  id becomes the 404 above, never a 500.
- The 401 interceptor in `AuthContext` already sends signed-out users to login;
  the hooks need no extra 401 handling.
- `description` is in the locked model shape, so the forms expose it as an
  optional field; the build plan only names rename, so keep its UI minimal.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":9690,"specSha256":"2dd4680bb5bb29ffcff63921cb5f7e31158b53259ec9a4427a1e159bce10c12b","branch":"refs/heads/feature/custom-lists","head":"7d1db4c4e045f00b6e561abcda9af8dc983ea481","baseRef":"refs/heads/main","baseCommit":"990d1502376835a78f421331f28f22f463cc6ff6","sourceTree":"589d4fdccfa5267cd567cf8add64688abd458acb","landing":"local-merge","absentOptional":[]} -->

## Independent review

**Status:** passed
**Target commit:** 7d1db4c4e045f00b6e561abcda9af8dc983ea481
**Base commit:** 990d1502376835a78f421331f28f22f463cc6ff6
**Base ref:** origin/main
**Spec hash:** 2dd4680bb5bb29ffcff63921cb5f7e31158b53259ec9a4427a1e159bce10c12b
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** claude-opus-5-5
**Requested execution:** automatic
**Requested at:** 2026-11-08T09:10:56Z
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-08T09:13:03Z
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npm run lint` (root; oxlint on client, then server/src): pass
- `npm run build --prefix client` (vite build, 341 modules): pass
- Test command: unavailable (none declared in AGENTS.md)
- Verify command: unavailable (none declared in AGENTS.md)

## Evidence

- Freshness: HEAD equals Target commit; `git merge-base origin/main HEAD` equals Base commit; SHA-256 of raw current-feature.md bytes equals Spec hash (spec is tracked, no snapshot); `git status` showed only blueprint/context/review.md modified.
- Reviewed the full `990d150..7d1db4c` delta: server List model, listController, lists routes, index.js mount; client lists components, useList, useListForm, useLists, lib/lists.js, ListsPage, ListDetailsPage; overview Data model edit; spec.
- Security: every list query and delete filters on `req.userId` from the verified JWT; `user` and `movies` are never read from the body or returned; malformed ids return 404 via `mongoose.isValidObjectId`; name and description are type-checked, trimmed and length-bounded; duplicate key 11000 maps to 409; user text renders only as React text children.
- Contract: response shapes, statuses, `createdAt`/`_id` sort and case-insensitive collation index match the spec Data / contracts section and the updated overview.

## Findings

- F-22 [P3] open - new: cancelling the rename form during a save does not cancel the save
- F-18 [P3] open - updated: two more "Try again" copies in ListsPage.jsx:41 and ListDetailsPage.jsx:107
- F-04 [P3] unverified - updated: same alert pattern added in ListFields.jsx:8 and ListDetailsPage.jsx:59
- No P0 or P1 finding is open or fixed

## Remaining risk

- No test command declared: validators (`parseName`, `parseDescription`, `validateList`) have no automated coverage.
- No Verify command declared.
- API and browser behavior were not exercised in this review (no dev server or browser run; Check not required). Evidence is code reading, lint and build.
- Databases created before the collation was added keep the old case-sensitive `user_1_name_1` index until it is dropped by hand, as the spec notes; until then case-only duplicate names are accepted.
- `GET /api/lists` loads each list's full `movies` array only to count it; unverified and negligible at current scale, revisit if feature 12 lists grow large.

## Try it now

Run or do:

With `npm run dev` running, sign in at http://localhost:5173 and open http://localhost:5173/lists. Type `Weekend picks` in **Name** and press **Create list**, then type `weekend PICKS` and press **Create list** again.

Expected:

After the first press the form clears and a "Weekend picks" card showing "0 movies" appears without a reload. After the second press, "You already have a list with that name" appears in red under **Name** and focus moves into that field.

This proves:

The Lists page creates a list and shows it immediately, and duplicate names are rejected case-insensitively with the error on the field.
