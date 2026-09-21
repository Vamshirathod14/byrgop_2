# BYRGOP — Phase 1 Interactive Business Assessment

A premium, animated onboarding assessment: **Understand → Assess → Analyse → Visualise → Guide**.

Three separate apps sharing one API:

```
byrgop/
├── backend/    Node + Express + Mongoose  →  http://localhost:5000
├── frontend/   Vite + React + Tailwind + Framer Motion + Recharts  →  http://localhost:5175
└── admin/      Vite + React + Tailwind  →  http://localhost:5174
```

## Requirements

- Node 18+ and MongoDB running locally (`mongod` on `127.0.0.1:27017`).

## Setup & run

```bash
# 1. Backend
cd backend
npm install
cp .env.example .env   # if not present; adjust secrets before running
npm run seed           # idempotent placeholder content (categories, demo questions, result bands)
npm run dev            # http://localhost:5000

# 2. Frontend (new terminal)
cd frontend
npm install
npm run dev            # http://localhost:5175

# 3. Admin (new terminal)
cd admin
npm install
npm run dev            # http://localhost:5174
```

### First-run Super Admin

The backend auto-bootstraps an initial **Super Admin** on startup when the env vars are set:

- `ADMIN_JWT_SECRET` — JWT signing secret (change from the default!)
- `ADMIN_JWT_EXPIRES` — token lifetime (default `8h`)
- `ADMIN_BCRYPT_ROUNDS` — bcrypt cost (default `12`)
- `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` — credentials created if no Super Admin exists

The bootstrap is one-time: after the first run, remove `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`
from `.env` to prevent re-creation. Additional admins are managed in the Admin Console
(**Management → Admins**, Super Admins only) with role- and permission-based access
(`dashboard.view`, `questions.manage`, `audit.view`, `admins.view`, …).

Each app also builds with `npm run build`.

## How the assessment works

1. `POST /api/v1/assessments` creates a session and rolls **1 question per category**
   (Strategic, Operational, Revenue — random each session).
2. The intro **gate** asks *"Are you a Business Owner / Decision Maker?"* → **Let's Begin**.
3. The frontend shows **one full-screen question per category** (Strategic → Operational →
   Revenue) with a prominent **30 s circular timer**, then a **Submit** step.
4. Answers are submitted to `POST /assessments/:id/answer`; the backend **enforces the timer
   using the timestamp the question was issued** (issues are logged server-side).
5. On timeout the backend rejects late answers; the frontend reports the timeout and the API
   **re-rolls a different random question from the same category** with a fresh 30 s.
6. `GET /assessments/:id/result` runs the **weighted scoring engine** and returns three
   category percentages (0–100) plus the matching result band (interpretation + recommendations).
7. The result screen shows **"Your Business Snapshot"** with an animated **donut chart**
   (hover → highlight + popup) and two actions: **Know Yourself** and **BYRGOP**
   (destinations stubbed to `#` for now).

### Scoring formula

```
category% = Σ( answerScore × questionWeight ) / Σ( maxOptionScore × questionWeight ) × 100
```

Weights and per-option scores come entirely from the Admin Panel — nothing is hard-coded.

## Branding

**Colors are centralized in `theme/brand.js`** in each app and derived directly from the
official BYRGOP logo. The logo's icon mark carries the six brand colours:

| Blue | Yellow | Red | Green | Orange | Purple |
| --- | --- | --- | --- | --- | --- |
| `#0A78CF` | `#FCA700` | `#E52032` | `#0D8845` | `#F5630D` | `#7038A5` |

- The logo asset is used exactly as provided: `frontend/public/byrgop-logo.png` (and a copy in
  `admin/public/`). The only change is a transparent background so it renders on the dark UI;
  `byrgop-logo-original.jpg` is the untouched original.
- Category mapping for the assessment: **Strategic = Blue, Operational = Green,
  Revenue = Orange**. Yellow = primary action accent, Red = timeout/danger,
  Purple = subtle premium accent. Category colours flow from the Admin Categories screen into
  the result chart.
- To swap or update any colour, edit only the `palette`/`ink` object in the two `theme/brand.js`
  files — nothing is hard-coded in components.

## API reference (`/api/v1`)

| Method | Route | Purpose |
| --- | --- | --- |
| POST | `/assessments` | Create session, roll 3 questions (one per category) |
| GET | `/assessments/:id/next/:category` | Issue a random question for a category (used at start and on re-roll) |
| POST | `/assessments/:id/answer` | Submit an answer; server validates the 30 s timer |
| POST | `/assessments/:id/timeout` | Record a timed-out question (for analytics + exclusion) |
| GET | `/assessments/:id/result` | Compute weighted scores + result content |
| GET | `/admin/stats` | Session/content overview numbers |
| GET | `/admin/sessions` / `/admin/sessions/:id` | Review submitted assessments |
| CRUD | `/admin/categories`, `/admin/questions`, `/admin/results` | Manage content & scoring |
| POST | `/admin/auth/login` | Admin login (JWT + rate limited) |
| GET | `/admin/dashboard` | KPI + chart data for the admin console |
| GET | `/admin/activity` | Audit trail of admin actions |
| CRUD | `/admin/admins` | Super Admin–only admin account management |

All `/admin/*` routes (except login) require an `Authorization: Bearer <token>` header from
`POST /admin/auth/login`. Permissions gate each endpoint (e.g. `dashboard.view`, `sessions.view`).
Every mutating admin action is written to the audit log (`AuditLog`)

## Notes

- `backend/scripts/seed.js` loads **placeholder demo content** (clearly marked `BYRGOP-DEMO`).
  Replace or edit all questions, weights, options, and result bands from the Admin Panel.
- Seeding is idempotent and re-runnable; it replaces only previously-seeded demo content.
- Frontend strictly consumes the API; it contains no questions, weights, or scoring rules.
