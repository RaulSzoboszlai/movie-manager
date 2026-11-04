# Feature: Register & login

**From build-plan:** feature 2
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/register-login`

## Goal

A visitor can create an account or log in through validated forms, and the server
responds by setting a 7-day JWT in an httpOnly cookie. Logout clears that cookie.
This feature creates the session cookie. Feature 3 is what reads it.

## Design reference

There is no form prototype (`prototypes/home.html` has no forms), so use Visual
direction in `blueprint/context/project-overview.md` through the existing tokens in
`client/src/index.css`:

- Form panel: `bg-surface`, `border-border`, `rounded-card`, centered and narrow
  (about `max-w-sm`), full width on small screens.
- Inputs: `bg-surface-raised`, `border-border-strong`, visible accent focus ring.
- Submit: `bg-accent text-accent-ink hover:bg-accent-hover`.
- Errors: `text-error`.
- Dark only, usable at 320px with no horizontal page scroll.

## In scope

- `User` Mongoose model.
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`.
- bcryptjs hashing at cost 10. JWT `{ sub: userId }` with 7-day expiry in the `token`
  cookie.
- `JWT_SECRET` added to the server's required startup variables.
- The shared Axios instance (`withCredentials: true`).
- Real Login and Register forms replacing the placeholder pages, with client-side
  validation, server error display, a pending state, and links between the two pages.
- On success, navigate to `/`.

## Out of scope

- `GET /auth/me`, `requireAuth`, `AuthContext`, `ProtectedRoute`, redirects for
  signed-in or anonymous users, the 401 interceptor (feature 3).
- Any logout button or navbar change (feature 3). Logout is API-only here, so after
  logging in the navbar still shows "Log in" and "Register", and `/` still shows
  its placeholder.
- Toasts and skeletons (feature 14).
- Password reset, OAuth, email verification (out of scope for v1).
- Rate limiting, account lockout, CSRF tokens. No plan establishes them; `sameSite: "lax"`
  is the planned cookie protection.
- A validation library, new dependencies, a test runner.

## Build loop

`workflow.stepReview` is `feature`: build all steps in order without stopping for
per-step approval, and keep the project working after each one. Review happens at
`/check` and `/audit current`. `workflow.checkpointCommits` is `disabled`: make no
commits during the build. `/complete` creates the final feature commit.

## Build steps

- [x] **1. User model and register endpoint.** Add `models/User.js`,
  `controllers/authController.js`, `routes/auth.js`. Mount at `/api/auth` before
  `notFound`, and add `JWT_SECRET` to the `missing` check in `index.js`.
  **Done when:** a valid register request returns 201 with the public user and a
  `Set-Cookie: token=...; HttpOnly; SameSite=Lax`; a repeat email or username returns
  409; each invalid body in the Testing table returns 400; a server started without
  `JWT_SECRET` exits with the existing missing-variables message; `npm run lint` passes.
- [x] **2. Login and logout endpoints.** **Done when:** correct credentials return 200
  with the public user and the cookie; wrong password and unknown email return the same
  401 body; a non-string email or password returns 400; logout returns 204 and an
  expiring `token` cookie; no response body contains `passwordHash`; `npm run lint`
  passes.
- [x] **3. Client plumbing and Register form.** Add `lib/api.js`,
  `lib/authValidation.js`, `hooks/useAuthForm.js`, `components/auth/FormField.jsx`, and
  build `RegisterPage`. **Done when:** in the browser, an empty submit shows per-field
  errors and focuses the first invalid field; editing a field clears its error; a taken
  email shows the server message in the form alert; a valid submit lands on `/` with the
  `token` cookie set and not readable from `document.cookie`; lint and build pass.
- [x] **4. Login form.** Build `LoginPage` on the same hook and field. **Done when:** in
  the browser, wrong credentials show "Invalid email or password" and leave the inputs
  usable; correct credentials land on `/`; with the API stopped, submitting shows the
  fallback message and the form recovers; both pages link to each other; no horizontal
  scroll at 320px; `npm run lint` at the root and `npm run build` in `client/` pass.

## Files / areas

Server:

