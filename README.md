# Movie Manager

A personal movie collection and watchlist app. React single-page client, Express
API, MongoDB.

## Layout

- `client/` - React 19 + Vite + Tailwind CSS v4
- `server/` - Express 5 + Mongoose

Each package has its own `package.json` and lockfile. Run `npm install` in both.

## Running it

Copy `server/.env.example` to `server/.env` and fill in `MONGO_URI`,
`JWT_SECRET`, `CLIENT_URL`, and `TMDB_API_KEY`.

```bash
cd server && npm run dev   # http://localhost:5000
cd client && npm run dev   # http://localhost:5173, proxies /api to the server
```

## Commands

| Package  | Command           | What it does                  |
| -------- | ----------------- | ----------------------------- |
| `client` | `npm run dev`     | Vite dev server               |
| `client` | `npm run build`   | Production build to `dist/`   |
| `client` | `npm run preview` | Serve the production build    |
| `client` | `npm run lint`    | oxlint                        |
| `server` | `npm run dev`     | Express with `node --watch`   |
| `server` | `npm start`       | Express, production mode      |

No test runner is configured yet.
