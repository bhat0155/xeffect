# Kubernetes Integration Roadmap

## Executive Summary
Right now, Docker gives you the packaged building blocks: one container for frontend, one for backend, one for database. This roadmap upgrades that setup into a managed system where Kubernetes runs those containers continuously, reconnects them if they fail, and keeps your app reachable with stable internal networking.

In practical terms, you are creating a mini production-style platform for this project. Kubernetes will manage three core responsibilities for you: persistent database storage, service-to-service communication (`backend` to `db`), and external traffic routing (`/api`, `/auth`, `/docs`, `/`) through a single ingress entry point.

By the end, you will not just have "containers running." You will have a predictable, repeatable deployment flow where each resource is applied, verified, and understood step-by-step, which is exactly how cloud-native systems are operated in real teams.

## 1) High-Level Overview (Beginner-Friendly)
Kubernetes (k8s) is a platform that runs and manages your containers for you.

Think of it like this:
- Docker builds and runs containers.
- Kubernetes decides where containers run, keeps them healthy, restarts failed ones, scales them up/down, and connects them together.

For this repo, Kubernetes would become the "control system" for your existing Dockerized services:
- `frontend` (React/Vite)
- `backend` (Express/Prisma)
- `db` (Postgres, for local/dev cluster setup)

## 2) The "Why" (Why Kubernetes on Top of Docker?)
You already use Docker correctly, so Kubernetes is the next layer for orchestration.

Docker alone is great for:
- Packaging each app into an image
- Running local multi-container apps with Compose

Kubernetes adds what Docker/Compose do not handle well at scale:
- Self-healing: if `backend` crashes, k8s recreates it automatically.
- Scaling: run multiple backend pods (`replicas`) behind one stable Service.
- Rolling updates: deploy new versions with minimal downtime.
- Built-in service discovery: pods call `backend` by DNS service name, not hardcoded host IPs.
- Better ops model: health probes, namespaces, secrets/config separation, and standardized deploys.

In your current setup:
- Compose has `depends_on`, but that does not provide full runtime orchestration.
- Secrets are currently in `.env` files; k8s gives a cleaner Secret/ConfigMap pattern.
- You have multiple environments (local Postgres and hosted Supabase) that k8s can manage cleanly with env-based config.

## 3) Project Analysis (Current Architecture -> Kubernetes Objects)
Based on your current files:
- `docker-compose.yml`
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `backend/.env`, `backend/.env.example`, `frontend/.env`
- `backend/src/app.ts` (`/health` endpoint, CORS using `FRONTEND_ORIGIN`)
- `frontend/src/lib/api.ts` (`VITE_API_URL`)

### Current container communication (today)
- `frontend` runs on `5173`, calls API via `VITE_API_URL` (currently `http://localhost:4000`).
- `backend` runs on `4000`, exposes `/health`, `/auth/*`, `/api/*`, `/docs`.
- `backend` connects to Postgres using `DATABASE_URL`.
- Compose local DB service is `db:5432`.

### Kubernetes translation for this specific project
- Pod: one running instance of `frontend`, `backend`, or `db`.
- Deployment:
  - `frontend-deployment`
  - `backend-deployment`
  - `db-deployment` (for learning/local cluster; for production DB, managed DB is better)
- Service:
  - `frontend-svc` (port 5173)
  - `backend-svc` (port 4000)
  - `db-svc` (port 5432, ClusterIP/internal only)
- Ingress:
  - Routes external traffic to `frontend-svc` and optionally route `/api`, `/auth`, `/docs` to `backend-svc`.
- ConfigMap:
  - Non-secret vars (e.g., `FRONTEND_ORIGIN`, `PORT`, `OPEN_AI_MODEL`, maybe `VITE_API_URL` depending on frontend build strategy)