- `server/src/models/User.js` (new)
- `server/src/controllers/authController.js` (new)
- `server/src/routes/auth.js` (new)
- `server/src/index.js` (mount router, require `JWT_SECRET`)

Client:

- `client/src/lib/api.js` (new) - the one Axios instance
- `client/src/lib/authValidation.js` (new) - pure field validators
- `client/src/hooks/useAuthForm.js` (new) - values, errors, pending, submit, for both forms
- `client/src/components/auth/FormField.jsx` (new) - label, input, hint, error wiring
- `client/src/pages/LoginPage.jsx`, `client/src/pages/RegisterPage.jsx` (replace placeholders)

`App.jsx` already routes both pages, and `Layout` already wraps them, so no route changes.

## Data / contracts

### User model

| Field | Definition |
| --- | --- |
| `username` | String, required, unique, `trim` |
| `email` | String, required, unique, `lowercase`, `trim` |
| `passwordHash` | String, required, `select: false` |
| `createdAt` | `timestamps: { createdAt: true, updatedAt: false }` |

### Field rules (proposed, see Open questions)

The server enforces these. The client mirrors them for fast feedback.

| Field | Rule | Message on failure |
| --- | --- | --- |
| `username` | String; after trimming, matches `^[A-Za-z0-9_-]{3,30}$` | `Username must be 3-30 letters, numbers, hyphens or underscores` |
| `email` | String; after trimming and lowercasing, at most 254 characters and matches `^[^\s@]+@[^\s@]+\.[^\s@]+$` | `Enter a valid email address` |
| `password` (register) | String, at least 8 characters, at most 72 bytes (`Buffer.byteLength`). Never trimmed. | `Password must be at least 8 characters` / `Password is too long` |

The 72-byte cap exists because bcrypt ignores bytes past 72, which would silently make
the rest of a longer password meaningless.

### Endpoints

All errors use the existing `{ message }` shape through `errorHandler`. Throw an `Error`
carrying `status`. Express 5 forwards rejected async handlers, so no wrapper is needed.
Read `req.body ?? {}`, because Express 5 leaves `req.body` undefined when no JSON body is
sent, and pick only the named fields.

**`POST /api/auth/register`** `{ username, email, password }`

- 201 `{ user: { id, username, email } }`, cookie set. `id` is the ObjectId as a string.
- 400 `{ message }`, the first failing rule in the order username, email, password.
- 409 `{ message }` from the unique index, not a pre-check, so concurrent requests are
  covered. Catch `err.code === 11000` and read `err.keyPattern`:
  `An account with that email already exists` or `That username is taken`.

**`POST /api/auth/login`** `{ email, password }`

- 200 `{ user: { id, username, email } }`, cookie set.
- 400 `Email and password are required` when either is missing, empty, or not a string.
  This check also stops query-operator objects such as `{ "$ne": null }` reaching Mongo.
- 401 `Invalid email or password`, identical for an unknown email and a wrong password.
- Normalize the email (trim, lowercase) before lookup and use `.select('+passwordHash')`.

**`POST /api/auth/logout`**

- 204 with no body. Clears `token` using the same options it was set with.
- The overview marks this route as authenticated, but `requireAuth` does not exist until
  feature 3. Here it clears the cookie unconditionally, which only ever affects the
  caller's own cookie. **Feature 3 must add `requireAuth` to this route.**

### Token and cookie

- `jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' })`
- Cookie `token`: `httpOnly: true`, `sameSite: 'lax'`, `secure: NODE_ENV === 'production'`,
  `path: '/'`, `maxAge` 7 days in milliseconds.
- Read `JWT_SECRET` and `NODE_ENV` once at module level, not inside a handler.
- The public user comes from one small mapping function, so `passwordHash` cannot leak
  from the document returned by `create()`, where `select: false` does not apply.

### Client form behavior

- `lib/api.js`: `axios.create({ baseURL: '/api', withCredentials: true })`.
- `noValidate` on the form, so all feedback goes through one path.
- Client validation runs on submit. Each invalid input gets `aria-invalid` and an
  `aria-describedby` pointing to its error text, and focus moves to the first invalid
  field. Editing a field clears that field's error and the form alert.
