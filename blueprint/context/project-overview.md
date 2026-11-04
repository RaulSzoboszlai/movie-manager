# Movie Manager - Project Overview

<!-- blueprint:source-hash 145996a8da421f7a300c1f9c75ee5c5cc17f5e1d8b8d55fcb59d059356519966 -->

> A private movie tracker: search TMDB, keep a watchlist, rate what you watched,
> and organise films into your own lists.

## Problem

Movies people mean to watch get scattered across screenshots, notes and memory,
so they are lost by the time there is time to watch something. People also forget
what they thought of the films they did watch. Movie Manager keeps both halves,
the queue and the verdict, in one private place per user.

## Users

Individual movie fans, one account each. There are no shared or team accounts.

| Tier | Access |
| --- | --- |
| Anonymous | `/login` and `/register` only. Everything else redirects to `/login`. |
| Signed in | Every movie, library, list and profile feature; sees only their own data. |

Each user's data is private to their account: every library, list and profile
query is scoped by the authenticated user id, never by a client-supplied id.
This is a learning project, so scope stays small and the code stays easy to
follow. Nothing in the plans establishes multi-tenant, compliance, availability
or audit requirements, and none should be inferred.

## Features

In `build-plan.md` order. One Blueprint feature loop each.

**Phase 1 - Foundation**

1. **App shell** - Express with `/api/health`, Mongo connection, central error
   handler, CORS and cookie-parser; React Router layout (navbar, footer with TMDB
   attribution, placeholder pages, 404).
2. **Register & login** - User model, register/login/logout endpoints, bcryptjs
   hashing, JWT in an httpOnly cookie, and the two forms with validation.
3. **Session & protected routes** - `GET /auth/me`, `requireAuth` (also added to
   `POST /auth/logout`, which feature 2 ships unguarded), `AuthContext`,
   `ProtectedRoute`, two-way redirects, username and logout in the navbar.

**Phase 2 - Discover**

4. **TMDB service + Top 10 trending** - `services/tmdb.js` wrapper including the
   cached genre list (id to name), plus `GET /movies/trending`; home page shows 10
   `MovieCard`s in one sideways-scrolling row with rank numbers behind the posters.
   This is the headline feature: the app's front door. `prototypes/` is deleted
   when this feature completes.
5. **Search** - `GET /movies/search`, debounced input, results grid, Load more
   pagination, query kept in the URL.
6. **Search filters** - `GET /movies/genres` served from the cached genre list,
   plus genre and year selects, with the search-vs-discover split below.
7. **Movie details page** - `GET /movies/:tmdbId` with
   `append_to_response=credits,videos`; backdrop, overview, cast row, YouTube
   trailer embed.
8. **Similar movies** - `GET /movies/:tmdbId/similar` behind a "You might also
   like" row.

**Phase 3 - My library**

9. **Watchlist** - SavedMovie model with a snapshot that includes `genreIds[]`;
   add and remove from any card or the details page; saved state reflected on
   cards and details; library *Want to watch* tab.
10. **Watched & rating** - `PATCH /library/:tmdbId` to mark watched (records
    `watchedAt`) and to set or clear a rating; star component enabled only once
    watched; *Watched* tab.

**Phase 4 - Lists & profile**

11. **Custom lists** - List model and CRUD, lists page, list detail page with
    rename.
12. **Add to list** - "Add to list" menu on cards and details, plus removal.
13. **Profile stats** - `GET /profile/stats` via a Mongo aggregation; top genres
    counted by `genreIds` then named from the cached genre list; stat cards and
    rating distribution.

**Phase 5 - Polish**

14. **UX polish** - loading skeletons, empty states, toasts, responsive navbar,
    keyboard accessibility pass.
15. **Release prep** (optional) - production cookie settings, environment check,
    deploy through `/release`.

Explicitly out of scope for v1: social features (following, public or shared
lists, comments), written reviews, password reset by email, OAuth, TV shows, and
an admin panel. The build plan's "Later (not V1)" backlog is a parking lot, not
committed scope.

## Decisions settled for v1

Recorded so they are not reopened mid-build.

- **No separate favorites flag.** The watchlist covers it; no heart icon. A
  favorites toggle sits under "Later".
- **Ratings are 1-5 whole stars.** Half stars sit under "Later".
- **Genres are snapshotted as TMDB ids**, resolved to names through the cached
  genre list.

## Data model

MongoDB via Mongoose. Three collections. SavedMovie and List store a small
snapshot of each movie so library and list pages render without calling TMDB per
item; TMDB stays the source of truth for everything else and is never mirrored
wholesale.

### User

