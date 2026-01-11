# XEffect — Detailed Build Roadmap (Chronological) + DevOps Track (Docker, K8s, CI/CD, AWS)
This document is the step-by-step plan you will follow in order.  
**No code** here — only steps and Definition of Done (DoD) you verify with Postman/CLI.

---

## 0) Repo + Project Standards (Do this first)
- Create GitHub repo `xeffect`
- Add base files:
  - `README.md`
  - `BackendStepsDetailed.md` (this file)
  - `FrontendStepsDetailed.md`
  - `ARCHITECTURE.md` (diagram + flow)
  - `.gitignore`
- Decide naming:
  - HabitState response object name stays consistent everywhere
  - error format `{ code, message }`
- Add folder layout plan to README (short)

**DoD**
- Repo pushed to GitHub with the 4 docs above

---

# PHASE 1 — BACKEND (API + DB + AUTH + STATE ENGINE + TESTS + SWAGGER)

## 1) Backend Setup (Tooling)
- Create backend folder (or root backend) and initialize Node project
- Install runtime deps:
  - express, cors, helmet, cookie-parser
  - passport, passport-google-oauth20
  - jsonwebtoken, dotenv
  - prisma, @prisma/client
- Install dev deps:
  - typescript, ts-node, nodemon
  - @types/* for express/cors/cookie-parser/jwt/passport/node
- Create `tsconfig.json`
- Add scripts:
  - `dev` (nodemon + ts-node)
  - `build` (tsc)
  - `start` (node dist)
  - `test`
- Create folders:
  - `src/config`
  - `src/routes`
  - `src/middleware`
  - `src/services`
  - `src/utils`
- Create `.env` + `.env.example`

**DoD**
- `npm run dev` boots
- `npm run build` succeeds

---

## 2) Express Base Server
- Create server entry (e.g. `src/server.ts`)
- Add middleware in order:
  - helmet
  - cors({ origin: FRONTEND_ORIGIN, credentials: true })
  - cookie-parser
  - express.json
- Add `GET /health`
- Add not-found handler + basic error handler placeholder

**DoD (Postman)**
- `GET /health` -> 200

---

## 3) Database Setup (Postgres + Prisma)
- Start Postgres locally (local install or temporary docker later)
- `npx prisma init`
- Define Prisma models:
  - `User`
  - `Habit`
  - `HabitCheckin`
- Add constraints:
  - unique `User.email`
  - unique `User.googleId`
  - unique `Habit.userId` (one active habit)
  - unique `Habit.publicSlug` (nullable)
  - unique `(habitId, checkinDate)` in HabitCheckin
- Add relations:
  - User -> Habit (1:1)
  - Habit -> HabitCheckin (1:N)
- Configure cascade delete:
  - deleting Habit deletes its HabitCheckin rows
- Run migration:
  - `npx prisma migrate dev --name init`
- Create Prisma client singleton:
  - `src/config/prisma.ts`

**DoD**
- Prisma Studio shows all tables
- Cascade delete works (delete habit -> checkins disappear)

---

## 4) Authentication (Google OAuth + JWT Cookie)
- Configure passport Google strategy (`src/config/passport.ts`)
- Add routes:
  - `GET /auth/google`
  - `GET /auth/google/callback`
- Callback flow:
  - find/create user in DB
  - sign JWT (payload contains internal `userId`)
  - set JWT in httpOnly cookie
  - redirect to frontend
- Add `requireAuth` middleware:
  - read cookie JWT
  - verify signature
  - attach `req.userId`
- Add protected test route:
  - `GET /api/me`

**DoD**
- Login creates user row
- `GET /api/me`:
  - without cookie -> 401
  - with cookie -> 200

---

## 5) HabitState Contract (Backend Response Shape)
- Add a single shared response shape called **HabitState**
- HabitState must include:
  - `habit` metadata: id, name, bestStreak, allDone, isPublic, publicSlug
  - `state` metadata: todayUTC, checkedInToday, currentStreak
  - `boxes[21]` each `{ day, status, canEdit }`
  - optional `ai` `{ milestoneDay, message }`
- Define consistent error response: `{ code, message }`

**DoD**
- HabitState schema written in README/ARCHITECTURE.md

---

## 6) Core Engine (UTC Helpers + State Builder)
- Create UTC helpers:
  - todayUTC (YYYY-MM-DD)
  - yesterdayUTC (YYYY-MM-DD)
- Create state engine service that:
  - fetches user habit (or none)
  - fetches habit checkins (recent window)
  - computes:
    - checkedInToday
    - currentStreak (anchor logic, cap at 21)
  - builds `boxes[21]`:
    - `status=true` for days <= currentStreak
    - `canEdit=true` only for day (currentStreak+1) if NOT checkedInToday and NOT allDone
- Ensure state engine runs on:
  - save endpoint (after insert)
  - GET habit endpoint (on refresh)

**DoD (Postman + DB)**
- With no habit -> empty state 21 boxes
- With no checkins -> day1 canEdit true
- With checkin today -> checkedInToday true and all canEdit false
- Miss yesterday and save today -> streak becomes 1

---

## 7) Private APIs (User Habit Flow)
All require auth.

- `GET /api/habits/me`
  - return HabitState or empty state
- `POST /api/habits`
  - delete existing habit + cascade checkins
  - create new habit
  - return HabitState
- `PATCH /api/habits/:id`
  - rename habit (ownership check)
  - return HabitState (recommended)
- `POST /api/habits/:id/save`
  - reject if allDone
  - insert today checkin if missing (idempotent via DB unique)
  - recompute streak via state engine
  - update bestStreak if improved
  - if streak==21 -> set allDone=true
  - return HabitState
- Add ownership checks to any `:id` route

**DoD (Postman)**
- Create -> Save -> Refresh returns correct state
- Save twice same day doesn’t duplicate rows
- Ownership returns 403 for non-owner

---

## 8) Public API (Landing Page)
- `GET /api/public/:publicSlug`
  - find habit by slug where isPublic=true
  - compute state via state engine
  - force canEdit=false for all boxes
  - return HabitState

**DoD**
- `GET /api/public/ekam-xeffect` -> 200 read-only state

---

## 9) AI Milestones (Optional Layer)
- Add Habit fields:
  - `lastMilestoneReached` (default 0)
- In save flow:
  - if streak in (1,3,7,14,21) and streak > lastMilestoneReached:
    - call OpenAI
    - store lastMilestoneReached=streak
    - include ai message in response

**DoD**
- Milestone save returns ai message
- Non-milestone save returns ai.message=null
- Same milestone doesn’t repeat

---

## 10) Swagger / OpenAPI Docs
- Add Swagger UI at `/docs`
- Document:
  - cookie auth
  - endpoints
  - HabitState schema
  - error codes

**DoD**
- `/docs` loads and shows endpoints + schemas

---

## 11) Testing (Unit + Minimal Integration)
- Add unit tests for streak engine:
  - consecutive streak
  - missed-day reset
  - miss yesterday + checked today -> streak 1
  - cap at 21
- Add minimal integration test (optional):
  - save today inserts checkin (use test DB)

**DoD**
- `npm test` passes
- 8–12 meaningful tests exist

---

# PHASE 2 — FRONTEND (REACT + TAILWIND) + TESTS

## 12) Frontend Setup
- Setup React + Tailwind
- Routes:
  - `/` landing (public)
  - `/app` dashboard (private)
- API calls use credentials (cookies)

**DoD**
- App runs locally
- Routes render

---

## 13) Auth + Rendering from HabitState
- Login button hits `/auth/google`
- After callback redirect, dashboard calls `GET /api/habits/me`
- UI renders only from HabitState:
  - 21 boxes
  - Save enabled only if a box has canEdit=true

**DoD**
- Login works and state loads

---

## 14) UI Features
- Create habit form -> `POST /api/habits`
- Rename habit -> `PATCH /api/habits/:id`
- Save today -> `POST /api/habits/:id/save`
- Confetti on successful save
- Display AI message when returned

**DoD**
- Refresh keeps UI consistent
- allDone blocks save in UI

---

## 15) Frontend Tests
- Render tests based on HabitState
- Interaction tests:
  - save button disabled if checkedInToday/allDone
  - box click only when canEdit true (UI level)

**DoD**
- FE tests pass

---

# PHASE 3 — DEVOPS LEARNING TRACK (DOCKER → KUBERNETES → CI/CD)

## 16) Docker Basics (Learn + Apply)
- Learn concepts: image, container, Dockerfile, compose, volumes
- Dockerize backend
- Use docker-compose for local dev:
  - API container
  - Postgres container (with volume)

**DoD**
- `docker compose up` runs API + DB
- Postman can call `/health` and habit endpoints

---

## 17) Kubernetes Basics (Local only: kind/minikube)
- Learn concepts: pod, deployment, service, configmap, secret, probes
- Add `k8s/` manifests:
  - Deployment for API (2 replicas)
  - Service
  - ConfigMap + Secret
  - Readiness + liveness probes hitting `/health`
- Deploy to local cluster
- Access using port-forward

**DoD**
- 2 pods ready
- killing a pod recreates it
- rolling update works (change image tag and apply)

---

## 18) CI/CD (GitHub Actions)
### CI workflow (on PR/push)
- Install deps
- Lint
- Typecheck
- Test
- Build

### Docker image publish workflow (main branch)
- Build image
- Publish to GHCR with tag (commit SHA + latest)

**DoD**
- PR checks are green
- image appears in GHCR after merge to main

---

# PHASE 4 — AWS (EC2 + Nginx + PM2) + CLOUD TRACK (Junior Cloud Ready)

## 19) AWS Prep (After BE+FE Stable)
- Create simple architecture diagram:
  - Browser -> Nginx -> Node API -> RDS
- Decide DB hosting:
  - RDS Postgres (recommended)

**DoD**
- Diagram committed in `ARCHITECTURE.md`

---

## 20) Provision AWS (Manual first)
- Launch EC2 Ubuntu
- Security group:
  - 22 (SSH) restricted to your IP
  - 80/443 open
- Create RDS Postgres:
  - not public
  - inbound allowed only from EC2 security group

**DoD**
- SSH works
- RDS reachable from EC2 only

---

## 21) Deploy Backend on EC2 (PM2 + Nginx)
- Install Node, PM2, Nginx
- Pull/build backend
- Set env vars
- Run Prisma migrations on RDS
- Start backend with PM2
- Configure Nginx reverse proxy `/api` -> backend

**DoD (Postman)**
- `/health` works from EC2 domain/IP
- login works in production
- private endpoints work

---

## 22) Deploy Frontend on EC2 (Nginx static)
- Build frontend
- Serve static build from Nginx
- SPA routing config
- `/api` proxies correctly

**DoD**
- landing + dashboard work from EC2 URL

---

## 23) HTTPS + Domain (Production polish)
- Setup HTTPS using Let’s Encrypt (Certbot)
- Force HTTPS
- Confirm auth cookie works under HTTPS

**DoD**
- HTTPS enabled
- no mixed content
- cookie auth still works

---

## 24) Cloud “Standout” Add-ons (Do after first successful deploy)
- CloudWatch logs for Node + Nginx
- Basic alarms (CPU, status check)
- Secrets via SSM Parameter Store (or Secrets Manager)
- Optional IaC:
  - Terraform for VPC/EC2/RDS/SG/IAM
- Optional CD:
  - GitHub Actions deploy to EC2 (SSH + PM2 restart)

**DoD**
- Logs visible in CloudWatch
- Deploy workflow can update EC2 reliably
- (If IaC) infra can be recreated from code

---