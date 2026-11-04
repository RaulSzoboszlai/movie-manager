# Feature: App shell

**From build-plan:** feature 1
**Build attempt:** 1
**Status:** not started
**Branch:** `feature/app-shell`

## Goal

Replace the Vite and Express starters with a working foundation: an API that connects to MongoDB, reports health and returns errors in one JSON shape, and a routed client in the chosen dark theme with a navbar, a TMDB attribution footer, a placeholder page for every planned route and a 404 page. Every later feature builds on this.

## Design reference

- [prototypes/home.html](../../prototypes/home.html) is the reference for the page background, navbar and footer. Its Top 10 row and movie cards belong to feature 4.
- [prototypes/theme.css](../../prototypes/theme.css) holds the source values. Visual direction in the project plan is the lasting record.

## In scope

- The theme: tokens in `@theme` in `client/src/index.css`, and Inter loaded in `client/index.html`.
- Express server: `GET /api/health`, MongoDB connection through Mongoose, CORS, cookie-parser, JSON 404 and a central error handler.
- A clear startup failure when required configuration is missing, MongoDB is unreachable or the port is taken.
- React Router with a shared layout: navbar, main area, footer with the TMDB attribution notice.
- A placeholder page for every route in the project plan, plus a 404 page.
- Removing the Vite starter markup and assets, and setting the page title to Movie Manager.

## Out of scope

- User model, auth endpoints and forms (feature 2).
- `requireAuth`, `AuthContext`, `ProtectedRoute`, redirects, and username or logout in the navbar (feature 3). All routes are reachable without login until then.
- The shared Axios instance and any client call to the API (first needed by feature 2).
- TMDB calls, `services/tmdb.js`, `MovieCard`, the Top 10 row and its rank numbers (feature 4).
- Deleting `prototypes/`, which feature 4 does when it completes. `/complete` for this feature must keep it.
- Mobile menu, skeletons, toasts and the keyboard accessibility pass (feature 14).
- Production hosting, SPA rewrites and serving the client from Express (feature 15).
- Test runner, `Verify` command and CI.

## Build loop

`workflow.stepReview` is `feature`, so build all steps and produce one review packet at the end. `workflow.checkpointCommits` is `disabled`, so offer no checkpoint commits. `/complete` makes the final feature commit. Split any diff too large to review.

## Build steps

- [ ] **Step 1 - Theme** - Replace `client/src/index.css` with the Tailwind import, the `@theme` block in the contract below, and a base rule giving `body` the page background, text color and font. Add the Inter stylesheet links to `client/index.html`. *Done when:* the running client shows the dark page background and Inter text, utilities such as `bg-surface` and `text-accent` apply the listed colors, and `npm run build` in `client/` passes with no Tailwind or PostCSS config file added.
- [ ] **Step 2 - Server startup and health** - In `server/src/index.js`: check required environment variables, connect to MongoDB before listening, mount `cors`, `express.json` and `cookie-parser`, and add `GET /api/health`. Handle the error argument of the `app.listen` callback. *Done when:* with MongoDB running, `npm run dev` in `server/` logs the connection and the port, and `curl http://localhost:5000/api/health` returns 200 with `{"status":"ok"}`. With `MONGO_URI` or `CLIENT_URL` unset, the process exits 1 and names the missing variable. With an unreachable `MONGO_URI`, it exits 1 without listening. With port 5000 already in use, it exits 1 with an error rather than logging that it is running. A request with `Origin: http://localhost:5173` gets `Access-Control-Allow-Origin` for that origin and `Access-Control-Allow-Credentials: true`; another origin gets neither header.
- [ ] **Step 3 - JSON 404 and central error handler** - Add `server/src/middleware/errorHandler.js` and mount a catch-all 404 and the handler after all routes. *Done when:* `GET /api/nope` returns 404 with `{"message":"Not found"}`. `POST /api/health` with a malformed JSON body returns 400 with a JSON `{ message }`. Calling the handler from a short `node -e` script with a fake `res` and an error carrying internal text gives status 500 and `{"message":"Internal server error"}`, and that text does not appear in the response. No real route can throw yet, so this direct call is the evidence for the 500 path.
- [ ] **Step 4 - Routes and pages** - Remove the starter from `App.jsx`, wrap the app in `BrowserRouter` in `main.jsx`, declare all routes in `App.jsx`, and add one page file per route under `client/src/pages/`. Delete the starter files listed below and set the title in `client/index.html`. *Done when:* every route in the contract table renders its own heading in the browser, including `/movie/123` and `/lists/abc`; an unknown path such as `/nope` renders the 404 page with a working link home; no starter content remains; `npm run build` in `client/` passes.
- [ ] **Step 5 - Layout, navbar and footer** - Add `client/src/components/layout/` with `Layout`, `Navbar` and `Footer`, and render every route inside `Layout` through `<Outlet />`. *Done when:* navbar and footer appear on every page including 404 and match the reference: two-tone logo, active link in the accent color on the soft tint, and surface-colored bars with a border; navbar links navigate without a full page reload; the footer shows the exact TMDB notice; the layout has no horizontal scroll at 320px wide; root `npm run dev` starts both halves; `curl http://localhost:5173/api/health` returns the health JSON through the Vite proxy; root `npm run lint` and the client build pass.

