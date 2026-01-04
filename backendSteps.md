Backend Setup (Project + Tooling)
	1.	Create project folder + initialize git repo
	2.	npm init -y
	3.	Install runtime deps: express cors helmet cookie-parser passport passport-google-oauth20 jsonwebtoken dotenv prisma @prisma/client
	4.	Install dev deps: typescript ts-node nodemon @types/node @types/express @types/cors @types/cookie-parser @types/jsonwebtoken @types/passport
	5.	Create tsconfig.json
	6.	Add scripts in package.json: dev, build, start
	7.	Create folder structure: src/ → routes/, middleware/, services/, utils/, config/
	8.	Create .env + .env.example

⸻

Express Server (Base App)
	9.	Create src/server.ts
	10.	Add middleware: helmet(), cors({ origin, credentials:true }), cookieParser(), express.json()
	11.	Start server + confirm it runs (GET /health can be a placeholder for now)

⸻

Database (Prisma + Postgres)
	12.	npx prisma init
	13.	Define Prisma models: User, Habit, HabitCheckin
	14.	Add constraints:

	•	unique User.email
	•	unique User.googleId
	•	unique Habit.publicSlug
	•	unique (habitId, checkinDate) in HabitCheckin

	15.	Add relations + cascade delete (Habit → HabitCheckin)
	16.	Run migration: npx prisma migrate dev --name init
	17.	Create Prisma client singleton (e.g., src/config/prisma.ts)

⸻

Authentication (Google OAuth + JWT Cookie)
	18.	Configure Passport Google strategy (e.g., src/config/passport.ts)
	19.	Create auth routes:

	•	GET /auth/google
	•	GET /auth/google/callback

	20.	In callback: find/create user in DB
	21.	Generate JWT (signed) containing your internal userId
	22.	Set JWT in httpOnly cookie + redirect to frontend
	23.	Create requireAuth middleware (verify JWT from cookie, attach req.userId)

⸻

Core Engine (UTC Day + Streak State)
	24.	Create UTC helpers: getTodayUTCDate(), getYesterdayUTCDate()
	25.	Create state engine service:

	•	fetch active habit for user
	•	fetch recent checkins
	•	compute currentStreak, checkedInToday, allDone
	•	build boxes[21] ({day, status, canEdit})

	26.	Define a single response shape HabitState returned to frontend

⸻

Private APIs (User Habit Flow)
	27.	GET /api/habits/me → return habit state (or empty state if none)
	28.	POST /api/habits → delete existing habit + cascade checkins, create new habit, return state
	29.	PATCH /api/habits/:id → edit habit name
	30.	POST /api/habits/:id/save → insert today checkin if missing (no undo), recompute streak, update bestStreak, set allDone if 21, return state
	31.	Enforce ownership checks on all habit endpoints
	32.	Enforce allDone check (reject saves when completed)

⸻

Public API (Ekam Landing Page)
	33.	GET /api/public/:publicSlug → return read-only habit state (canEdit=false for all boxes)

⸻

AI Milestones (Optional Layer)
	34.	Add Habit fields: lastMilestoneReached (and optional cached message fields)
	35.	In save flow: if streak hits 1/3/7/14/21 and not yet reached → call OpenAI, store milestone, return message

⸻

Hardening (Required for Production Feel)
	36.	Add centralized error handler + standard error codes
	37.	Add rate limiting (at least /save and AI endpoint behavior)
	38.	Add logging (basic request + error logs)

⸻

Testing + Verification
	39.	Add minimal unit tests for streak computation + missed-day reset + completion (21)
	40.	Local smoke test: login → create habit → save → refresh → verify state

⸻

Deployment (AWS)
	41.	Add /health endpoint (if not already)
	42.	Deploy Postgres (RDS) + run migrations
	43.	Deploy API (App Runner) with env vars/secrets
	44.	Production smoke test: auth → create → save → public route