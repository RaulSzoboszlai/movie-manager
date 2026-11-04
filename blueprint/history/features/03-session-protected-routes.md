# Feature: Session & protected routes

**From build-plan:** feature 3
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/session-protected-routes`

## Goal

The app knows who is signed in. The server can verify the session cookie that
Feature 2 sets, and the client restores the session on load, keeps anonymous users
out of protected pages, keeps signed-in users off the auth forms, and shows the
username and a logout button in the navbar.

## In scope

- `requireAuth` middleware and `GET /api/auth/me`.
- `requireAuth` on `POST /api/auth/logout`.
- `AuthContext` that loads `/auth/me` at startup, and a `useAuth` hook.
- A 401 response interceptor on the shared Axios instance.
- `ProtectedRoute` for every protected page, and `PublicOnlyRoute` for `/login` and
  `/register`.
- Navbar account area: username and logout when signed in, the existing links
  otherwise.
- Loading and session-check-failed states for the guards, plus pending and failure
  states for logout.

## Out of scope

- Returning to the originally requested URL after login. The project plan sends
  signed-in users to `/`, and Feature 2 navigates there on success.
- Hiding the main nav links from anonymous users. They stay visible and redirect to
  `/login` when followed. The mobile menu is Feature 14.
- Toasts, skeletons and route-change focus management (Feature 14).
- Any page content. The protected pages stay placeholders.
- Auth on `GET /api/health`, which stays public.
- Syncing sessions across tabs. Another tab finds out on its next 401 or reload.
- Refresh tokens, rate limiting, CSRF tokens (not v1).
- New dependencies or a test runner.

## Build loop

`workflow.stepReview` is `feature`: build all steps in order without stopping for
per-step approval, and keep the project working after each one. Review happens at
`/check` and `/audit current`. `workflow.checkpointCommits` is `disabled`: make no
commits during the build. `/complete` creates the final feature commit.

## Build steps

- [x] **1. Server session.** Move `httpError` from `authController.js` to
  `middleware/errorHandler.js` as a named export, and import it in the controller.
  Add `middleware/requireAuth.js` and the `me` handler. In `routes/auth.js`, add
  `GET /me` and put `requireAuth` on `POST /logout`.
  **Done when:** every row of the server table under Testing behaves as written, and
  `npm run lint` passes.
- [x] **2. Auth context.** Add `client/src/context/AuthContext.jsx` and
  `client/src/hooks/useAuth.js`. Wrap `<App />` in `AuthProvider` in `main.jsx`. The
  provider registers the interceptor, then loads the session. Nothing consumes it yet,
  so the forms and pages behave as before.
  **Done when:** a page load sends `GET /api/auth/me`, and under `StrictMode` one
  request completes and any other is cancelled; the forms still work; `npm run lint`
  and the client build pass.
- [x] **3. Route guards and forms.** Add `components/auth/ProtectedRoute.jsx` and
  `components/auth/PublicOnlyRoute.jsx`, and nest the routes in `App.jsx` under them
  inside `Layout`. Change `LoginPage` and `RegisterPage` to submit through the context
  actions. Remove `useNavigate` from `useAuthForm`, because `PublicOnlyRoute` now owns
  the redirect after success.
  **Done when:** the redirect, loading, session-failure and form rows of the browser
  table behave as written, and `npm run lint` and the client build pass.
- [x] **4. Navbar account area.** Add `components/layout/AccountNav.jsx` and use it in
  `Navbar.jsx` in place of the hardcoded links.
  **Done when:** the navbar and logout rows of the browser table behave as written,
  the longest allowed username causes no horizontal page scroll at 320px, and
  `npm run lint` and the client build pass.
- [x] **5. Re-check the session on back-forward cache restore.** Added after `/check`
  found that Back after logout restored a signed-in page. Add a `pageshow` listener to
  the provider's effect.
  **Done when:** both back-forward cache rows of the browser table behave as written,
  and `npm run lint` and the client build pass.

## Files / areas

| File | Change |
| --- | --- |
| `server/src/middleware/errorHandler.js` | Export `httpError` |
| `server/src/middleware/requireAuth.js` | New |
| `server/src/controllers/authController.js` | Add `me`, import `httpError` |
| `server/src/routes/auth.js` | Add `GET /me`, guard `POST /logout` |
| `client/src/context/AuthContext.jsx` | New: provider, session state, interceptor, actions |
| `client/src/hooks/useAuth.js` | New: holds the context object and reads it. The object lives here because lint's `only-export-components` rule rejects it beside the provider |
| `client/src/main.jsx` | Wrap `App` in `AuthProvider` |
| `client/src/components/auth/ProtectedRoute.jsx` | New |
| `client/src/components/auth/PublicOnlyRoute.jsx` | New |
| `client/src/App.jsx` | Nest routes under the guards |
| `client/src/hooks/useAuthForm.js` | Remove navigation |
| `client/src/pages/LoginPage.jsx`, `RegisterPage.jsx` | Submit through the context |
| `client/src/components/layout/AccountNav.jsx` | New |
| `client/src/components/layout/Navbar.jsx` | Render `AccountNav`, drop the login and register class helpers it no longer uses |

## Data / contracts

No schema or stored-data changes. The JWT and cookie are as Feature 2 ships them.

### `requireAuth`

- Calls `jwt.verify(req.cookies.token, JWT_SECRET)`, with `JWT_SECRET` read once at
  module load as `authController.js` does.
- On success, sets `req.userId = payload.sub` and calls `next()`. It does not query
  the database.
- Any verification failure throws `httpError(401, 'Not authenticated')`. That covers
  a missing, malformed, tampered or expired token, and a non-string cookie value, which
  `cookie-parser` produces from `j:` cookies. The `try` wraps only `jwt.verify`.

### Endpoints

| Request | Result |
| --- | --- |
| `GET /api/auth/me`, valid cookie | 200 `{ user: { id, username, email } }`, the same shape as login, via `toPublicUser`. Never includes `passwordHash` |
| `GET /api/auth/me`, invalid or no cookie | 401 `{ message: 'Not authenticated' }` |
| `GET /api/auth/me`, valid token whose user no longer exists | 401 `{ message: 'Not authenticated' }` |
| `POST /api/auth/logout`, valid cookie | 204, cookie cleared with the same options it was set with |
| `POST /api/auth/logout`, invalid or no cookie | 401 `{ message: 'Not authenticated' }`, cookie not touched |

The user id comes only from the verified token. Register and login are unchanged.

### Client session state

`AuthContext` exposes `{ status, user, login, register, logout, retrySession }`.

| `status` | `user` | Meaning |
| --- | --- | --- |
| `loading` | `null` | `/auth/me` is in flight |
| `authenticated` | public user | Signed in |
| `anonymous` | `null` | `/auth/me` returned 401, the user logged out, or a later request returned 401 |
| `error` | `null` | `/auth/me` failed with anything else: network failure or 5xx. The session is unknown, not absent |

- `login(body)` and `register(body)` post to the existing endpoints and set
  `authenticated` from `response.data.user`. Failures reject, so `useAuthForm` shows
  them as it does today.
- `logout()` posts to `/auth/logout`. A 204 or 401 ends in `anonymous` and resolves.
  Any other failure leaves the user signed in and rejects.
- `retrySession()` sets `loading` and reloads `/auth/me`.
- The startup effect aborts its request in cleanup, using `AbortController`, and
  ignores the cancellation, so `StrictMode`'s double run cannot leave a stale result.
- On a `pageshow` event with `persisted: true`, meaning the browser restored the page
  from its back-forward cache, the provider sets `loading` and reloads `/auth/me`. The
  restored page keeps its old session state otherwise, so Back after logout would show
  a signed-in page. `loading` hides the protected page until the answer arrives.

### 401 interceptor

- Registered in the provider's effect, before the session request, and ejected in
  cleanup. Protected pages cannot mount before `/auth/me` settles, so their requests
  always pick up the interceptor.
- On a 401 from any request except `POST /auth/login`, it sets `anonymous` and
  rejects the error unchanged. `ProtectedRoute` then performs the redirect.
- Login is exempt because a 401 there means wrong credentials, and the form must show
  that message.

### Guards

Both render `<Outlet />` when allowed, and both redirect with `replace`, so the Back
button does not bounce.

| `status` | `ProtectedRoute` | `PublicOnlyRoute` |
| --- | --- | --- |
| `loading` | `role="status"` text: "Checking your session..." | Same |
| `authenticated` | Page | `<Navigate to="/" replace />` |
| `anonymous` | `<Navigate to="/login" replace />` | Form |
| `error` | `role="alert"` text: "We couldn't check your session." with a "Try again" button calling `retrySession` | Form |

`PublicOnlyRoute` shows the form on `error` because logging in works as soon as the
server is back, and a success replaces the unknown state. `*` (404) sits outside both
guards and renders for everyone.

### `AccountNav`

| `status` | Renders in `<nav aria-label="Account">` |
| --- | --- |
| `loading` | Nothing, so neither set of controls flashes |
| `authenticated` | Username and a "Log out" button |
| `anonymous`, `error` | The existing "Log in" and "Register" links, unchanged |

- The username renders as React text only, never as HTML. It truncates with CSS at
  narrow widths and has a `title` with the full name. It is not a link.
- The button is `type="button"`, uses `aria-disabled` while pending, ignores repeat
  clicks, and reads "Logging out...". It has the same visible `focus-visible` ring as
  the form buttons.
- A failed logout shows "Could not log out. Please try again." in a `role="alert"`
  region styled `text-error` and hidden when empty. It clears when a new attempt
  starts. The user stays signed in and the button stays usable.
- `AccountNav` stays mounted across logout because `Layout` persists, so pending and
  error state must not survive the session. Otherwise the next sign-in shows
  "Logging out...". They live in a child component mounted only while signed in, which
  also clears a failed-logout message when the session ends through the interceptor.

## Testing

No test runner exists, so tests are not a gate. Lint and the client build are the
automated checks: `npm run lint` from the root and `npm run build` in `client/`.
Everything below is manual evidence, and `/check` should report only what it runs.
These rows need MongoDB and `server/.env`.

### Server (curl)

| Case | Expected |
| --- | --- |
| `GET /me`, no cookie | 401 `{ message: 'Not authenticated' }` |
| `GET /me`, garbage token | Same 401 |
| `GET /me`, token signed with another secret | Same 401 |
| `GET /me`, expired token | Same 401 |
| `GET /me`, cookie value `j:{"a":1}` | Same 401, not 500 |
| `GET /me`, valid cookie from register or login | 200 with `id`, `username`, `email` only |
| `GET /me`, valid token for a deleted user | Same 401 |
| `POST /logout`, no cookie | Same 401 |
| `POST /logout`, valid cookie | 204 and a clearing `Set-Cookie` |
| `POST /login`, wrong password | Existing 401 `Invalid email or password` |
| Any of these with Mongo errors or stack traces | None in the response body |

### Browser

| Case | Expected |
| --- | --- |
| Anonymous, open each protected route | Redirected to `/login`; Back does not return to the protected URL |
| Anonymous, open `/does-not-exist` | 404 page, "Log in" and "Register" in the navbar |
| Signed in, open `/login` or `/register` | Redirected to `/` |
| Signed in, reload a protected page | Stays on it, with no flash of the login form or the anonymous links |
| Log in or register successfully | Lands on `/`, navbar shows the username; Back does not return to the form |
| Log in with a wrong password | Stays on the form, shows the server message, no redirect |
| Server stopped, load a protected page | "We couldn't check your session." and "Try again"; not sent to `/login` |
| Restart the server, press "Try again" | Page loads if signed in, `/login` if not |
| Server stopped, load `/login` | Form renders; submitting shows the generic failure message |
| Log out from a protected page | Lands on `/login`, navbar shows the anonymous links; Back does not reveal the page |
| Full page loads of two protected pages, log out, Back | Page restored from the back-forward cache redirects to `/login` |
| Full page loads of two protected pages, Back while signed in | Restored page stays, still signed in |
| Log out from the 404 page | Stays on the 404 page with the anonymous links |
| Delete the cookie in devtools, then log out | 401 path: lands on `/login` with no error message |
| Server stopped, log out | Error message shows, still signed in; works after restart |
| Log out, then log in again | Button reads "Log out", with no stale pending or error text |
| 30-character username at 320px | Truncated, no horizontal page scroll, logout reachable |
| Keyboard | Logout reachable by Tab with a visible focus ring, activates with Enter and Space |

### Evidence from `/implement`

Evidence comes from a scratch harness outside the repo. It runs a separate copy of the
app: `server/src/index.js` on its own port against a throwaway MongoDB database, the
Vite dev server, and headless Chrome driven over the DevTools protocol.

- **Run and passing:** `npm run lint`, and `npm run build` in `client/`.
- **Run and passing against real MongoDB:** the whole server table.
- **Run and passing in Chrome:** the whole browser table, 56 of 56 harness checks
  including the server table, plus a focused back-forward cache repro, 17 of 17.
  Outages were real: the harness stopped and restarted its server.
- **Not run:** browsers other than Chrome, the production build in a browser, and
  screen readers.

## Notes for the AI

- Follow the project plan's `requireAuth` contract: set `req.userId`, no database
  lookup. The general line in `coding-standards.md` about middleware resolving the
  user is less specific, and a lookup on every request has no current consumer. `me`
  does its own lookup.
- Read the cookie as `req.cookies.token`, as the project plan writes it. Do not import
  from the controller into the middleware for the name.
- Keep one owner for each redirect: the guards. Neither `useAuthForm` nor `logout`
  should navigate.
- Keep the error `role="alert"` pattern from the forms: the region stays in the DOM and
  hides when empty, so screen readers announce changes.
- Show logout and session failures as fixed client text. Do not render server messages
  for them.
- Express 5 forwards thrown errors and rejected async handlers, so `me` needs no
  wrapper.
- Use the existing theme tokens. Match the button classes from the forms for focus and
  `aria-disabled` styling.
- Feature 2 ships logout unguarded, so today it returns 204 with no cookie. This
  feature deliberately changes that to 401, as the build plan says.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":15024,"specSha256":"40948addfe25d0a0f3c39435158dbdaa177e3bae83696b12357473c172394966","branch":"refs/heads/feature/session-protected-routes","head":"c006fbad1153db5df4b60a345813c0e095de06c9","baseRef":"refs/heads/main","baseCommit":"06fb9bfd1246a049d3c73e14fd5ff0ba34edd752","sourceTree":"22a1de090eeadf25fddcfb97b379bc9f5a526a98","landing":"local-merge","absentOptional":[]} -->

## Findings

No findings were resolved by this work item. F-01 and F-05 (open) and F-04 (unverified), all P3, stay in the live ledger.

## Independent review

# Independent Review

**Status:** passed
**Target commit:** c006fbad1153db5df4b60a345813c0e095de06c9
**Base commit:** 06fb9bfd1246a049d3c73e14fd5ff0ba34edd752
**Base ref:** origin/main
**Spec hash:** 40948addfe25d0a0f3c39435158dbdaa177e3bae83696b12357473c172394966
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-11-04T18:42:53.9511673+02:00
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-04T18:45:47+02:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `06fb9bfd1246a049d3c73e14fd5ff0ba34edd752..c006fbad1153db5df4b60a345813c0e095de06c9` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `npm run lint` (root, client then server): pass
- `npm run build` (client/): pass
- Test command: unavailable
- Typecheck command: unavailable
- Verify command: unavailable
- Browser tests command: unavailable

## Evidence

- Validated before review: HEAD equals the target, `origin/main` merge base equals the base, the SHA-256 of the raw spec bytes matches, and only review.md differed from the target.
- Read the whole code delta (15 files under client/ and server/) and the spec, plus the unchanged code it relies on: server/src/index.js, the User model, client/src/lib/api.js, Layout.jsx.
- Security: `requireAuth` fails closed for missing, malformed, tampered, expired and non-string tokens. The user id comes only from the verified token. `passwordHash` is `select: false` and `toPublicUser` omits it. Startup refuses a missing `JWT_SECRET`, and `errorHandler` returns a generic 500 body.
- Client state: compared AuthContext, the interceptor, both guards and AccountNav with the spec's tables. Every `/auth/me` reload hides the forms and logout while `loading`, so a stale result cannot race a login or logout through the UI.
- Performance: one `/auth/me` lookup per load or back-forward restore, plus one per retry. `requireAuth` makes no database call. Nothing unbounded was added.
- This review did not run the server, MongoDB or a browser. The spec's manual tables were reasoned through from code, not re-run.

## Findings

- F-05 [P3] open: new this pass, non-blocking
- F-04 [P3] unverified: re-examined, non-blocking
- F-01 [P3] open: already recorded, outside this delta, non-blocking

## Remaining risk

- No test command, typecheck, Verify command or Browser tests command exists, so nothing in the repo automatically covers `requireAuth`, the interceptor or the guards.
- The spec's 56/56 and 17/17 browser and server results come from a scratch harness outside the repo. They were not reproduced or inspected here.
- Not exercised at runtime by this review: the curl table, the browser table and the 320px layout. The spec also records other browsers, the production build in a browser and screen readers as not run.
- No dependency or vulnerability scan was run; no such command is declared.

## Try it now

Run or do:

With `npm run dev` running and MongoDB up, open http://localhost:5173/library while signed out.

Expected:

The URL changes to `/login` and the login form appears, with "Log in" and "Register" in the navbar. Pressing Back doesn't return you to `/library`.

This proves:

`ProtectedRoute` sends anonymous users to `/login` after `/auth/me` returns 401, using a replace redirect.