## Files / areas

Server:

- Change `server/src/index.js`
- Add `server/src/middleware/errorHandler.js`

Client:

- Change `client/src/index.css`, `client/src/main.jsx`, `client/src/App.jsx`, `client/index.html`
- Add `client/src/components/layout/Layout.jsx`, `Navbar.jsx`, `Footer.jsx`
- Add `client/src/pages/` files: `LoginPage.jsx`, `RegisterPage.jsx`, `HomePage.jsx`, `SearchPage.jsx`, `MovieDetailsPage.jsx`, `LibraryPage.jsx`, `ListsPage.jsx`, `ListDetailsPage.jsx`, `ProfilePage.jsx`, `NotFoundPage.jsx`
- Delete `client/src/App.css`, `client/src/assets/hero.png`, `client/src/assets/react.svg`, `client/src/assets/vite.svg`, `client/public/icons.svg`. A repository search shows only the starter `App.jsx` references these. Keep `client/public/favicon.svg`, which `client/index.html` uses.

## Data / contracts

No models or stored data yet. Feature 2 adds the first model.

**Theme** - in `client/src/index.css`, after `@import "tailwindcss";`. Tailwind only generates utilities from its own namespaces, so the prototype's names change as shown:

```css
@theme {
  --color-bg: #080b12;
  --color-surface: #111622;
  --color-surface-raised: #1a2130;
  --color-border: #262e3f;
  --color-border-strong: #43506a;
  --color-text: #f1f4f9;
  --color-muted: #a4aec2;
  --color-accent: #4da3ff;
  --color-accent-hover: #7dbcff;
  --color-accent-ink: #06121f;
  --color-accent-soft: rgba(77, 163, 255, 0.16);
  --color-star-on: #f5b301;
  --color-star-off: #56607a;
  --color-watched: #5fd39a;
  --color-watched-soft: rgba(95, 211, 154, 0.14);
  --color-error: #ff6b6b;
  --font-sans: "Inter", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  --radius-card: 10px;
}
```

Use Tailwind's default spacing, text sizes, font weights and `rounded-md` for controls. Do not port the mockup-only `--poster-*` gradients. The shadow, poster width and rank number values wait for feature 4.

**Font** - load Inter with weights 400, 500, 700 and 900 from Google Fonts using `<link>` tags in `client/index.html`, as the mockup does. No font package.

**`GET /api/health`** - public. Returns 200 with `{ "status": "ok" }`. This is a liveness check: it does not query MongoDB. MongoDB is only known to have connected at startup, because the server does not listen until then.

**Error shape** - every API error is JSON `{ "message": string }`.

| Case | Status | Message |
| --- | --- | --- |
| No route matched | 404 | `Not found` |
| Error with an integer `status` or `statusCode` from 400 to 499 | that status | the error's `message` |
| Anything else | 500 | `Internal server error` |

