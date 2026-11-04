# Build Plan — Movie Manager

Each item below is one Blueprint feature loop: `/feature` → `/implement` → `/check` → `/complete`. They are ordered so that every step builds on a working app.

## Phase 1 — Foundation
- [x] **1. App shell**
  - Express server with `/api/health`, MongoDB connection, central error handler, CORS and cookie-parser.
  - React Router with a layout: navbar, footer with TMDB attribution, and placeholder pages for every route.
  - A 404 page.
- [x] **2. Register & login**
  - User model, plus register, login and logout endpoints.
  - Passwords hashed with bcryptjs; JWT stored in an httpOnly cookie.
  - Login and Register forms with validation and error messages.
- [ ] **3. Session & protected routes**
  - `GET /auth/me` and `requireAuth` middleware.
  - Put `requireAuth` on `POST /auth/logout`, which Feature 2 ships unguarded.
  - `AuthContext` on the client, `ProtectedRoute`, and redirects in both directions.
  - Navbar shows the username and a logout button.

## Phase 2 — Discover
- [ ] **4. TMDB service + Top 10 trending**
  - `services/tmdb.js` wrapper, including a cached genre list (id → name).
  - `GET /movies/trending`.
  - The home page shows the 10 `MovieCard`s in a single row that scrolls sideways, with large outlined rank numbers behind the posters (see `prototypes/home.html` and Visual direction in the project plan).
  - `prototypes/` is deleted when this feature completes.
- [ ] **5. Search**
  - `GET /movies/search` and a search page with a debounced input.
  - Results grid, pagination ("Load more"), and the query kept in the URL.
- [ ] **6. Search filters**
  - `GET /movies/genres`, served from the cached genre list, plus genre and year selects.
  - Server-side filter logic: search vs. discover (see the note in the project plan).
- [ ] **7. Movie details page**
  - `GET /movies/:tmdbId` using `append_to_response=credits,videos`.
  - Shows the backdrop, overview, cast row and YouTube trailer embed.
- [ ] **8. Similar movies**
  - `GET /movies/:tmdbId/similar`.
  - A "You might also like" row on the details page.

## Phase 3 — My library
- [ ] **9. Watchlist**
  - SavedMovie model, with a snapshot that includes `genreIds[]`.
  - Add to and remove from the watchlist, from any card or the details page.
  - The watchlist button on cards and the details page reflects the saved state.
  - Library page with the *Want to watch* tab.
- [ ] **10. Watched & rating**
  - `PATCH /library/:tmdbId` to mark a movie watched (records `watchedAt`) and to set or clear its rating.
  - Star rating component; the rating is only enabled once the movie is watched.
  - *Watched* tab on the library page.

## Phase 4 — Lists & profile
- [ ] **11. Custom lists**
  - List model and its CRUD endpoints.
  - Lists page, plus list detail page with a rename option.
- [ ] **12. Add to list**
  - An "Add to list" menu on cards and the details page.
  - Remove a movie from a list.
- [ ] **13. Profile stats**
  - `GET /profile/stats` using a MongoDB aggregation.
  - Top genres are counted by `genreIds`, then turned into names with the cached genre list.
  - Profile page with stat cards and the rating distribution.

## Phase 5 — Polish
- [ ] **14. UX polish**
  - Loading skeletons, empty states and toast notifications.
  - Responsive navbar (mobile menu) and a pass over keyboard accessibility.
- [ ] **15. Release prep** (optional)
  - Production cookie settings and environment check.
  - Deploy with Blueprint's `/release`: e.g. API on Render, MongoDB Atlas, client on Vercel.

## Later (not V1)

These are ideas for growing the project after V1 ships. None of them are planned yet. When you pick one, move it into a new phase above with a number, and run it through the normal feature loop.

### Library & rating
- **Favorites:** a heart toggle, separate from the watchlist, plus a *Favorites* tab.
- **Finer ratings:** half stars (e.g. 3.5/5).
- **Written reviews:** a short text review next to the rating, shown on the details page.
- **Watch diary:**
  - a chronological history of what you watched and when, built on `watchedAt`
  - support for rewatches
- **Reorder lists:** drag and drop movies inside a custom list.
- **Import / export:** import a CSV from Letterboxd or IMDb, and export your library as CSV.

### Discovery
- **Personal recommendations:** suggestions based on your highest-rated movies and favorite genres.
- **Where to watch:**
  - streaming, rent and buy providers for Romania, from TMDB's watch providers data
  - a filter for "on a service I have"
- **More Top lists:** *Top rated by Movie Manager users* and *Upcoming releases*, shown as tabs next to Trending.
- **Person pages:** an actor or director page with their filmography, linked from the cast row.
- **TV shows:** search and track series and seasons alongside movies.

### Social
- **Shareable public lists:** a read-only link that works without logging in.
- **Friends:** follow other users and see their activity feed (watched, rated, added to a list).
- **Compare tastes:** a compatibility score with a friend, and movies you both want to watch.

### Account & security
- **Account settings:** change username, email or password, and delete your account.
- **Password reset by email:** a time-limited reset link, using e.g. Resend or Nodemailer.
- **Sign in with Google:** OAuth, alongside email and password.
- **Refresh tokens:** short-lived access tokens plus a refresh token, with "log out of all devices".
- **Rate limiting:** on the login and register endpoints, against password guessing.

### Experience
- **Dark / light theme toggle**, remembered per user.
- **Language:** a Romanian / English interface, using TMDB's localized titles and overviews.
- **Release reminders:** email or in-app notifications when a watchlist movie is released or arrives on streaming.
- **PWA:** installable on your phone, with an offline view of your library.

### Engineering
- **Tests:** unit tests for the server (Vitest + Supertest) and component tests for the client. Blueprint's `/tests` can set these up.
- **CI:** lint, test and build on every pull request, with Blueprint's `/ci`.
- **TMDB caching:** cache trending and details responses on the server, to save API calls and speed up pages.
- **Admin dashboard:** user count, activity and the most-saved movies.