- `username` (String, unique, required)
- `email` (String, unique, lowercase, required)
- `passwordHash` (String, required) - bcryptjs, cost 10; never returned by the API
- `createdAt` (Date)

### SavedMovie

One document per user and movie. This is the library.

- `user` (ObjectId, ref `User`, required)
- `tmdbId` (Number, required)
- `title` (String) - snapshot
- `posterPath` (String) - snapshot
- `releaseYear` (Number) - snapshot
- `genreIds` (Array of Number) - snapshot of TMDB genre ids; feeds profile stats
- `status` (String enum `"want" | "watched"`, required)
- `rating` (Number 1-5 or null) - allowed only when `status` is `"watched"`
- `watchedAt` (Date) - set when status becomes `"watched"`
- `createdAt`, `updatedAt` (Date)
- Unique compound index on `{ user, tmdbId }` - one row per user per film

### List

- `user` (ObjectId, ref `User`, required)
- `name` (String, required)
- `description` (String)
- `movies` (Array of `{ tmdbId, title, posterPath, addedAt }`) - embedded snapshots
- `createdAt`, `updatedAt` (Date)
- Unique compound index on `{ user, name }`

> Locked shapes. Feature 9 depends on the SavedMovie index and the
> `status`/`rating` pairing; feature 10 on `watchedAt` and the 1-5 rating;
> feature 13 aggregates over `status`, `rating` and `genreIds`; feature 12 on the
> embedded `List.movies` item shape. Changing any of these later means a
> migration, so settle them in features 9 and 11.

List membership is independent of library status: a movie can sit in several
lists and also be `watched`.

### Genre ids, not names

TMDB's trending, search, discover and similar payloads carry only `genre_ids`;
only the details endpoint returns full `{ id, name }` objects. Storing ids lets a
movie be saved from any card without a second TMDB call.

- **Resolution:** `services/tmdb.js` fetches `/genre/movie/list` once and caches
  the id-to-name map in memory (feature 4).
- **Consumers:** `GET /movies/genres` for the search filter, and
  `GET /profile/stats` for top genres.
- **Client contract:** when adding to the library, the client sends `genreIds`
  from whatever payload it holds. On the details page that means the ids pulled
  from `genres[].id`.

## API

All routes under `/api`. Everything except register and login requires the auth
cookie.

| Method & path | Purpose | Auth |
| --- | --- | --- |
| `POST /auth/register` | Create user, set cookie | - |
| `POST /auth/login` | Verify password, set cookie | - |
| `POST /auth/logout` | Clear cookie | yes |
| `GET /auth/me` | Current user, else 401 | yes |
| `GET /movies/trending` | Top 10 this week | yes |
| `GET /movies/search?q=&genre=&year=&page=` | Search with filters | yes |
| `GET /movies/genres` | Genre list for the filter | yes |
| `GET /movies/:tmdbId` | Details + credits + videos | yes |
| `GET /movies/:tmdbId/similar` | Similar movies | yes |
| `GET /library?status=` | User's saved movies | yes |
| `POST /library` | Add to watchlist | yes |
| `PATCH /library/:tmdbId` | Change status or rating | yes |
| `DELETE /library/:tmdbId` | Remove from library | yes |
| `GET /lists`, `POST /lists` | List and create lists | yes |
| `GET` / `PATCH` / `DELETE /lists/:id` | Read, rename, delete a list | yes |
| `POST /lists/:id/movies`, `DELETE /lists/:id/movies/:tmdbId` | Add, remove a movie | yes |
| `GET /profile/stats` | Profile statistics | yes |

Feature 1 also adds `GET /api/health` for the app shell.

**Search filter workaround.** TMDB's `/search/movie` filters by year but not by
genre, so the server branches: with a text query it searches and filters results
by genre; without one it calls `/discover/movie` with genre and year. Feature 6
owns this logic.

**Errors.** JSON `{ message }` with the correct status, produced by one central
error handler. No stack traces, Mongo errors or secrets in responses.

## Auth design

- Login uses email and password, not username.
- Account rules, enforced by the server and mirrored by the forms: username 3-30
  letters, numbers, hyphens or underscores, case-sensitive; email a valid address
  of at most 254 characters, stored lowercase; password at least 8 characters and
  at most 72 bytes (bcrypt ignores anything longer), no composition rules.
- JWT `{ sub: userId }`, 7-day expiry, signed on register and login.
- Cookie `token`: `httpOnly`, `sameSite: "lax"`, `secure` in production,
  `maxAge` 7 days.
- `requireAuth` verifies `req.cookies.token`, sets `req.userId`, else 401.
- Axios instance uses `withCredentials: true`; a 401 on a protected page sends
  the user to `/login`.
- The TMDB key lives only on the server. The client never calls TMDB directly.

## Tech stack

