# AGENTS.md — Guidance for AI Coding Agents

This document gives AI coding agents the context they need to work effectively
on the `storejs` repository. Read it before making changes, and keep it in sync
with the code when you touch the areas it describes.

## Project Overview

`storejs` is a deliberately minimal Node.js web app that demonstrates a complete
CRUD flow for a single domain entity: `Puppy`. It is meant to be simple,
readable, and easy to demo.

Tech stack:
- Express.js (^4.21.2) for HTTP routing
- EJS (^3.1.10) for server-rendered HTML views
- In-memory storage (a plain array — non-persistent, resets on restart)
- OpenTelemetry for traces and metrics (exported over OTLP/HTTP)
- Vitest (^3.2.4) + supertest (^7.1.1) for testing

See `spec.md` for the functional specification and `README.md` for user-facing
docs.

## Build, Run, and Test

### Prerequisites
- Node.js 20+ (CI uses 20; local dev has been verified on 22)
- npm 9+

### Commands

```bash
# Install dependencies
npm install

# Run the test suite once (this is what `npm test` does)
npm test            # -> vitest run

# Watch mode during development
npx vitest          # or: npx vitest --watch

# Start the server WITH OpenTelemetry instrumentation
npm start           # node --require ./src/instrumentation.js src/server.js

# Start with auto-reload, WITHOUT instrumentation
npm run dev         # node --watch src/server.js
```

The server listens on `http://localhost:3000` by default and honours the `PORT`
environment variable. The app is mounted at `/` and redirects to `/puppies`.

Important: instrumentation is only loaded for `npm start` (via `--require`). The
`dev` script and the tests import `src/app.js` directly and do NOT start the
OpenTelemetry SDK, so tests run without needing an OTLP endpoint.

## Repository Structure

```
.
├── src/
│   ├── app.js                 # Express app: routes, in-memory store, exports `app`
│   ├── server.js              # Thin entrypoint: requires app and calls listen()
│   ├── metrics.js             # OpenTelemetry business metrics (counters)
│   ├── instrumentation.js     # OpenTelemetry NodeSDK setup (loaded via --require)
│   └── views/
│       ├── about.ejs          # Static About page
│       └── puppies/
│           ├── index.ejs      # List puppies
│           ├── new.ejs        # Create form
│           ├── show.ejs       # Single puppy
│           └── edit.ejs       # Edit form
├── test/
│   └── app.test.js            # supertest + vitest integration tests
├── scripts/
│   ├── daytona-prepare-sandbox.sh  # Bootstraps a Daytona sandbox and runs tests
│   ├── deploy.sh                   # Pull latest, install, restart systemd service
│   └── preview-setup.sh            # Provision a VM (Node + nginx) for previews
├── .github/workflows/ci.yml   # CI: install deps on Node 20 (see caveat below)
├── package.json               # Scripts and dependencies
├── package-lock.json          # Locked dependency versions
├── README.md                  # User-facing docs
├── spec.md                    # Functional specification
├── render.yaml                # Render.com Blueprint deployment config
├── vitest.config.cjs          # Vitest config (globals enabled)
└── .gitignore
```

## Application Architecture

- `src/app.js` builds and exports the Express `app` but never calls `listen()`.
  This separation lets tests import the app directly with supertest.
- `src/server.js` imports the app and starts the HTTP listener. It is the only
  place `app.listen` is called.
- State lives in module-level variables in `app.js`: a `puppies` array and a
  `nextId` counter. There is no database.
- `app.resetStore()` clears the store and notice. Tests call it in `beforeEach`
  to guarantee isolation — reuse it if you add stateful tests.
- Flash-style notices use `app.locals.notice`: a route sets it, a middleware
  copies it to `res.locals.notice` for the next render, then clears it.
- A catch-all middleware returns a plain `404 Not Found` for unknown routes and
  for missing puppy ids (handlers call `next()` when a puppy is not found).

### Routes

| Method | Path                  | Purpose                                  |
|--------|-----------------------|------------------------------------------|
| GET    | `/`                   | Redirects (302) to `/puppies`            |
| GET    | `/puppies`            | List all puppies                         |
| GET    | `/about`              | Static About page                        |
| GET    | `/puppies/new`        | New puppy form                           |
| POST   | `/puppies`            | Create puppy, redirect to show           |
| GET    | `/puppies/:id`        | Show a puppy                             |
| GET    | `/puppies/:id/edit`   | Edit puppy form                          |
| POST   | `/puppies/:id`        | Update puppy, redirect to show           |
| POST   | `/puppies/:id/delete` | Delete puppy, redirect to index          |