- Server errors appear in one form-level `role="alert"` element, rendered as plain text by
  React. Use `response.data.message` for a 4xx response. Anything else (5xx, or no response,
  including Vite's empty proxy error) shows `Something went wrong. Please try again.`
- Pending: the submit button gets `aria-disabled` and changed text, and the handler ignores
  repeat submits. `aria-disabled` rather than `disabled`, so keyboard focus is not lost when
  an error comes back.
- Autocomplete: `username`, `email`, `new-password` on register; `email`, `current-password`
  on login. Inputs use `type="email"` and `type="password"`.
- The register password field shows a visible hint, `At least 8 characters`, also linked with
  `aria-describedby`.
- Success: `navigate('/', { replace: true })`.

## Testing

No test command is declared in `AGENTS.md`, so tests are not a gate and none are added. There
is no Verify command or Browser tests command. Evidence comes from lint, build, API requests,
and manual browser checks.

Run API checks against a disposable database, not the dev data: start the server with
`MONGO_URI=mongodb://127.0.0.1:27017/movie-manager-f2-check`, and report that database by name
so the user can decide on removing it.

| Request | Expected |
| --- | --- |
| Register, valid | 201, public user, `HttpOnly; SameSite=Lax` cookie, no `passwordHash` |
| Register, no body at all | 400, not 500 |
| Register, `username` is `"ab"` or contains a space | 400 |
| Register, `email` is `{ "$ne": null }` | 400 |
| Register, 7-character password / 73-byte password | 400 / 400 |
| Register, duplicate email differing only in case | 409, email message |
| Register, duplicate username | 409, username message |
| Two concurrent registers with the same email | one 201, one 409 |
| Login, correct / wrong password / unknown email | 200 / 401 / identical 401 |
| Login, `password` is an object | 400 |
| Logout | 204, cookie expired |
| Malformed JSON body | 400 JSON `{ message }` |

Also confirm in Mongo that `passwordHash` starts with `$2` and has cost `10`, that the stored
email is lowercase, and that the token decodes to `sub` plus a 7-day `exp`.

Browser checks are the Done-when items in steps 3 and 4. Use the available browser, and if
none is available, say so in the evidence instead of claiming a pass.

## Notes for the AI

- Hard constraints: no `dotenv`, `nodemon`, ESLint, validation library, or Tailwind config
  file. All packages needed here are already installed.
- Import with `import bcrypt from 'bcryptjs'` and `import jwt from 'jsonwebtoken'`.
- Hash with `bcrypt.hash(password, 10)`, the async form, so requests do not block the event loop.
- Keep the Register and Login JSX in their pages. The hook takes the initial values, a validate
  function, and the API call. Do not build a generic form framework.
- Do not add a pre-check query for duplicates. The unique index is the one source of truth.
- Do not touch `Navbar.jsx`. Do not add the redirects from feature 3, even though the page
  looks unfinished after login.
- The login route applies no password-policy rules, only the string and non-empty check. That
  keeps the policy free to change later without locking anyone out.
- No em dashes in code, comments, or docs.

## Evidence

- `npm run lint` at the root and `npm run build` in `client/` exit 0.
- Server started without `JWT_SECRET`: prints the missing-variables message and exits 1.
- API table above: all checks pass against a temporary `node src/index.js` on port 5055 using
  the `movie-manager-f2-check` database.
- Mongo: hash prefix `$2b$10$`, lowercase stored email, unique indexes on `username` and `email`.
- Browser Done-when items in steps 3 and 4: observed by /check in real headless Chrome, driven over
  the DevTools protocol against an isolated API and Vite with the `movie-manager-f2-browser` database.
  38 of 38 checks passed, with screenshots reviewed in the first passing run. The user also tested in
  their own browser and reported it fine.
- Not exercised: browsers other than Chrome, screen readers, and the production `secure` cookie.

## Open questions

Resolved: `/implement` was run with no changes requested, which accepted the values below. They are now recorded in Auth design in `blueprint/project-plan.md`.


1. **Login identifier.** The User model has both username and email, and the plans only say
   "verify password". Proposed: **email only**.
2. **Username rules and case.** Proposed: **3-30 letters, numbers, hyphens or underscores,
   case-sensitive**. `Raul` and `raul` would be different accounts, matching the model, where
   only `email` is marked lowercase.
3. **Password minimum.** Proposed: **8 characters**, with no composition rules.


<!-- blueprint:completion {"schemaVersion":2,"specBytes":13344,"specSha256":"fd81719fac2bf47a607d540a5b16c444f562912723992f238b05e7f7488c8d9f","branch":"refs/heads/feature/register-login","head":"c06d7d25937cfc0d6dd993333be5314c736bb5d7","baseRef":"refs/heads/main","baseCommit":"6fe1109e863b321d02f89598965dcd80b8e27341","sourceTree":"5d6252727df88e75e9d5fa56009fa46b3701e4ee","landing":"local-merge","absentOptional":[]} -->

## Findings

### 2/F-02 [P3] closed - Coding standards TODO describes starter files this feature removed

**File:** blueprint/context/coding-standards.md:102
**Found:** 2026-11-04 by /audit independent (scope: current; lens: quality)
**Why it matters:** The TODO says the scaffold still ships client/src/App.css and the Vite starter markup, and that dark/light handling is undecided. This feature deleted both and the spec records that there is no theme toggle, so the standards file now misstates the code.
**Suggested fix:** Remove the TODO. No current requirement would be lost.
**Resolution:** Commit 6fe1109 replaced the TODO with the dark-only standard. Re-examined by /audit on 2026-11-04 (scope: current): coding-standards.md now has no such TODO and the replacement text matches the code.

### 2/F-03 [P3] closed - Logout guard requirement is recorded only in the spec that /complete archives

**File:** server/src/routes/auth.js:8
**Found:** 2026-11-04 by /audit (scope: current; lens: security)
**Why it matters:** The overview marks `POST /auth/logout` as authenticated, but this feature ships it unguarded on purpose because `requireAuth` arrives in feature 3. The instruction to add the guard exists only in current-feature.md, and feature 3's build-plan entry does not mention it, so it can be missed after /complete resets that file. Until then another site can clear a user's session: a form-encoded POST with a foreign Origin returned 204 with an expiring `token` cookie (observed with curl; the browser's handling of a cross-site form post was not run). The impact is a forced logout only, with no data access. `requireAuth` would close it, because the SameSite=Lax cookie is not sent on a cross-site POST.
**Suggested fix:** Add "put `requireAuth` on `POST /auth/logout`" to feature 3 in build-plan.md, which is user-owned, before completing this feature. Feature 3 should also decide what an expired session sees, since a guarded logout returns 401 and leaves the expired cookie in place.
**Resolution:** At the user's request, build-plan.md feature 3 now says to put `requireAuth` on `POST /auth/logout`. The route itself stays unguarded until feature 3. Re-examined by /audit independent on 2026-11-04 (scope: current; all lenses) at c06d7d25937cfc0d6dd993333be5314c736bb5d7: build-plan.md:16 and project-overview.md:41 now carry the requirement, so it survives /complete, and the overview source-hash recomputes correctly over the edited plans. server/src/routes/auth.js:8 is unguarded as the spec states. The cross-site forced logout remains until feature 3 by design.

## Independent review

# Independent Review

**Status:** passed
**Target commit:** c06d7d25937cfc0d6dd993333be5314c736bb5d7
**Base commit:** 6fe1109e863b321d02f89598965dcd80b8e27341
**Base ref:** main
**Spec hash:** fd81719fac2bf47a607d540a5b16c444f562912723992f238b05e7f7488c8d9f
**Prepared by:** claude
**Builder model:** claude-opus-5-5
**Requested reviewer:** claude
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-11-04T17:38:47+02:00
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** claude
**Reviewer model:** claude-opus-5-5
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-11-04T17:42:15+02:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Handoff

Review the active spec and the complete `6fe1109e863b321d02f89598965dcd80b8e27341..c06d7d25937cfc0d6dd993333be5314c736bb5d7` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

## Commands

- `git rev-parse HEAD`, `git merge-base main <target>`, `sha256sum blueprint/context/current-feature.md`, `git status --porcelain=v1 --untracked-files=all`: pass, all match the request; only review.md differed
- `npm run lint` (root): pass, exit 0 for client and server
- `npm run build` in client/: pass, exit 0, 98 modules; output is the ignored client/dist
- `node <scratchpad>/auth-probe.mjs` (real auth controllers in-process, stubbed User model, fake res, no listener or database): pass, 27 of 27
- Test command: unavailable, no runner configured
- Typecheck command: unavailable, plain JavaScript project
- Verify command: unavailable, not configured
- Browser tests command: unavailable, not configured
- `/check`: not run, not required by the request

## Evidence

- Delta reviewed: all 15 changed paths in 6fe1109e863b321d02f89598965dcd80b8e27341..c06d7d25937cfc0d6dd993333be5314c736bb5d7, read against the active spec and coding standards
- Register: 400 for no body, array body, bad username, operator-object email, 255-character email, 7-character password, object password, 73-byte password and a 37-character 74-byte password; 201 returns only id, username and email; stored email is lowercase; hash prefix shows cost 10
- Duplicates: 409 messages follow err.keyPattern for email and username (simulated code 11000, not a real index); other create errors propagate to errorHandler
- Login: 200 with +passwordHash selected and no hash in the body; identical 401 for wrong password and unknown email; 400 for missing, empty, whitespace-only or object fields, so no operator object reaches the query
- Token and cookie: sub plus exactly 7 days; httpOnly, sameSite lax, path /, maxAge 604800000, secure false outside production; logout returns 204 and clears token with the same options and no maxAge (installed Express 5.3.0 forces expiry in clearCookie)
- Cross-site writes: register and login need a JSON body, which a cross-site page cannot send without a preflight that index.js:20-23 refuses; only logout accepts a bodyless POST (F-03)
- Performance: email regex is length-capped first, and a worst-case 254-character input took about 1 ms; bcrypt uses the async form at cost 10; login reads by unique email; a 100 KB login password is cheap to compare because bcrypt truncates it
- Client: useAuthForm, FormField and both pages match the spec for noValidate, focus on first invalid field, aria wiring, aria-disabled pending state, repeat-submit guard, 4xx message versus fallback, and replace navigation; every design token used exists in client/src/index.css; these were read, not run in a browser
- Plans: the project-overview source-hash recomputes to the recorded value under the overview skill's algorithm; no em dash, en dash or ellipsis in any added line of the delta
- Tests lens: no test files, no skipped or focused tests; server/package.json holds only the placeholder test script

## Findings

- No new findings
- F-03 [P3] closed this pass: the logout guard requirement now lives in build-plan.md:16 and project-overview.md:41
- F-01 [P3] open, carried forward and unchanged: client/README.md is outside this delta and still the Vite template
- F-04 [P3] unverified, carried forward and unchanged: no screen reader was available

## Remaining risk

- Test, typecheck, Verify and Browser tests commands are unavailable, so the duplicated client and server validation rules have no automated guard against drift
- No live MongoDB or server in this pass: real unique-index behavior, the concurrent-register race and malformed-JSON handling through the running app were not observed here; only the builder's recorded evidence covers them
- Browser behavior was read, not run: focus, cookie invisibility to document.cookie, and 320px layout rest on the spec's recorded /check evidence
- Not exercised by anyone: screen readers, browsers other than Chrome, and the production secure cookie
- server/.env was not read, so whether its JWT_SECRET still holds the committed .env.example placeholder is unknown; the startup check only tests that a value is present
- No dependency vulnerability scan was run; none is declared and network tools were out of bounds
- POST /api/auth/logout stays unguarded until feature 3, allowing a cross-site forced logout with no data access; feature 3 should also decide what an expired or invalid session sees, which the plans do not yet record
- Accepted by the spec and not findings: no rate limiting or lockout, and login skips bcrypt for an unknown email, a timing difference that reveals little because register's 409 already discloses taken emails

## Try it now

Run or do:

With `npm run dev` running, open http://localhost:5173/login, enter the email `nobody@example.com` and the password `wrong-password`, then select **Log in**.

Expected:

Red text above the form reads "Invalid email or password". You stay on `/login`, and both fields keep their values and can still be edited.

This proves:

The login form reaches the auth API through the Vite proxy and shows its 401 message as a form error.