The original error is logged on the server only for the 500 case. Responses contain no stack traces, Mongo errors or secrets. If headers were already sent, the handler delegates to `next(err)`.

**Required environment** - `MONGO_URI` and `CLIENT_URL` are checked at startup, and `PORT` defaults to 5000. `JWT_SECRET` and `TMDB_API_KEY` are not checked yet because nothing reads them until features 2 and 4. Startup messages name missing variables and never print values.

**CORS** - `cors({ origin: process.env.CLIENT_URL, credentials: true })`, never `*`. `CLIENT_URL` must be required because `cors` falls back to allowing every origin when `origin` is undefined.

**Middleware order** - `cors`, `express.json`, `cookie-parser`, routes, 404, error handler.

**Client routes** - these URL shapes are the project plan's and must not change:

| Route | Page file | Heading |
| --- | --- | --- |
| `/login` | `LoginPage.jsx` | Log in |
| `/register` | `RegisterPage.jsx` | Register |
| `/` | `HomePage.jsx` | Top 10 trending |
| `/search` | `SearchPage.jsx` | Search |
| `/movie/:tmdbId` | `MovieDetailsPage.jsx` | Movie details |
| `/library` | `LibraryPage.jsx` | My library |
| `/lists` | `ListsPage.jsx` | My lists |
| `/lists/:id` | `ListDetailsPage.jsx` | List details |
| `/profile` | `ProfilePage.jsx` | Profile |
| `*` | `NotFoundPage.jsx` | Page not found |

**Navbar links** - Home, Search, Library, Lists, Profile on the left. Log in and Register on the right, in the position of the reference's username and logout button. Feature 3 replaces them with auth-aware controls.

**Footer notice** - exact text: `This product uses the TMDB API but is not endorsed or certified by TMDB.`, with a link to `https://www.themoviedb.org/`.

## Testing

No test runner or `Verify` command is configured, so tests are not a gate. The evidence is:

- Root `npm run lint` and `npm run build` in `client/`.
- `curl` output for each server done-when in steps 2 and 3, using a running local MongoDB. `mongod` is installed, but whether it is running must be confirmed at build time. If it is not, report that rather than claiming the connected path passed.
- Browser evidence for steps 1, 4 and 5: each route, the 404 page, client-side navigation, and the 320px width.
- `cookie-parser` has no observable behavior until feature 2 reads a cookie, so its mounting is verified by review only.

## Notes for the AI

- Express 5 forwards rejected promises from async handlers to the error middleware, so add no async wrapper, even though `coding-standards.md` mentions one as an option.
- Express 5 passes listen errors such as `EADDRINUSE` to the `app.listen` callback. The current callback ignores its argument and would log that the server is running when it is not, so it must check the error.
- `npm start` does not load `server/.env`, and `dotenv` must not be added. The missing-variable message should say to use `npm run dev` or set the variables in the environment. Do not change the `start` script.
- Keep the health route inline in `index.js`. There is nothing yet to justify a router or controller, and feature 2 introduces the `routes/` and `controllers/` pattern.
- Do not add `tailwind.config.js`, `postcss.config.js`, `dotenv`, `nodemon`, ESLint, or any new dependency. Everything this feature needs is already installed.
- Style with Tailwind utilities and the theme tokens only, with no hardcoded colors in components. There is no theme toggle; it is listed under "Later".
- Mobile-first: on narrow screens the logo and account area share the first row and the links wrap below them, as in the reference. The mobile menu is feature 14.
- Use semantic landmarks (`header`, `nav` with an `aria-label`, `main`, `footer`) and `NavLink`, which sets `aria-current` on the active link. Use `end` on the Home link so it is not active on every route.
- Each page has one `h1` and a short placeholder line. Placeholder pages fetch no data, so the loading, empty and error states required for data views start with the features that add those views. Do not render route params in placeholders.
- Client code must not hardcode `http://localhost:5000`.
- Never read or print the values in `server/.env`.
