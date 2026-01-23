# Deployment Guide (Manual AWS Path)


---

## 0) Prerequisites (one‑time setup)
1) Install tools:
   - Docker
   - AWS CLI
   - Terraform
2) Configure AWS CLI:
```
aws configure
```
3) Create an AWS account with billing enabled.

---

## 1) Containerize the backend
1) Create `backend/Dockerfile` (multi‑stage build).
2) Create `backend/.dockerignore`.
3) (Optional) Add `docker-compose.yml` for local testing.

**Test locally**
```
docker build -t xeffect-backend ./backend
docker run -p 4000:4000 --env-file backend/.env xeffect-backend
```

**DoD**
- Container boots and `/health` returns 200.

---

## 2) Create AWS ECR (container registry)
1) Create ECR repo:
```
aws ecr create-repository --repository-name xeffect-backend
```
2) Authenticate Docker to ECR:
```
aws ecr get-login-password --region <region> \
| docker login --username AWS --password-stdin <account-id>.dkr.ecr.<region>.amazonaws.com
```
3) Tag + push image:
```
docker tag xeffect-backend:latest <account-id>.dkr.ecr.<region>.amazonaws.com/xeffect-backend:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/xeffect-backend:latest
```

**DoD**
- Image exists in ECR.

---

## 3) Deploy backend with AWS App Runner
1) App Runner → Create Service:
   - Source: ECR image
   - Port: `4000`
2) Configure environment variables:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `FRONTEND_ORIGIN`
   - `FRONTEND_APP_REDIRECT`
   - `GOOGLE_CALLBACK_URL`
3) Deploy.

**DoD**
- App Runner URL responds to `/health`.

---

## 4) Secrets Management (AWS)
Use **SSM Parameter Store** or **Secrets Manager**:
1) Create parameters for each secret.
2) Grant App Runner IAM role permission to read them.
3) Inject secrets via App Runner config.

**DoD**
- No secrets are stored in code or committed files.

---

## 5) Custom backend domain
1) Route53 → Create hosted zone for your domain.
2) Create a record for `api.yourdomain.com` pointing to App Runner.
3) Request HTTPS cert (App Runner supports managed certs).

**DoD**
- `https://api.yourdomain.com/health` returns 200.

---

## 6) CI/CD (GitHub Actions)
**Goal:** build + push image to ECR on each main merge.

Pipeline outline:
1) Install deps
2) Run tests (optional)
3) Build Docker image
4) Push to ECR
5) App Runner auto‑deploys on new image

**DoD**
- Push to `main` produces a new ECR image.

---

## 7) Infrastructure as Code (Terraform)
Create an `infra/terraform` directory and manage:
- ECR repository
- App Runner service
- IAM roles/policies
- Route53 records

**DoD**
- `terraform apply` reproduces the full backend stack.

---

## 8) Observability
1) Enable CloudWatch logs (App Runner defaults).
2) Add a basic alarm for 5xx spikes or health check failures.

**DoD**
- Logs visible in CloudWatch.

---

## 9) Production hardening checklist
- Rate limit `/save`
- Restrict CORS to your frontend domain
- Rotate secrets regularly
- Backups for database

---

## Summary
This flow is what hiring teams expect for “cloud engineer” basics:
containers → ECR → App Runner → IaC → CI/CD → secrets → logs.
