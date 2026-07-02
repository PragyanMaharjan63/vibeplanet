# Aetheris — MERN + Three.js 3D Website

A full MERN stack site with a 3D scene (React Three Fiber) on the frontend, an
Express/MongoDB API on the backend, and a "message wall" where visitors'
messages are launched into orbit as glowing 3D nodes around the ringed planet
**Aetheris**.

## Stack

- **Frontend**: React + Vite + Three.js (`@react-three/fiber`, `@react-three/drei`), served via Nginx in production
- **Backend**: Node.js + Express + Mongoose
- **Database**: MongoDB
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

This also works unmodified on a remote server (e.g. `http://<server-ip>:3671`):
nginx inside the frontend container proxies `/api/*` to the `backend`
container over the internal Docker network, and the frontend's fetch calls
use relative paths (`/api/messages`) instead of a hardcoded host — so the
browser always talks to whatever host it loaded the page from. Just make sure
port `3671` (and `5674`/`26712` if you want to reach them directly) is open
in the server's firewall/security group.

## Run locally without Docker

Backend:

```bash
cd backend
npm install
npm run dev   # requires a local/remote MongoDB reachable via MONGO_URI in backend/.env
```

Frontend:

```bash
cd frontend
npm install
npm run dev   # http://localhost:5173
```

## Environment files

Each service has its own `.env` (with a checked-in `.env.example` template):

- `backend/.env` — `PORT`, `MONGO_URI`
- `frontend/.env` — `VITE_API_URL` (baked into the build at build time; leave empty — see below)
- `.env` (root) — `FRONTEND_PORT`, `BACKEND_PORT`, `MONGO_PORT`, `VITE_API_URL` used by `docker-compose.yml`

`VITE_API_URL` should normally stay **empty**. The frontend then calls
same-origin relative paths (`/api/messages`), which nginx proxies to the
backend container — this works on `localhost`, a server's public IP, or a
real domain without any rebuild. Only set `VITE_API_URL` if the backend is
genuinely hosted on a *different* domain than the frontend (e.g. a separate
API subdomain); in that case set it in both `frontend/.env` and the root
`.env` and rebuild.
