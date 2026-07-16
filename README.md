# QA Test Management

Monorepo with separate **frontend** and **backend**, backed by Airtable. Track projects, test cases, bugs, and team invites with email/password auth.

## Structure

```
frontend/   Next.js UI (port 3000)
backend/    Express API + Airtable (port 4000)
```

## Setup

```bash
npm install
```

### Environment

Copy examples and fill in values:

- `backend/.env` ← from `backend/.env.example`
- `frontend/.env.local` ← from `frontend/.env.example`

| Variable | Where | Purpose |
|----------|-------|---------|
| `AIRTABLE_PAT` | backend | Airtable personal access token (needs **read + write** on the base) |
| `AIRTABLE_BASE_ID` | backend | Airtable base ID |
| `AUTH_SECRET` | backend | Secret used to sign JWT sessions |
| `ADMIN_EMAILS` | backend | Comma-separated emails that always get **full** access |
| `FRONTEND_ORIGIN` | backend | CORS origin (default `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | frontend | Backend URL (default `http://localhost:4000`) |

Restart the backend after changing `backend/.env`.

### Airtable

Existing tables: `projects`, `Test cases`, `Team members`, `bugs`.

Also create a **Users** table for auth:

| Field | Type |
|-------|------|
| Email | Email |
| Name | Single line text |
| Password Hash | Single line text |

Do **not** store plain passwords. Signup writes a bcrypt hash into **Password Hash**.

**Team members** should include an **Email** field and a **Deleted** checkbox (unchecked = active invite).

Your PAT must include scopes such as `data.records:read`, `data.records:write`, and access to this base.

## Run

```bash
# verify Airtable connection (including Users)
npm run test:connection

# start API + UI together
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Health: http://localhost:4000/api/health

## Auth & access

1. Open `/signup` and create an account (password min 8 characters).
2. Sign in at `/login`.
3. Access is resolved on each request:

| Condition | Access |
|-----------|--------|
| Email listed in `ADMIN_EMAILS` | Full |
| Email matches an active Team members row | Full |
| Everyone else | Read-only |

`ADMIN_EMAILS` must match the email you signed up with (case-insensitive). It does not create an account by itself.

Full-access users can edit data and manage the Team page. Read-only users can browse but not write.

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Airtable connection check |
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Sign in |
| GET | `/api/auth/me` | Current session (Bearer token) |
| CRUD | `/api/projects` | Projects |
| CRUD | `/api/test-cases` | Test cases |
| CRUD | `/api/team-members` | Team members (full access only) |
| CRUD | `/api/bugs` | Bugs |

Authenticated resource routes expect `Authorization: Bearer <token>`. Writes require full access.