### Data Model

`Puppy`: `{ id, name, created_at, updated_at }`. `name` may be empty (validation
is intentionally lightweight per the spec).

## Testing

- Runner: Vitest. `vitest.config.cjs` sets `globals: true`, so `describe`,
  `it`, `expect`, and `beforeEach` are available without importing them.
- HTTP assertions use `supertest` against the exported Express `app`.
- Test files live in `test/` and follow the `*.test.js` pattern.

Conventions to follow when adding tests:
- Call `app.resetStore()` in `beforeEach` so state does not leak between tests.
- Assert on both status codes and rendered text (the existing tests check for
  strings like `Name: <value>`, `New puppy`, and `Editing puppy`). When you
  change a view, update the tests that assert on its text, and vice versa.
- Cover new routes/handlers with at least a happy path and a not-found path.

Run `npm test` locally before committing — see the CI caveat below.

## Observability (OpenTelemetry)

- `src/metrics.js` defines business metrics on the `storejs-business` meter:
  - `store.puppies.created` (counter)
  - `store.puppies.deleted` (counter)
  - `store.puppies.total` (up/down counter)
  Increment these when you add create/delete-like operations.
- `src/instrumentation.js` configures the Node SDK with auto-instrumentations
  plus OTLP trace and metric exporters. It reads:
  - `OTEL_EXPORTER_OTLP_ENDPOINT` (default: Dash0 europe-west4 ingress)
  - `DASH0_TOKEN` (sent as a Bearer auth header when present)
  - `NODE_ENV` (used for `deployment.environment`; default `production`)
- Do not commit secrets. `DASH0_TOKEN` must come from the environment.

## Environment Variables

| Variable                       | Purpose                                   | Default        |
|--------------------------------|-------------------------------------------|----------------|
| `PORT`                         | HTTP listen port                          | `3000`         |
| `NODE_ENV`                     | Deployment environment tag for OTel       | `production`   |
| `OTEL_EXPORTER_OTLP_ENDPOINT`  | OTLP base URL for traces/metrics          | Dash0 ingress  |
| `DASH0_TOKEN`                  | Bearer token for the OTLP exporter        | (unset)        |

## Deployment

- `render.yaml` defines a Render.com Blueprint web service:
  - Build: `npm install`
  - Start: `npm start`
  - Uses `process.env.PORT`, so it is Render-compatible.
- `scripts/deploy.sh` deploys to a self-managed host: it fetches `origin/main`
  (or a ref argument), `git reset --hard`, `npm install --production`, restarts
  the `storejs` systemd unit, and polls `GET /puppies` for a `200` health check.
- `scripts/preview-setup.sh` provisions a fresh VM (installs Node 22 and nginx,
  clones the repo, runs the app behind an nginx reverse proxy) for previews.
- `scripts/daytona-prepare-sandbox.sh` (also `npm run daytona:prepare`) bootstraps
  a Daytona sandbox, clones the repo with `GITHUB_TOKEN`, and runs the tests.

## CI/CD

`.github/workflows/ci.yml` runs on `pull_request`, checks out the code, sets up
Node 20, and runs `npm ci`.

Caveat: the current CI job installs dependencies but does not execute the test
suite (it only echoes a success message). Do not rely on CI to catch test
failures — always run `npm test` locally before pushing. If you strengthen CI,
adding `npm test` to this workflow is a sensible, in-scope improvement.

## Working Conventions

- Match the existing style: two-space indentation, CommonJS (`require`/
  `module.exports`, `"type": "commonjs"`), and small focused functions.
- Keep the app minimal and readable — this is a demo. Avoid introducing new
  frameworks, a database, auth, or heavy abstractions unless the task asks for it
  (see the "Out of Scope" list in `spec.md`).
- Keep views, routes, tests, and `spec.md` consistent with each other. If you
  rename UI text that a test asserts on, update both.
- Respect the in-memory storage constraint: data resets on restart. Do not
  assume persistence.
- Never commit secrets or tokens.

## Pre-Change Checklist

Before opening a PR, confirm:
- [ ] `npm install` succeeds
- [ ] `npm test` passes locally
- [ ] `npm start` boots without errors
- [ ] New routes/handlers have tests (happy path + not-found)
- [ ] Business metrics updated if you added create/delete-style operations
- [ ] `spec.md` / `README.md` updated if behaviour or setup changed
- [ ] No secrets committed

## Related Documentation

- `README.md` — how to run and deploy the app
- `spec.md` — functional requirements and acceptance criteria
- `test/app.test.js` — executable examples of expected behaviour
