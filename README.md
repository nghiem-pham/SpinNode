# SpinNode

A full-stack social hiring platform connecting job seekers and recruiters. Streamlined job discovery, a developer resource hub, community forums, and real-time direct messaging — all in one place.

**Live:** [spin-node.com](https://spin-node.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7 |
| UI | Radix UI, Lucide React, Sonner |
| Backend | Java 17, Spring Boot 3.5, Spring Security + JWT |
| Database | PostgreSQL 18 |
| Auth | JWT (60 min access / 7 day refresh), Google OAuth 2.0 |
| AI | Groq API — `llama-3.3-70b-versatile` (resume parsing + job matching) |
| Resume | Apache PDFBox 3.0.3 (PDF → extracted text → Groq) |
| Logos | logo.dev API |
| Infra | Docker (multi-stage), Render (backend), Vercel (frontend) |

---

## System Design

### Architecture

```
Browser (React + Vite)
  │  REST API calls
  │  WebSocket (/ws/messages)
  ▼
Spring Boot 3.5 (port 8080)
  ├─ REST API        auth, jobs, profile, forums, messaging, search, recruiter
  ├─ WebSocket hub   fan-out to conversation participants
  ├─ Groq AI         resume parsing + skill-based job matching
  └─ PDFBox          PDF → extracted text → Groq → structured profile fields
        │
        ▼
  PostgreSQL  ── users, jobs, companies, profiles, forums, messages, preferences
```

### Key Data Flows

| Flow | Path |
|---|---|
| Job discovery | Fetch all jobs → client-side filter + sort by preference match score |
| Resume match | Upload PDF → PDFBox extracts text → Groq parses skills → top 5 jobs matched by skill overlap |
| Direct message | Send via REST → WebSocket fan-out to conversation participants → archived in PostgreSQL |
| Follow | POST /users/:id/follow → follower count updated → reflected in People directory |
| Forum reply | POST reply → reply count incremented on thread → visible in thread detail |
| Profile update | PATCH /profile → avatar/cover stored as base64 TEXT → served back on next load |

### Database Schema (key tables)

```
┌──────────────────────────────────────┐
│               users                  │
├──────────────────────────────────────┤
│ id            BIGSERIAL              │ PK
│ email         VARCHAR                │ UNIQUE
│ display_name  VARCHAR                │
│ password_hash VARCHAR                │ nullable — null for OAuth users
│ role          ENUM                   │ JOB_SEEKER | RECRUITER
│ created_at    TIMESTAMPTZ            │
└──────────────┬───────────────────────┘
               │ 1:1
               ▼
┌──────────────────────────────────────┐
│           user_profiles              │
├──────────────────────────────────────┤
│ id             BIGSERIAL             │ PK
│ user_id        BIGINT                │ FK → users  ON DELETE CASCADE
│ bio            TEXT                  │
│ location       VARCHAR               │
│ avatar_url     TEXT                  │ base64 data URL or null
│ cover_url      TEXT                  │ base64 data URL or null
│ profile_visible BOOLEAN              │ default TRUE
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│               jobs                   │
├──────────────────────────────────────┤
│ id            BIGSERIAL              │ PK
│ title         VARCHAR                │
│ company_id    BIGINT                 │ FK → companies
│ location      VARCHAR                │
│ type          VARCHAR                │ Full-time | Internship | …
│ description   TEXT                   │
│ requirements  TEXT[]                 │
│ salary        VARCHAR                │ nullable
│ apply_url     TEXT                   │
│ posted_at     TIMESTAMPTZ            │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│           conversations              │
├──────────────────────────────────────┤
│ id            BIGSERIAL              │ PK
│ created_at    TIMESTAMPTZ            │
│                                      │
│ ← conversation_participants          │
│   user_id FK, conversation_id FK     │
└──────────────┬───────────────────────┘
               │ 1:N
               ▼
┌──────────────────────────────────────┐
│             messages                 │
├──────────────────────────────────────┤
│ id            BIGSERIAL              │ PK
│ conversation_id BIGINT               │ FK → conversations
│ sender_id     BIGINT                 │ FK → users
│ content       TEXT                   │
│ read          BOOLEAN                │ default FALSE
│ sent_at       TIMESTAMPTZ            │
└──────────────────────────────────────┘
```

---

## Features

### Smart Job Board
Two-panel layout with 120+ real Summer 2026 SWE & AI internship roles.

- Jobs ranked by match score against your onboarding preferences
- Client-side filters: work mode, job type, experience level, date posted, location, saved-only
- Upload a PDF or TXT resume — Groq extracts your skills and returns the top 5 matched jobs
- Save jobs with a bookmark; track applications locally
- Direct apply links to company career pages

### Profile Builder
Full public profile with visibility control.

- Edit bio, location, avatar, and cover image (crop/zoom editor included)
- Upload a PDF resume — Groq extracts name, bio, location, skills, experiences, and projects and pre-fills your profile
- Add and reorder work experience, skills, and projects
- Toggle profile visibility (public / private)
- Public profile viewable by other users and recruiters

### Dev Hub
Curated directory of 23 developer tools across five categories.

- Categories: Dev Tools, Algorithms, AI & Data, Deploy, API Testing
- Search by name, description, or tag
- Quick-launch cards with logos, descriptions, and tags

### Community Forums
Threaded discussion board with real-time counts.

- Browse threads by category with view, reply, and upvote counts
- Create threads with title, body, and category tags
- Inline replies with upvoting and pinned/locked status
- Delete your own replies; reply count updates in real time

### People
Discover and connect with other users.

- Search users by name
- Follow / unfollow with live follower count
- Public profile view with activity tabs: Posts, Comments, Liked

### Direct Messaging
Persistent real-time conversations accessible from anywhere.

- Floating message widget on every page
- Click Message on any profile or forum thread to start a conversation
- WebSocket delivery with read receipts
- Full conversation history persisted in PostgreSQL

---

## Getting Started

**Prerequisites:** Node.js 20+, Java 17+, PostgreSQL

```bash
git clone https://github.com/nghiem-pham/SpinNode.git
cd SpinNode

# Backend — set in server/src/main/resources/application-local.yml or as env vars:
# DB_URL, DB_USERNAME, DB_PASSWORD, JWT_SECRET,
# GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GROQ_API_KEY, FRONTEND_URL

# Frontend — set in client/.env:
# VITE_LOGO_DEV_TOKEN

# Create the database
psql -U postgres -c "CREATE DATABASE spinnode;"

# Start the backend (Flyway runs migrations automatically)
cd server && ./mvnw spring-boot:run   # → http://localhost:8080

# Start the frontend
cd ../client && npm install && npm run dev   # → http://localhost:5173
```

---

## Roadmap

- [ ] Recruiter dashboard — post/manage job listings and browse talent pool
- [ ] Job application tracker
- [ ] Email notifications
- [ ] Company pages with open roles feed
- [ ] Mobile app
