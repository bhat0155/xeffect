# XEffect

A minimal 21-day habit tracker with a public read-only progress view and a private, Google-authenticated dashboard for tracking a single habit.

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Repo Layout](#repo-layout)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [API Reference](#api-reference)
- [Scripts](#scripts)
- [Running with Docker](#running-with-docker)
- [Running with Kubernetes](#running-with-kubernetes)
- [Deployment Notes](#deployment-notes)
- [License](#license)

## Features
- Public landing page that shows a read-only 21-day habit grid.
- Private dashboard for creating, renaming, and checking in on a single habit.
- Google OAuth login with a JWT stored in an httpOnly cookie.
- Streak engine with 21-day boxes, best-streak tracking, and an automatic reset after a 21-day habit completes.
- Optional AI-generated milestone messages (via OpenAI) at day 1, 3, 7, 14, and 21.

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, Tailwind CSS, DaisyUI |
| Backend | Node.js, Express, TypeScript, Passport (Google OAuth) |
| Database | PostgreSQL via Prisma |
| Orchestration | Kubernetes (Minikube + NGINX Ingress) |
| Hosting | Vercel (frontend), Render (backend), Supabase (database) |

## Repo Layout
```
backend/   # Express API + Prisma + tests
frontend/  # React app (Vite)
k8s/       # Kubernetes manifests for local cluster deployment
```

## Prerequisites
- [Node.js](https://nodejs.org/) 20.x
- [npm](https://www.npmjs.com/) (bundled with Node.js)
- A PostgreSQL 16 instance (local install, [Docker](https://www.docker.com/), or a hosted provider such as Supabase)
- A [Google OAuth 2.0 client ID and secret](https://console.cloud.google.com/apis/credentials) for login
- Optional: an [OpenAI API key](https://platform.openai.com/api-keys) to enable AI milestone messages

## Installation

### 1. Clone the repository
```bash
git clone <repository-url>
cd Xeffect
```

### 2. Set up the backend
```bash
cd backend
npm install
```

Copy the example environment file and fill in the values described in [Configuration](#configuration):
```bash
cp .env.example .env
```

> `backend/.env.example` does not include `DATABASE_URL`. Add it manually — it must point at a running PostgreSQL database.

Generate the Prisma client and apply migrations:
```bash
npx prisma generate
npx prisma migrate deploy
```

Start the API in watch mode:
```bash
npm run dev
```

The API listens on `http://localhost:4000` by default.

### 3. Set up the frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:5173` by default.

## Usage
Once both servers are running:

1. Open `http://localhost:5173` in your browser. You're redirected to the public habit view (`/public/ekam-xeffect`) if you're signed out, or to the dashboard (`/app`) if you're signed in.
2. Click **Sign in with Google** to authenticate. On success, the backend sets an httpOnly `xeffect_token` cookie and redirects you to `/app`.
3. In the dashboard, create a habit (name only, 1–60 characters).
4. Check in once per day. The grid fills in the box for the current day and the streak engine updates your current and best streak.
5. After 21 consecutive check-ins, the habit is marked complete and automatically resets so you can start a new cycle.

The user whose email matches `PUBLIC_HABIT_EMAIL` (default: the project owner's email, see [Configuration](#configuration)) has their habit exposed on the public read-only page at `/public/ekam-xeffect`.

## Configuration

### Backend (`backend/.env`)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string. Not present in `.env.example` — add it manually. |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret. |
| `JWT_SECRET` | Yes | Secret used to sign session JWTs. |
| `PORT` | No | API port. Defaults to `4000`. |
| `FRONTEND_ORIGIN` | No | Allowed CORS origin for the frontend. Defaults to `http://localhost:3000`. |
| `FRONTEND_APP_REDIRECT` | No | URL to redirect to after a successful login. Defaults to `${FRONTEND_ORIGIN}/app`. |
| `GOOGLE_CALLBACK_URL` | No (recommended in production) | OAuth callback URL registered with Google. |
| `PUBLIC_HABIT_EMAIL` | No | Email whose habit is shown on the public page. Defaults to the project owner's email. |
| `OPEN_AI_API_KEY` | No | Enables AI-generated milestone messages when set. |
| `OPENAI_MODEL` | No | OpenAI model used for milestone messages. Defaults to `gpt-4.1-mini`. |

### Frontend (`frontend/.env.local` or Vercel project settings)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | No | Base URL of the backend API. Leave empty when using the Vercel rewrites in `frontend/vercel.json`. |

## API Reference
Interactive Swagger UI is served by the backend itself:
- Local: `http://localhost:4000/docs`
- Production: `https://xeffect.onrender.com/docs`

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | No | Health check. |
| GET | `/auth/google` | No | Starts the Google OAuth flow. |
| GET | `/auth/google/callback` | No | OAuth callback; sets the session cookie and redirects to the app. |
| POST | `/auth/logout` | No | Clears the session cookie. |
| GET | `/api/habits/me` | Cookie | Returns the current user's habit state. |
| POST | `/api/habits` | Cookie | Creates a habit, replacing any existing one for the user. |
| PATCH | `/api/habits/:id` | Cookie | Renames a habit. |
| POST | `/api/habits/:id/save` | Cookie | Records today's check-in and returns updated habit state. |
| GET | `/api/public/:publicSlug` | No | Returns read-only habit state for a public slug. |

All habit endpoints return a `HabitState` object (`habit`, `todayUTC`, `checkedInToday`, `currentStreak`, `boxes`, optional `ai`). See `backend/docs/Achitecture.md` for the full response contract.

## Scripts

### Backend (`backend/`)
| Script | Description |
|---|---|
| `npm run dev` | Start the API with nodemon and hot reload. |
| `npm run build` | Generate the Prisma client and compile TypeScript. |
| `npm start` | Run the compiled server from `dist/`. |
| `npm test` | Run the Jest test suite using `.env.test`. |
| `npm run test:watch` | Run tests in watch mode. |
| `npm run test:coverage` | Run tests with coverage reporting. |
| `npm run seed` | Seed the database with a sample habit and check-ins. |

### Frontend (`frontend/`)
| Script | Description |
|---|---|
| `npm run dev` | Start the Vite dev server. |
| `npm run build` | Type-check and build for production. |
| `npm run lint` | Run ESLint. |
| `npm run preview` | Preview the production build locally. |

## Running with Docker
The repository includes a multi-service Docker Compose setup for `db` (Postgres), `backend` (Express API, running Prisma migrations on startup), and `frontend` (Vite app).

From the project root:
```bash
docker compose up --build
```

For a clean restart that also removes containers and volumes:
```bash
docker compose down -v
docker compose up --build
```

App URLs:
| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend health | `http://localhost:4000/health` |
| API docs | `http://localhost:4000/docs` |

Notes:
- The backend reads secrets from `backend/.env` via the Compose `env_file` directive.
- Compose overrides `DATABASE_URL` to point at the internal Docker Postgres service (`db`).
- Seed data is not required. Run `npm run seed` inside the backend container only if you want sample data.
- The repository contains two nearly identical Compose files, `compose.yaml` and `docker-compose.yml`. Docker Compose uses `compose.yaml` by default when both are present.

## Running with Kubernetes
The `k8s/` directory contains manifests for a local cluster deployment via Minikube.

Prerequisites:
- Docker Desktop running
- [Minikube](https://minikube.sigs.k8s.io/docs/start/) installed
- `kubectl` installed

Start the cluster and enable ingress:
```bash
minikube start --driver=docker --cpus=4 --memory=8192
minikube addons enable ingress
```

Build local images into the Minikube Docker daemon:
```bash
eval $(minikube docker-env)
docker build -t xeffect-backend:dev ./backend
docker build -t xeffect-frontend:dev ./frontend
```

Create the namespace:
```bash
kubectl apply -f k8s/00-namespace.yaml
```

Create the secret required by `k8s/30-backend.yaml`:
```bash
kubectl -n xeffect create secret generic xeffect-secrets \
  --from-literal=DATABASE_URL='postgresql://xeffect:xeffect@db-svc:5432/xeffect' \
  --from-literal=GOOGLE_CLIENT_ID='REPLACE_ME' \
  --from-literal=GOOGLE_CLIENT_SECRET='REPLACE_ME' \
  --from-literal=JWT_SECRET='REPLACE_ME' \
  --from-literal=PUBLIC_HABIT_EMAIL='REPLACE_ME' \
  --from-literal=OPEN_AI_API_KEY='REPLACE_ME' \
  --dry-run=client -o yaml | kubectl apply -f -
```

Apply the remaining manifests:
```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/11-db-pvc.yaml
kubectl apply -f k8s/20-db.yaml
kubectl apply -f k8s/30-backend.yaml
kubectl apply -f k8s/40-frontend.yaml
kubectl apply -f k8s/50-ingress.yaml
```

Expose the ingress controller locally on port `18080`:
```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 18080:80
```

On macOS, with the Minikube `docker` driver, NodePort and direct `minikube ip` access are not reliably reachable from the host. Ingress port-forwarding is the supported local access method for this repo.

Kubernetes app URLs:
| Resource | URL |
|---|---|
| App | `http://localhost:18080/app` |
| Health | `http://localhost:18080/health` |
| API docs | `http://localhost:18080/docs` |

## Deployment Notes
- The frontend proxies `/api`, `/auth`, and `/docs` to the backend through Vercel rewrites (`frontend/vercel.json`) so cookies stay same-origin.
- For production OAuth, set:
  - `GOOGLE_CALLBACK_URL=https://your-domain/auth/google/callback`
  - `FRONTEND_ORIGIN=https://your-domain`
  - `FRONTEND_APP_REDIRECT=https://your-domain/app`

## License
No `LICENSE` file is present in this repository. `backend/package.json` declares `ISC`; treat the licensing terms as unconfirmed until a `LICENSE` file is added.