- Secret:
  - Sensitive vars (`DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, `JWT_SECRET`, `OPEN_AI_API_KEY`, etc.)
- Namespace:
  - Isolate all XEffect resources, e.g., `xeffect`.
- PersistentVolumeClaim:
  - For Postgres data in-cluster.

## 4) Mastery Tutorial: Step-By-Step Implementation

Before Step 1, prepare your local cluster and images once:
```bash
minikube start --cpus=4 --memory=8192
minikube addons enable ingress
eval $(minikube docker-env)
docker build -t xeffect-backend:dev ./backend
docker build -t xeffect-frontend:dev ./frontend
mkdir -p k8s
```

For each step below:
- Save the YAML under the exact file path shown in that step.
- Run the step's Action command.
- Complete the DoD checks before moving to the next step.

## Step 1: Namespace (Isolation)
### The "What" and "Why"
`Namespace` is a logical boundary inside Kubernetes.  
For this project, `xeffect` keeps your frontend, backend, DB, secrets, and ingress resources grouped together so they do not mix with other apps in your cluster.

### The Code
`k8s/00-namespace.yaml`
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: xeffect
```

### The Action
```bash
kubectl apply -f k8s/00-namespace.yaml
```

### Definition of Done (DoD)
1. `kubectl get ns`
   You should see `xeffect` in the list with `Active` status.
2. `kubectl describe ns xeffect`
   You should see namespace metadata and no error events.
3. `kubectl -n xeffect get all`
   You should get `No resources found in xeffect namespace` (expected at this stage).

## Step 2: ConfigMaps & Secrets (Configuration)
### The "What" and "Why"
`ConfigMap` stores non-sensitive config and `Secret` stores sensitive values.  
Your backend currently reads env vars like `PORT`, `FRONTEND_ORIGIN`, `DATABASE_URL`, `GOOGLE_CLIENT_SECRET`, and `JWT_SECRET`. In k8s, we split these cleanly so config and credentials are managed centrally.

### The Code
`k8s/01-configmap.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: xeffect-config
  namespace: xeffect
data:
  PORT: "4000"
  FRONTEND_ORIGIN: "http://xeffect.local"
  FRONTEND_APP_REDIRECT: "http://xeffect.local/app"
  GOOGLE_CALLBACK_URL: "http://xeffect.local/auth/google/callback"
  OPEN_AI_MODEL: "gpt-4.1-mini"
```

Create Secret from CLI so secrets are not committed:
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

### The Action
```bash
kubectl apply -f k8s/01-configmap.yaml
kubectl -n xeffect create secret generic xeffect-secrets \
  --from-literal=DATABASE_URL='postgresql://xeffect:xeffect@db-svc:5432/xeffect' \
  --from-literal=GOOGLE_CLIENT_ID='REPLACE_ME' \
  --from-literal=GOOGLE_CLIENT_SECRET='REPLACE_ME' \
  --from-literal=JWT_SECRET='REPLACE_ME' \
  --from-literal=PUBLIC_HABIT_EMAIL='REPLACE_ME' \
  --from-literal=OPEN_AI_API_KEY='REPLACE_ME' \
  --dry-run=client -o yaml | kubectl apply -f -
```

### Definition of Done (DoD)
1. `kubectl -n xeffect get configmap xeffect-config`
   Status should show the configmap exists.
2. `kubectl -n xeffect get secret xeffect-secrets`
   Secret should exist with type `Opaque`.
3. `kubectl -n xeffect describe configmap xeffect-config`
   You should see keys like `PORT`, `FRONTEND_ORIGIN`, `GOOGLE_CALLBACK_URL`.

## Step 3: Persistent Volume & Claim (Data Persistence for our DB)
### The "What" and "Why"
A `PersistentVolumeClaim` (PVC) is requested storage that survives pod restarts.  
Your Postgres container stores data in `/var/lib/postgresql/data`; without a PVC, data can be lost when DB pods are recreated.

### The Code
`k8s/11-db-pvc.yaml`
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: db-pvc
  namespace: xeffect
spec:
  accessModes: 
  - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
```

### The Action
```bash
kubectl apply -f k8s/11-db-pvc.yaml
```

### Definition of Done (DoD)
1. `kubectl -n xeffect get pvc`
   `db-pvc` should show `STATUS=Bound`.
2. `kubectl -n xeffect describe pvc db-pvc`
   You should see `Capacity` and a bound volume name.
3. `kubectl get pv`
   You should see a PV bound to `xeffect/db-pvc`.

## Step 4: The Database Deployment & Service (Our internal backbone)
### The "What" and "Why"
`Deployment` keeps the Postgres pod running; `Service` gives it a stable DNS name (`db-svc`) inside the cluster.  
Your backend `DATABASE_URL` can then always point to `db-svc:5432`, even if the DB pod is recreated.

### The Code
`k8s/20-db.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: db
  namespace: xeffect
spec:
  replicas: 1
  selector:
    matchLabels:
      app: db
  template:
    metadata:
      labels:
        app: db
    spec:
      containers:
      - name: postgres
        image: postgres:16-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_USER
          value: xeffect
        - name: POSTGRES_PASSWORD
          value: xeffect
        - name: POSTGRES_DB
          value: xeffect
        volumeMounts:
        - name: db-data
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: db-data
        persistentVolumeClaim:
          claimName: db-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: db-svc
  namespace: xeffect
spec:
  selector:
    app: db
  ports:
  - port: 5432
    targetPort: 5432
```

### The Action
```bash
kubectl apply -f k8s/20-db.yaml
```

### Definition of Done (DoD)
1. `kubectl -n xeffect get pods -l app=db`
   Pod should move to `Running` and `READY 1/1`.
2. `kubectl -n xeffect get svc db-svc`
   Service should exist with `CLUSTER-IP` and port `5432/TCP`.
3. `kubectl -n xeffect logs deploy/db --tail=50`
   Logs should show Postgres startup and "ready to accept connections".

## Step 5: The Backend Deployment & Service (Our logic layer with health checks)
### The "What" and "Why"
`Deployment` runs your Express API (`4000`) with replicas and health probes.  
`Service` exposes it internally as `backend-svc` for ingress routing.  
This is where `/health`, `/api/*`, `/auth/*`, and `/docs` live in your project.

Learning Note:  
`command: ["sh", "-c", "npx prisma migrate deploy && npm start"]` means "run DB migrations first, then start the server."  
If migrations fail, the app does not start, which protects you from running code against an outdated schema. This is a core cloud-native practice: app startup should enforce schema consistency automatically.

### The Code
`k8s/30-backend.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: xeffect
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: xeffect-backend:dev
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 4000
        envFrom:
        - configMapRef:
            name: xeffect-config
        - secretRef:
            name: xeffect-secrets
        command: ["sh", "-c", "npx prisma migrate deploy && npm start"]
        readinessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 10
          periodSeconds: 10
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 20
---
apiVersion: v1
kind: Service
metadata:
  name: backend-svc
  namespace: xeffect
spec:
  selector:
    app: backend
  ports:
  - port: 4000
    targetPort: 4000
```

### The Action
```bash
kubectl apply -f k8s/30-backend.yaml
```

### Definition of Done (DoD)
1. `kubectl -n xeffect get pods -l app=backend`
   You should see 2 pods, both `Running` and `READY 1/1`.
2. `kubectl -n xeffect get svc backend-svc`
   Service should exist on port `4000/TCP`.
3. `kubectl -n xeffect logs deploy/backend --tail=100`
   You should see app startup and no Prisma connection failure messages.

## Step 6: The Frontend Deployment & Service (Our UI layer)
### The "What" and "Why"
`Deployment` runs your current frontend container (Vite server on `5173`).  
`Service` exposes it internally as `frontend-svc`, which ingress will use as the default route (`/`).

### The Code
`k8s/40-frontend.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: xeffect
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: xeffect-frontend:dev
        imagePullPolicy: IfNotPresent
        ports:
        - containerPort: 5173
        env:
        - name: VITE_API_URL
          value: "http://xeffect.local"
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-svc
  namespace: xeffect
spec:
  selector:
    app: frontend
  ports:
  - port: 5173
    targetPort: 5173
```

### The Action
```bash
kubectl apply -f k8s/40-frontend.yaml
```

### Definition of Done (DoD)
1. `kubectl -n xeffect get pods -l app=frontend`
   Pod should be `Running` and `READY 1/1`.
2. `kubectl -n xeffect get svc frontend-svc`
   Service should exist on `5173/TCP`.
3. `kubectl -n xeffect logs deploy/frontend --tail=50`
   You should see Vite server start message and no crash loop.

## Step 7: Ingress (The Doorway to the world)
### The "What" and "Why"
`Ingress` is the entry point from browser traffic into your cluster.  
For this project, it reproduces your Vercel-style routing:
- `/api`, `/auth`, `/docs` -> `backend-svc:4000`
- everything else -> `frontend-svc:5173`

### The Code
`k8s/50-ingress.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: xeffect-ingress
  namespace: xeffect
  annotations:
    nginx.ingress.kubernetes.io/rewrite-target: /$2
spec:
  ingressClassName: nginx
  rules:
  - host: xeffect.local
    http:
      paths:
      - path: /api(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: backend-svc
            port:
              number: 4000
      - path: /auth(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: backend-svc
            port:
              number: 4000
      - path: /docs(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: backend-svc
            port:
              number: 4000
      - path: /health(/|$)(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: backend-svc
            port:
              number: 4000
      - path: /(.*)
        pathType: ImplementationSpecific
        backend:
          service:
            name: frontend-svc
            port:
              number: 5173
```

### The Action
```bash
kubectl apply -f k8s/50-ingress.yaml
echo "$(minikube ip) xeffect.local" | sudo tee -a /etc/hosts
```

### Definition of Done (DoD)
1. `kubectl -n xeffect get ingress xeffect-ingress`
   Ingress should exist with host `xeffect.local`.
2. `curl http://xeffect.local/health`
   Should return backend JSON response with `ok: true`.
3. `curl -I http://xeffect.local/docs` and `curl -I http://xeffect.local/`
   `/docs` should route to backend and `/` should route to frontend without 502/503.

## 6) Practical Notes for Your Resume
- Keep Docker + Compose for local development onboarding.
- Add `k8s/` manifests and a short "Kubernetes local deployment" section in README.
- Mention concrete achievements:
  - Namespaced deployment (`xeffect`)
  - Ingress path routing for `/api`, `/auth`, `/docs`
  - ConfigMap/Secret env management
  - Health probes and rolling updates on backend

## 7) Recommended Next Improvements (After Initial Integration)
1. Convert `db` Deployment -> StatefulSet for stronger DB semantics.
2. Replace frontend dev server container with nginx static build for production.
3. Use Sealed Secrets or External Secrets instead of plain secret creation commands.
4. Add CI pipeline to build/tag/push images and `kubectl apply` to a cluster.
5. Add resource requests/limits and HPA for backend.
