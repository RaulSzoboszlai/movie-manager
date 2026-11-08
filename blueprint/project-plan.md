# Project Plan — Movie Manager

## Product

**Movie Manager** is a personal movie tracker. Signed-in users can:
- search for movies
- keep a watchlist of what they want to see
- mark movies as watched and rate them
- organise movies into their own lists
- see what is trending right now

**Problem:** Movies people want to see get lost in screenshots, notes and memory. They also forget what they thought of the ones they watched.

**Users:** Individual movie fans. Each user's data is private to their account. This is a learning project, so the scope stays small and the code stays easy to understand.

## Features (v1)

### Accounts
- Register with username, email and password; log in; log out.
- The session persists across page reloads, using a JWT in an httpOnly cookie.
- All movie features require login. Only the Login and Register pages are public.

### Discover
- **Top 10 of the moment:** the home page shows the top 10 movies from TMDB's weekly trending list.
- **Home page rows:** under the Top 10, rows such as *Popular*, *Top rated* and *Upcoming*, using regular movie cards.
- **Search:** search movies by title, with optional **genre** and **release year** filters.
- **Movie details page:**
  - poster, backdrop, overview, runtime, release date and genres
  - top-billed cast
  - an embedded YouTube trailer, when TMDB has one
- **Similar movies:** each details page shows a "You might also like" row.

### My library
- **Watchlist:** add any movie with status *Want to watch*, or remove it.
- **Mark as watched:** from any card or the details page, whether or not the movie is on the watchlist. This puts the movie in *Watched* and records the watched date.
- **Undo watched:** a watched movie can be moved back to *Want to watch*, which clears its rating and watched date. If it has a rating, the app asks for confirmation first. To remove a watched movie from the library, move it back and then remove it from the watchlist.
- **Rating:**
  - 1–5 stars, available only once a movie is *Watched*
  - can be changed or cleared later
- The library page has two tabs: *Want to watch* / *Watched*.

### Custom lists
- Create, rename and delete your own named lists (e.g. "Horror night", "Rewatch").
- Add a movie to a list from its card or details page, and remove it again.
- Lists are separate from watchlist status: a movie can be in several lists and also be *Watched*.

### Profile
Shows the user's stats:
- total movies watched
- watchlist size
- average rating
- rating distribution
- top 3 genres among watched movies
- number of custom lists

## Out of scope (v1)
- Social features: following, public or shared lists, comments
- Written text reviews
- Password reset by email, OAuth login
- TV shows
- Admin panel

## Tech stack

| Layer | Choice |
|---|---|
| Language | **JavaScript** everywhere (no TypeScript), ES modules (`import`/`export`) on both client and server |
| Frontend | React + Vite (`.jsx`), React Router, Tailwind CSS v4 via `@tailwindcss/vite`, Axios |
| Backend | Node.js 22+ (declared in `engines` in every `package.json`), Express, Mongoose |
| Database | MongoDB (local, or MongoDB Atlas) |
| Auth | bcryptjs password hashing + JWT in an httpOnly cookie |
| Movie data | TMDB API, always called from the server so the API key stays secret |
| Linting | Oxlint on client and server (`npm run lint` in each package) |
| Dev tooling | Server: `node --watch --env-file=.env` (no nodemon). Client: Vite dev server. |

**Repo layout:** a monorepo with `client/` and `server/` folders, each with its own `package.json`. A small root `package.json` has only `concurrently` as a dev dependency, plus scripts:
- `npm run dev` starts both halves.
- `npm run lint` lints both halves.

Each half can also run on its own from its own folder. In development, Vite proxies `/api` to `http://localhost:5000`.

**Tooling rules:**
- **Tailwind CSS v4 is used for all styling.** It is set up with the `@tailwindcss/vite` plugin and `@import "tailwindcss";` in `client/src/index.css`. Customize the theme with `@theme` in CSS. Don't add the old v3 files (`tailwind.config.js`, `postcss.config.js`), because v4 doesn't need them.
- Environment variables are loaded by Node's `--env-file` in development. Don't add `dotenv` or `nodemon`.
- Lint with Oxlint only. Don't add ESLint.

