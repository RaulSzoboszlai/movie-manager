# Coding Standards

> Your conventions. Tuned by `/onboard` to this project: a React + Vite client
> and an Express + Mongoose API, both plain JavaScript ESM. Edit anything that
> stops matching reality, and resolve the `> TODO` notes as real patterns land.

## JavaScript

- ES modules everywhere (`"type": "module"` in both packages); `import`, never
  `require`.
- No TypeScript in this project. Do not add `.ts` files or type annotations
  without an explicit decision to migrate.
- Prefer `const`, `async`/`await`, and early returns over nesting.
- Use JSDoc only where a shape is genuinely non-obvious (see Comments).

## React (client)

- React 19, functional components only, hooks for state and side effects.
- Keep components focused: one job per component. Extract reusable logic into
  custom hooks (`client/src/hooks/`).
- Routing with `react-router-dom` v7. Declare routes in one place rather than
  scattering them.
- Server calls go through `axios` behind a single configured instance, not
  ad-hoc `axios.get` calls spread across components.
- Vite dev server proxies `/api` to the Express server, so client code calls
  relative `/api/...` paths and never hardcodes `http://localhost:5000`.

## Express (server)

- Express 5. Route handlers stay thin: parse and validate input, call the
  model or a small service function, shape the response.
- Group by concern under `server/src/`: `routes/`, `controllers/`, `models/`,
  `middleware/`. Mount all routers under `/api`.
- Async handlers must not leak rejections. Wrap them or use a small async
  wrapper so errors reach the error middleware.
- One central error-handling middleware produces the client-facing error shape.
  Handlers throw or forward; they do not each invent their own format.
- Read configuration from `process.env` only at startup, never deep inside
  request handling.

## Data and persistence

- MongoDB through Mongoose 9. Schemas live in `server/src/models/`, one model
  per file, exported as the default.
- Define schema-level constraints (`required`, `unique`, `enum`, indexes) rather
  than relying on handler checks alone.
- Never store or return password hashes to clients. `bcryptjs` for hashing.

## Auth and ownership

- JWT (`jsonwebtoken`) carried in an httpOnly cookie via `cookie-parser`; auth
  middleware resolves the user and attaches it to the request.
- Scope every user-owned query by the authenticated user id from the verified
  token. Never trust a user id from the request body, query, or params.
- `cors` is configured against `CLIENT_URL` with credentials enabled; do not
  widen it to `*`.

## Validation and error handling

- Validate every request body, query, and param that crosses the API boundary,
  along with any TMDB response field the app depends on. Trust nothing from the
  client.
- Return a consistent JSON error shape with a correct HTTP status: 400 for bad
  input, 401 unauthenticated, 403 unauthorized, 404 missing, 409 conflict, 500
  for unexpected failures.
- Never leak stack traces, Mongo errors, or secrets in a response.
- On the client, surface a readable message and keep the UI in a usable state;
  do not swallow failures silently.

> TODO: no validation library is installed yet. If hand-written checks start to
> sprawl, pick one deliberately (a build-plan item) rather than mid-feature.

## File organization

- Client components: `client/src/components/[feature]/ComponentName.jsx`
- Client pages/routes: `client/src/pages/PageName.jsx`
- Client hooks: `client/src/hooks/useThing.js`
- Client API helpers: `client/src/lib/` (shared axios instance, formatters)
- Server: `server/src/routes|controllers|models|middleware/[feature].js`
- `server/src/index.js` wires middleware and mounts routers; it holds no
  business logic.

## Naming

- Components: PascalCase file and export (`MovieCard.jsx`)
- Other files: camelCase (`movieController.js`) or kebab-case, consistently
  within a folder
- Functions and variables: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Mongoose models: singular PascalCase (`Movie`, `User`)

## Styling

- Tailwind CSS v4 via `@tailwindcss/vite`. CSS-first config with `@theme` in
  `client/src/index.css`; there is no `tailwind.config.js` and none should be
  added.
- Tailwind utilities for all styling. No inline `style` props except for truly
  dynamic values.
- No component library is installed. Keep shared primitives as local
  components rather than reaching for a new dependency.

- The app is dark only, as described in Visual direction in
  `blueprint/project-plan.md`. There is no light mode or theme toggle in v1.

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.js`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding for this project: Vitest is the natural runner for both packages
(the client already builds on Vite). Use `vi.mock()` for external dependencies
such as Mongoose models or the TMDB client, and `vi.useFakeTimers()` for
time-dependent logic. Test files sit next to their source as `name.test.js`.
Nothing is installed yet; `/tests` sets it up and records the real command in
`AGENTS.md`.

## Browser Verification

For UI and integration behavior, prefer real browser evidence over reading the
code and assuming it works.

- Browser automation is separately opt-in through `/tests browser`. That setup
  reuses a compatible runner or prefers Playwright for supported projects, then
  documents the exact command as `Browser tests` in `AGENTS.md`.
- When `Browser tests` is declared, add focused coverage for stable behavioral
  done-whens when it is proportionate, and run the documented command during
  `/check`. Do not assume it proves visual fidelity, real authenticated-profile
  behavior, browser chrome, or another claim the test does not observe.
- If no Browser tests command is declared, do not add a runner silently in the
  middle of an unrelated feature. Use the available dev server, browser
  screenshots, build output, API output, or manual evidence instead.
- Browser tests are not part of the default Verify command or CI unless the user
  separately chooses that slower gate.
- Browser evidence is especially important for flows that click, type, submit,
  navigate, download files, render complex layouts, or depend on client-side
  state.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
