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
- **Search:** search movies by title, with optional **genre** and **release year** filters.
- **Movie details page:**
  - poster, backdrop, overview, runtime, release date and genres
  - top-billed cast
  - an embedded YouTube trailer, when TMDB has one
- **Similar movies:** each details page shows a "You might also like" row.

### My library
- **Watchlist:** add any movie with status *Want to watch*, or remove it.
- **Mark as watched:** this moves the movie to *Watched* and records the watched date.
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
| Backend | Node.js 22+, Express, Mongoose |
| Database | MongoDB (local, or MongoDB Atlas) |
| Auth | bcryptjs password hashing + JWT in an httpOnly cookie |
| Movie data | TMDB API, always called from the server so the API key stays secret |
| Linting | Oxlint on client and server |
| Dev tooling | Server: `node --watch --env-file=.env` (no nodemon). Client: Vite dev server. |

**Repo layout:** a monorepo with `client/` and `server/` folders. The root `npm run dev` starts both with `concurrently`. In development, Vite proxies `/api` to `http://localhost:5000`.

**Tooling rules:**
- Tailwind v4 is configured in CSS only: `@import "tailwindcss";`, with customization through `@theme`. Never add `tailwind.config.js` or `postcss.config.js`.
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
- a snapshot of: `title`, `posterPath`, `releaseYear`, `genres[]`
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

## API (all under `/api`)

| Method & path | Purpose | Auth |
|---|---|---|
| `POST /auth/register` | Create user, set cookie | – |
| `POST /auth/login` | Verify password, set cookie | – |
| `POST /auth/logout` | Clear cookie | ✓ |
| `GET /auth/me` | Current user, or 401 | ✓ |
| `GET /movies/trending` | Top 10 trending this week | ✓ |
| `GET /movies/search?q=&genre=&year=&page=` | Search with filters | ✓ |
| `GET /movies/genres` | Genre list for the filter | ✓ |
| `GET /movies/:tmdbId` | Details + credits + videos | ✓ |
| `GET /movies/:tmdbId/similar` | Similar movies | ✓ |
| `GET /library?status=` | User's saved movies | ✓ |
| `POST /library` | Add to watchlist | ✓ |
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
| `/` | Home: Top 10 trending | protected |
| `/search` | Search + filters, state kept in the URL query | protected |
| `/movie/:tmdbId` | Movie details + similar movies | protected |
| `/library` | Want to watch / Watched tabs | protected |
| `/lists`, `/lists/:id` | Custom lists | protected |
| `/profile` | Stats | protected |
| `*` | 404 | – |

An `AuthContext` loads `/auth/me` when the app starts. A `ProtectedRoute` component redirects to `/login` when there is no user.

## Auth design
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

## Conventions
- Server code is split into `routes/` → `controllers/` → `models/`, plus `middleware/` and a `services/tmdb.js` wrapper.
- Errors come back as JSON `{ message }` with the right status code, through a central error handler.
- The UI is mobile-first and responsive with Tailwind. Every data view has loading, empty and error states.
- The footer shows the TMDB attribution notice, which TMDB's API terms require.

## Open questions
- Should "favorite" be its own flag (a heart icon), or is the watchlist enough? *Default for v1: the watchlist is enough.*
- Should ratings be 1–5 whole stars, or allow half stars / 1–10? *Default for v1: 1–5 whole stars.*