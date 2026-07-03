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
├── backend/          Express API (Dockerfile, .env)
├── frontend/          React + Three.js app (Dockerfile, .env)
├── docker-compose.yml
└── .env               shared ports / build args for docker-compose
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
`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env`, hashes the password
with bcrypt (12 salt rounds — the raw password is never stored), and either
creates that account as `role: "admin"` or promotes an existing account with
that email to admin if it already exists.

**To set or change the admin password:**

1. Edit `ADMIN_PASSWORD` (and `ADMIN_EMAIL` if you want) in `backend/.env`
2. Restart the backend: `docker compose up -d --build --force-recreate backend`

This only *creates or promotes* — it won't overwrite the password of an
already-existing admin account on every restart, so changing `ADMIN_PASSWORD`
after the account already exists won't retroactively change it. To rotate an
existing admin's password, either:
- Drop that user from MongoDB and let the seed recreate it: `docker exec web1-mongo mongosh web1 --eval 'db.users.deleteOne({email:"admin@aetheris.local"})'`, then restart the backend, **or**
- Sign up a normal account through the UI, then manually flip its role in MongoDB: `docker exec web1-mongo mongosh web1 --eval 'db.users.updateOne({email:"you@example.com"},{$set:{role:"admin"}})'`

Regular users set their own password through the `/signup` form — it's
hashed with bcrypt the same way before being stored.

## Run locally without Docker

Backend (requires local MongoDB and Redis reachable via `MONGO_URI` /
`REDIS_URL` in `backend/.env`):

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

Each service has its own `.env` (with a checked-in `.env.example` template):

- `backend/.env` — `PORT`, `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL_SECONDS`, `COOKIE_SECURE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `frontend/.env` — `VITE_API_URL` (baked into the build at build time; leave empty — see below)
- `.env` (root) — `FRONTEND_PORT`, `BACKEND_PORT`, `MONGO_PORT`, `REDIS_PORT`, `VITE_API_URL` used by `docker-compose.yml`

`VITE_API_URL` should normally stay **empty**. The frontend then calls
same-origin relative paths (`/api/messages`), which nginx proxies to the
backend container — this works on `localhost`, a server's public IP, or a
real domain without any rebuild. Only set `VITE_API_URL` if the backend is
genuinely hosted on a *different* domain than the frontend (e.g. a separate
API subdomain); in that case set it in both `frontend/.env` and the root
`.env` and rebuild.

`JWT_SECRET` ships with a generated dev value in `backend/.env` — generate
your own for any real deployment with `openssl rand -hex 32`, and set
`COOKIE_SECURE=true` once the site is served over HTTPS (required for the
auth cookies to be sent at all over a secure connection).
