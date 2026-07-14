# Aetheris — MERN + Three.js 3D Website

A full MERN stack site with a 3D scene (React Three Fiber) on the frontend, an
Express/MongoDB API on the backend, and a "message wall" where visitors'
messages are launched into orbit as glowing 3D nodes around the ringed planet
**Aetheris**.

Anyone can view the orbit. You must be logged in to launch a message, and
only an admin account can delete one (from a protected `/admin` panel).

## Stack

- **Frontend**: React + Vite + Three.js (`@react-three/fiber`, `@react-three/drei`) + React Router, served via Nginx in production
- **Backend**: Node.js + Express + Mongoose
- **Database**: MongoDB (messages, users)
- **Sessions**: Redis (stores active refresh tokens so logins survive a backend restart and can be revoked on logout)
- **Infra**: Docker + Docker Compose, one Dockerfile per service

## Project layout

```
web1/
├── backend/          Express API (Dockerfile)
├── frontend/          React + Three.js app (Dockerfile)
├── docker-compose.yml
└── .env               single env file for the whole project (see below)
```

## Run everything with Docker Compose

```bash
docker compose up --build
```

- Frontend: http://localhost:3671
- Backend API: http://localhost:5674/api/health
- MongoDB: localhost:26712 (data persisted in the `mongo-data` volume)
- Redis: localhost:26379 (data persisted in the `redis-data` volume, AOF-enabled)

This also works unmodified on a remote server (e.g. `http://<server-ip>:3671`):
nginx inside the frontend container proxies `/api/*` to the `backend`
container over the internal Docker network, and the frontend's fetch calls
use relative paths (`/api/messages`) instead of a hardcoded host — so the
browser always talks to whatever host it loaded the page from. Just make sure
port `3671` (and `5674`/`26712`/`26379` if you want to reach them directly) is
open in the server's firewall/security group.

## Authentication & the admin panel

- **Public**: `GET /api/messages` and the 3D scene — no login needed.
- **Logged-in users**: can `POST /api/messages` (launch a message).
- **Admin only**: `DELETE /api/messages/:id`, and the `/admin` page in the
  frontend (sign up / delete controls are hidden from everyone else).

Auth uses short-lived JWT access tokens (15 min, `httpOnly` cookie) plus a
longer-lived refresh token (30 days) whose validity is tracked in Redis —
logging out deletes the Redis entry immediately, revoking that session even
though the JWT itself hasn't expired yet. The frontend transparently retries
a request once with a refreshed token if the access token has expired, so a
logged-in visitor doesn't get bounced every 15 minutes.

### How the admin password works (and how to change it)

There's no public admin signup. On backend startup, `seedAdmin()`
([backend/src/seed/seedAdmin.js](backend/src/seed/seedAdmin.js)) reads
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from the root `.env`, hashes the password
with bcrypt (12 salt rounds — the raw password is never stored), and either
creates that account as `role: "admin"` or promotes an existing account with
that email to admin if it already exists.

**To set or change the admin password:**

1. Edit `ADMIN_PASSWORD` (and `ADMIN_EMAIL` if you want) in the root `.env`
2. Restart the backend: `docker compose up -d --build --force-recreate backend`

This only *creates or promotes* — it won't overwrite the password of an
already-existing admin account on every restart, so changing `ADMIN_PASSWORD`
after the account already exists won't retroactively change it. To rotate an
existing admin's password, either:
- Drop that user from MongoDB and let the seed recreate it: `docker exec web1-mongo mongosh web1 --eval 'db.users.deleteOne({email:"admin@aetheris.local"})'`, then restart the backend, **or**
- Sign up a normal account through the UI, then manually flip its role in MongoDB: `docker exec web1-mongo mongosh web1 --eval 'db.users.updateOne({email:"you@example.com"},{$set:{role:"admin"}})'`

Regular users set their own password through the `/signup` form — it's
hashed with bcrypt the same way before being stored.

## Backups

The `backup` service ([backup/](backup/)) runs a small container (built from
the official `mongo:7` image, purely for its bundled `mongodump` binary — it
never runs `mongod` itself) that dumps MongoDB on a timer and writes
gzip-compressed archives to `./backups` on the host, which is bind-mounted in
so you can browse the dumps directly without `docker exec`. It backs up
immediately on startup, then every `BACKUP_INTERVAL_SECONDS` (default: 24h),
and auto-deletes dumps older than `BACKUP_RETENTION_DAYS` (default: 7),
both configurable in the root `.env` (same file as everything else).

This only protects the server's own disk (accidental deletes, a bad
migration, DB corruption) — if the whole EC2 instance/volume is destroyed,
these backups go with it. Copy `./backups` off-server periodically (e.g.
`scp` to your laptop, or a cron `rsync` to another machine) if you want that
extra layer.

**Trigger a backup manually right now:**
```bash
docker compose exec backup /usr/local/bin/backup.sh
```

**List available backups:**
```bash
ls -la backups/
```

**Restore from a backup** (⚠️ `--drop` replaces existing `messages`/`users`
collections with the dump's contents):
```bash
docker compose exec backup mongorestore --archive=/backups/web1-<timestamp>.archive.gz --gzip --uri="mongodb://mongo:27017/web1" --drop
```

## Run locally without Docker

Backend (requires local MongoDB and Redis reachable via `MONGO_URI` /
`REDIS_URL` in the root `.env`):

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Environment files

There's a single `.env` at the project root (with a checked-in `.env.example`
template) — `docker-compose.yml` reads it directly for ports and build args,
the backend container gets it via `env_file`, and the backend's own
`npm run dev` / Vite's `npm run dev` both resolve it relative to their source
files, so it's the one file to edit regardless of how you're running things:

- `FRONTEND_PORT`, `BACKEND_PORT`, `MONGO_PORT`, `REDIS_PORT` — host port mapping used by `docker-compose.yml`
- `VITE_API_URL` — baked into the frontend build at build time (see below)
- `BACKUP_INTERVAL_SECONDS`, `BACKUP_RETENTION_DAYS` — backup service settings
- `PORT`, `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_SECONDS`, `COOKIE_SECURE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` — backend config

`VITE_API_URL` should normally stay **empty**. The frontend then calls
same-origin relative paths (`/api/messages`), which nginx proxies to the
backend container — this works on `localhost`, a server's public IP, or a
real domain without any rebuild. Only set `VITE_API_URL` if the backend is
genuinely hosted on a *different* domain than the frontend (e.g. a separate
API subdomain), then rebuild.

`JWT_SECRET` ships with a generated dev value in `.env` — generate your own
for any real deployment with `openssl rand -hex 32`, and set
`COOKIE_SECURE=true` once the site is served over HTTPS (required for the
auth cookies to be sent at all over a secure connection).
