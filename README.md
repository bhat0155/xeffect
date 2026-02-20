# XEffect

A minimal 21-day habit tracker with a public progress view and a private authenticated dashboard.

## Highlights
- Public landing page shows a read-only habit grid.
- Private dashboard for creating and tracking a single habit.
- Google OAuth login with JWT cookie auth.
- Streak engine with 21-day boxes and milestone messaging.

## Tech Stack
- Frontend: React, TypeScript, Tailwind CSS, DaisyUI
- Backend: Node.js, Express, TypeScript, Passport (Google OAuth)
- Database: Postgres (Prisma)
- Orchestration: Kubernetes (Minikube + NGINX Ingress)
- Hosting: Vercel (frontend), Render (backend), Supabase (db)

## Repo Layout
```
backend/   # Express API + Prisma + tests
frontend/  # React app (Vite)
```

## Local Development
### 1) Backend
```
cd backend
npm install
```

Create `backend/.env` (see `backend/.env.example`), then:
```
npm run dev
```

### 2) Frontend
```
cd frontend
npm install
npm run dev
```

## Run With Docker
This repo includes a multi-service Docker setup for:
- `db` (Postgres)
- `backend` (Express API + Prisma migrations on startup)
- `frontend` (Vite app)

From the project root:
```
docker compose up --build
```

If you want a clean restart (remove containers + volumes):
```
docker compose down -v
docker compose up --build
```

App URLs:
- Frontend: `http://localhost:5173`
- Backend health: `http://localhost:4000/health`
- API docs: `http://localhost:4000/docs`

Notes:
- Backend reads secrets from `backend/.env` via Compose `env_file`.
- Compose overrides `DATABASE_URL` to the internal Docker Postgres service (`db`).
- Seed data is not required; run it only if you explicitly want sample data.

## Run With Kubernetes
This repo also includes Kubernetes manifests in `k8s/` for local cluster deployment.

Prerequisites:
- Docker Desktop running
- Minikube installed
- `kubectl` installed

Start cluster and ingress:
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

Create namespace:
```bash
kubectl apply -f k8s/00-namespace.yaml
```

Create secret (required by `k8s/30-backend.yaml`):
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

Apply manifests:
```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/11-db-pvc.yaml
kubectl apply -f k8s/20-db.yaml
kubectl apply -f k8s/30-backend.yaml
kubectl apply -f k8s/40-frontend.yaml
kubectl apply -f k8s/50-ingress.yaml
```

Expose ingress locally on port `18080`:
```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 18080:80
```

### Local Kubernetes Access (macOS)
- Start port-forward to the ingress controller:
```bash
kubectl -n ingress-nginx port-forward svc/ingress-nginx-controller 18080:80
```
- With Minikube `docker` driver on macOS, NodePort or direct `minikube ip` access may not be reliably reachable from the host. For this repo, ingress port-forward is the supported local access method.

Kubernetes app URLs:
- App: `http://localhost:18080/app`
- Health: `http://localhost:18080/health`
- API docs: `http://localhost:18080/docs`

## Environment Variables
Backend (`backend/.env`):
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `JWT_SECRET`
- `FRONTEND_ORIGIN`
- `FRONTEND_APP_REDIRECT` (optional)
- `GOOGLE_CALLBACK_URL` (recommended for prod)
- `PUBLIC_HABIT_EMAIL` (optional)
- `OPEN_AI_API_KEY` (optional)
- `OPEN_AI_MODEL` (optional)

Frontend (Vercel or `frontend/.env.local`):
- `VITE_API_URL` (leave empty when using Vercel rewrites)

## Scripts (Backend)
- `npm run dev` - start API with nodemon
- `npm run build` - generate Prisma client + compile TS
- `npm run start` - run compiled server
- `npm test` - run tests

## Deployment Notes
- The frontend proxies `/api` and `/auth` through Vercel rewrites so cookies are same-origin.
- For production OAuth, set:
  - `GOOGLE_CALLBACK_URL=https://your-domain/auth/google/callback`
  - `FRONTEND_ORIGIN=https://your-domain`
  - `FRONTEND_APP_REDIRECT=https://your-domain/app`

## API Docs
- Swagger UI (local): `http://localhost:4000/docs`
- Swagger UI (prod): `https://xeffect.onrender.com/docs`

## License
MIT