## Data model

**User**
- `username` (unique)
- `email` (unique, lowercase)
- `passwordHash`
- `createdAt`

**SavedMovie** — one document per user + movie
- `user` (ref User)
- `tmdbId`
- a snapshot of: `title`, `posterPath`, `releaseYear`, `genreIds[]` (TMDB genre ids as numbers)
- `status`: `"want"` or `"watched"`
- `rating`: 1–5 or null; allowed only when status is `"watched"`
- `watchedAt`
- `createdAt`, `updatedAt`
- unique index on `{ user, tmdbId }`

**List**
- `user` (ref User)
- `name`
- `description`
- `movies[]`: `{ tmdbId, title, posterPath, addedAt }`
- `createdAt`, `updatedAt`
- unique index on `{ user, name }`

The SavedMovie and List items store a small snapshot of each movie. This lets library and list pages render without calling TMDB for every movie.

**Genres are stored as ids, not names.** TMDB's trending, search, discover and similar payloads include only `genre_ids`; just the details endpoint returns full `{ id, name }` objects. Storing ids means a movie can be saved from any card without an extra TMDB call.
- **Converting ids to names:** `services/tmdb.js` fetches TMDB's movie genre list (`/genre/movie/list`) on first use, not at startup, and caches it in memory until the server restarts. A failed fetch isn't cached, so the next request tries again.
- **Who uses it:** `GET /movies/genres` (the search filter) and `GET /profile/stats` (top genres).
- **What the client sends:** when adding to the library, the client sends `genreIds` from whatever payload it has. On the details page, that means the ids taken from `genres[].id`.

## API (all under `/api`)

| Method & path | Purpose | Auth |
|---|---|---|
| `POST /auth/register` | Create user, set cookie | – |
| `POST /auth/login` | Verify password, set cookie | – |
| `POST /auth/logout` | Clear cookie | ✓ |
| `GET /auth/me` | Current user, or 401 | ✓ |
| `GET /movies/trending` | Top 10 trending this week | ✓ |
| `GET /movies/popular` | Popular movies row | ✓ |
| `GET /movies/top-rated` | Top rated movies row | ✓ |
| `GET /movies/upcoming` | Upcoming movies row | ✓ |
| `GET /movies/search?q=&genre=&year=&page=` | Search with filters | ✓ |
| `GET /movies/genres` | Genre list for the filter | ✓ |
| `GET /movies/:tmdbId` | Details + credits + videos | ✓ |
| `GET /movies/:tmdbId/similar` | Similar movies | ✓ |
| `GET /library?status=` | User's saved movies | ✓ |
| `POST /library` | Add to watchlist, or save directly as watched | ✓ |
| `PATCH /library/:tmdbId` | Change status / rating | ✓ |
| `DELETE /library/:tmdbId` | Remove from library | ✓ |
| `GET /lists` · `POST /lists` | List / create lists | ✓ |
| `GET` · `PATCH` · `DELETE /lists/:id` | Read / rename / delete a list | ✓ |
| `POST /lists/:id/movies` · `DELETE /lists/:id/movies/:tmdbId` | Add / remove a movie | ✓ |
| `GET /profile/stats` | Profile statistics | ✓ |

TMDB's `/search/movie` endpoint can filter by year but not by genre. The server works around this in one of two ways:
- **With a query:** filter the results by genre.
- **Without a query:** use `/discover/movie` with genre + year.

## Frontend routes

| Route | Page | Access |
|---|---|---|
| `/login`, `/register` | Auth forms | public; redirect to `/` if already logged in |
| `/` | Home: Top 10 trending, then more movie rows | protected |
| `/search` | Search + filters, state kept in the URL query | protected |
| `/movie/:tmdbId` | Movie details + similar movies | protected |
| `/library` | Want to watch / Watched tabs | protected |
| `/lists`, `/lists/:id` | Custom lists | protected |
| `/profile` | Stats | protected |
| `*` | 404 | – |

