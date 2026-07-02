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

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api/health
- MongoDB: localhost:27017 (data persisted in the `mongo-data` volume)

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
- `frontend/.env` — `VITE_API_URL` (baked into the build at build time)
- `.env` (root) — `FRONTEND_PORT`, `BACKEND_PORT`, `MONGO_PORT`, `VITE_API_URL` used by `docker-compose.yml`

Update `VITE_API_URL` in both `frontend/.env` and the root `.env` if you deploy
the backend somewhere other than `localhost:5000`.