- **JavaScript, ES modules** - every package, no TypeScript
- **React + Vite (`.jsx`)** - client, with React Router for routing
- **Tailwind CSS v4 via `@tailwindcss/vite`** - all styling, CSS-first config
- **Axios** - client HTTP, one configured instance
- **Node.js 22+ and Express** - API; `>=22` declared in `engines` in every
  `package.json`
- **Mongoose** - MongoDB access (local or Atlas)
- **bcryptjs + jsonwebtoken + cookie-parser** - auth
- **TMDB API** - all movie data, server-side only so the key stays secret
- **Oxlint** - linting, `npm run lint` in each package
- **`node --watch --env-file=.env`** - server dev loop
- **concurrently** - root-only dev dependency that runs both halves

**Repo layout.** A monorepo: `client/` and `server/`, each with its own
`package.json`, plus a small root `package.json` whose only dev dependency is
`concurrently`. Root `npm run dev` starts both halves; root `npm run lint` lints
both. Either half also runs on its own from its own folder. In development Vite
proxies `/api` to `http://localhost:5000`.

**Tooling rules (hard constraints).** Tailwind v4 is configured in CSS only:
`@import "tailwindcss"` in `client/src/index.css`, theme customization through
`@theme`. Never add the v3 files `tailwind.config.js` or `postcss.config.js`; v4
does not need them. Env vars load through Node's `--env-file`: do not add
`dotenv` or `nodemon`. Lint with Oxlint only: do not add ESLint.

## Monetization

Not in v1. The plans state no revenue model; this is a personal learning
project.

## UI/UX

Mobile-first and responsive with Tailwind. Every data view has loading, empty
and error states. The footer carries the TMDB attribution notice that TMDB's API
terms require.

| Route | Page | Access |
| --- | --- | --- |
| `/login`, `/register` | Auth forms | public; redirect to `/` when signed in |
| `/` | Home: Top 10 trending | protected |
| `/search` | Search and filters, state in the URL query | protected |
| `/movie/:tmdbId` | Details plus similar movies | protected |
| `/library` | *Want to watch* / *Watched* tabs | protected |
| `/lists`, `/lists/:id` | Custom lists | protected |
| `/profile` | Stats: watched count, watchlist size, average rating, rating distribution, top 3 genres, list count | protected |
| `*` | 404 | - |

`AuthContext` loads `/auth/me` at startup; `ProtectedRoute` redirects to
`/login` when there is no user.

## Visual direction

Dark and cinematic, so posters stand out. Inter throughout (400, 500, 700, 900) with a system sans fallback.

| Role | Value |
| --- | --- |
| Page, surface, raised surface | `#080b12`, `#111622`, `#1a2130` |
| Border, stronger border | `#262e3f`, `#43506a` |
| Text, muted text | `#f1f4f9`, `#a4aec2` |
| Blue accent, hover, text on accent, soft tint | `#4da3ff`, `#7dbcff`, `#06121f`, `rgba(77, 163, 255, 0.16)` |
| Watched, soft tint | `#5fd39a`, `rgba(95, 211, 154, 0.14)` |
| Error | `#ff6b6b` |
| Stars, filled and empty | gold `#f5b301`, `#56607a` |

- **Movie cards:** 2:3 poster with a thin border and 10px corners, then title and year, then the watchlist button or watched state with stars. Hover lifts the poster; the focus ring sits on the poster.
- **Top 10 row:** one sideways-scrolling row, never a grid. A huge outlined rank number in the page color stands behind the left edge of each poster, and its outline turns blue on hover. All numbers are the same size, so the "10" card is wider. Titles and buttons line up under the poster. Only the row scrolls, never the page.

## Deployment

> TODO: target not decided. The build plan's optional feature 15 names API on
> Render, MongoDB Atlas and client on Vercel as an example only, and the project
> plan has no deployment section. Settle this before running `/release`.

What is already fixed:

- Server env vars by name: `PORT`, `MONGO_URI`, `JWT_SECRET`, `TMDB_API_KEY`,
  `CLIENT_URL`, `NODE_ENV`
- Client build: `npm run build` in `client/`, output `client/dist/`
- Server start: `npm start` in `server/` (`node src/index.js`), no build step
- Node 22+ required at every level
- Health path: `GET /api/health`
- Cookies need `secure`, and the deployed `CLIENT_URL` drives CORS
- No workers or cron jobs

## Open questions

- **In-memory genre cache lifetime.** `services/tmdb.js` caches TMDB's genre
  list in memory with no stated refresh or failure behavior. Feature 4 should
  decide what happens when the fetch fails at startup and whether the cache ever
  refreshes; a stale map would mislabel genres on `/profile/stats`.