An `AuthContext` loads `/auth/me` when the app starts. A `ProtectedRoute` component redirects to `/login` when there is no user.

## Auth design
- Users log in with their email and password, not their username.
- Account rules, enforced by the server and mirrored by the forms:
  - username: 3-30 letters, numbers, hyphens or underscores, case-sensitive (`Raul` and `raul` are different accounts)
  - email: a valid address of at most 254 characters, stored lowercase
  - password: at least 8 characters and at most 72 bytes (bcrypt ignores anything longer), with no composition rules
- Passwords are hashed with bcryptjs (cost 10) and never returned by the API.
- On login or register, the server signs a JWT `{ sub: userId }` that expires in 7 days.
- The JWT is set as cookie `token` with these options:
  - `httpOnly`
  - `sameSite: "lax"`
  - `secure` in production
  - `maxAge` 7 days
- `requireAuth` middleware verifies `req.cookies.token`, sets `req.userId`, and returns 401 otherwise.
- Every library, list or profile query is filtered by `req.userId`, so users can never read each other's data.
- Axios is created with `withCredentials: true`. A 401 response on a protected page sends the user back to `/login`.

## Environment variables (`server/.env`)
`PORT`, `MONGO_URI`, `JWT_SECRET`, `TMDB_API_KEY`, `CLIENT_URL`, `NODE_ENV`

## Visual direction
The look was chosen with a prototype, and this section keeps it after the prototype is deleted.
- **Mood:** dark and cinematic, so posters stand out.
- **Palette:**
  - backgrounds: page `#080b12`, surface `#111622`, raised surface `#1a2130`
  - borders: `#262e3f`, stronger `#43506a`
  - text: primary `#f1f4f9`, muted `#a4aec2`
  - blue accent for primary actions, the active nav link, the logo and focus rings: `#4da3ff`, hover `#7dbcff`, text on accent `#06121f`, soft tint `rgba(77, 163, 255, 0.16)`
  - watched state: green `#5fd39a`, soft tint `rgba(95, 211, 154, 0.14)`
  - error: `#ff6b6b`
- **Stars:** gold `#f5b301` when filled, `#56607a` when empty. Stars stay gold even though the accent is blue.
- **Gradients:** accent text such as the logo's "Manager" and page headings uses a blue gradient from `#4da3ff` to `#7dbcff`. Body text stays solid for readability.
- **Depth:** raised surfaces (cards, panels, menus and dialogs) get soft shadows, and posters keep their hover lift.
- **Font:** Inter for everything (weights 400, 500, 700 and 900), falling back to the system sans.
- **Movie cards:** a 2:3 poster with a thin border and 10px corners, then the title and year, then one compact row of icon buttons (watchlist, watched, add to list), with the stars on their own line once the movie is watched. On hover the poster lifts slightly. The keyboard focus ring sits on the poster.
- **Top 10 row:** one row that scrolls sideways, not a grid. Each card has a huge outlined rank number in the page color, standing behind the left edge of the poster, with the poster covering part of it. The outline turns blue on hover. All numbers are the same size, so the "10" card is wider. Titles and buttons line up under the poster. Only the row scrolls, never the page.

## Conventions
- Server code is split into `routes/` → `controllers/` → `models/`, plus `middleware/` and a `services/tmdb.js` wrapper.
- Errors come back as JSON `{ message }` with the right status code, through a central error handler.
- The UI is mobile-first and responsive with Tailwind. Every data view has loading, empty and error states.
- The footer shows the TMDB attribution notice, which TMDB's API terms require.

## Decisions (settled for v1)
- **No separate favorites flag.** The watchlist covers it, so there's no heart icon. A favorites toggle is listed under "Later" in the build plan.
- **Ratings are 1–5 whole stars.** Half stars are listed under "Later".
- **Genres are snapshotted as TMDB ids** and turned into names through a cached genre list (see Data model).