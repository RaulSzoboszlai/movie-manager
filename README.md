# Movie Manager

A personal movie collection and watchlist app. React single-page client, Express
API, MongoDB.

## Layout

- `client/` - React 19 + Vite + Tailwind CSS v4
- `server/` - Express 5 + Mongoose

`client/` and `server/` each have their own `package.json` and lockfile. A small
root `package.json` holds `concurrently` and the root scripts. There is no
workspace wiring, so run `npm install` in the root, `client/`, and `server/`.

## Running it

Copy `server/.env.example` to `server/.env` and fill in `MONGO_URI`,
`JWT_SECRET`, `CLIENT_URL`, and `TMDB_API_KEY`.

```bash
npm run dev   # from the root, starts both
```

The server runs on http://localhost:5000 and the client on
http://localhost:5173, which proxies `/api` to the server. Either half can also
run on its own with `npm run dev` from its own folder.

## Commands

| Location | Command           | What it does                     |
| -------- | ----------------- | -------------------------------- |
| root     | `npm run dev`     | Starts server and client         |
| root     | `npm run lint`    | Lints client, then server        |
| `client` | `npm run dev`     | Vite dev server                  |
| `client` | `npm run build`   | Production build to `dist/`      |
| `client` | `npm run preview` | Serve the production build       |
| `client` | `npm run lint`    | oxlint                           |
| `server` | `npm run dev`     | Express with `node --watch`      |
| `server` | `npm start`       | Express, without file watching   |
| `server` | `npm run lint`    | oxlint on `src`                  |

No test runner is configured yet.
