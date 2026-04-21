# SpinNode

A full-stack social hiring platform for early-career engineers and recruiters. Job seekers build profiles, browse jobs, complete daily coding challenges, and connect with peers. Recruiters post openings and browse a talent pool. Both sides share community forums, direct messaging, and an AI career assistant.

**Live demo:** [spin-node.com](https://www.spin-node.com)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.5.9, Spring Security, Spring WebSocket |
| Auth | JWT (JJWT 0.12.6), Google OAuth2 |
| Database | PostgreSQL 16, Flyway (26 migrations) |
| Cache | Redis 7 |
| Search | Elasticsearch |
| AI | Groq API (cover letters, career chat) |
| Resume | Apache PDFBox 3 (PDF parsing) |
| Frontend | React 19, TypeScript, Vite 7, Tailwind CSS v4 |
| UI | Radix UI, Lucide React, Sonner |
| Infra | Docker, Vercel |

---

## System Design

### Architecture

```
Browser (React + Vite)
  │  REST API calls ─────────────────────────────────────┐
  │  WebSocket (real-time messages)                       │
  │  OAuth2 redirect flow                                 │
  ▼                                                       │
Spring Boot (port 8080)                                   │
  ├─ AuthController      /auth/register, /auth/login      │
  ├─ UserController      /api/me, /api/users              │
  ├─ ProfileController   /api/profile                     │
  ├─ JobController       /api/jobs                        │
  ├─ ForumController     /api/forums                      │
  ├─ MessagingController /api/messages + WS /ws/messages  │
  ├─ NotificationController /api/notifications            │
  ├─ ChallengeController /api/challenges                  │
  ├─ RecruiterController /api/recruiter                   │
  ├─ AiController        /api/ai  ──────────── Groq API   │
  ├─ ResumeController    /api/resume ──── PDFBox parser   │
  ├─ SearchController    /api/search ──── Elasticsearch   │
  └─ PostController      /api/posts                       │
       │                                                  │
       ├── PostgreSQL (JPA + Flyway)                      │
       └── Redis (session cache)                    ◄─────┘

OAuth2 flow:
  Browser → /oauth2/authorization/google → Google → /auth/callback
  → Spring exchanges code → JWT issued → frontend stores token
```

### Key Data Flows

| Flow | Path |
|---|---|
| Email signup | `POST /auth/register` → hash password → persist user → return JWT |
| Google login | Browser → Google OAuth → `/auth/callback` → upsert user → return JWT |
| JWT auth | Every request → `JwtAuthFilter` → validate token → inject `SecurityContext` |
| Onboarding gate | Frontend `ProtectedRoute` checks `onboardingComplete` → redirect to `/onboarding` |
| Real-time message | `POST /api/messages/.../messages` → persist → `MessagingRealtimeService` → WebSocket push |
| AI cover letter | `POST /api/ai/cover-letter` → Spring → Groq REST API → streamed text response |
| Resume parse | `POST /api/resume/parse` → PDFBox extracts text → structured profile fields returned |
| Daily challenge | `ChallengeScheduler` (cron) → fetches LeetCode daily → persists → available at `/api/challenges` |

### Database Schema

```
┌──────────────────────────────────────────┐
│                  users                   │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ email         TEXT           UNIQUE       │
│ display_name  TEXT                        │
│ password_hash TEXT           nullable     │  null when Google OAuth
│ google_id     TEXT           nullable     │
│ role          ENUM           JOB_SEEKER   │
│                              RECRUITER    │
│ created_at    TIMESTAMPTZ                 │
└──────────┬───────────────────────────────┘
           │
           │ 1:1
           ▼
┌──────────────────────────────────────────┐
│              user_profiles               │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ user_id       BIGINT         FK → users   │
│ headline      TEXT                        │
│ bio           TEXT                        │
│ avatar_url    TEXT                        │
│ cover_url     TEXT                        │
│ location      TEXT                        │
│ website       TEXT                        │
│ visibility    ENUM           PUBLIC       │
│                              PRIVATE      │
└──────────┬───────────────────────────────┘
           │
           │ 1:N
           ▼
┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│    experiences     │  │  profile_projects  │  │    user_skills     │
├────────────────────┤  ├────────────────────┤  ├────────────────────┤
│ id   BIGINT    PK  │  │ id   BIGINT    PK  │  │ id   BIGINT    PK  │
│ user_id  FK        │  │ user_id  FK        │  │ user_id  FK        │
│ title  TEXT        │  │ name  TEXT         │  │ name  TEXT         │
│ company  TEXT      │  │ description  TEXT  │  │ proficiency  TEXT  │
│ start_date DATE    │  │ url  TEXT          │  └────────────────────┘
│ end_date   DATE    │  └────────────────────┘
└────────────────────┘


┌──────────────────────────────────────────┐
│                companies                 │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ name          TEXT                        │
│ logo_url      TEXT                        │
│ industry      TEXT                        │
└──────────┬───────────────────────────────┘
           │
           │ 1:N
           ▼
┌──────────────────────────────────────────┐
│                  jobs                    │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ company_id    BIGINT         FK           │
│ title         TEXT                        │
│ location      TEXT                        │
│ type          ENUM           FULL_TIME    │
│                              PART_TIME    │
│                              INTERNSHIP   │
│ salary_min    INT                         │
│ salary_max    INT                         │
│ apply_url     TEXT                        │
│ created_at    TIMESTAMPTZ                 │
└──────────────────────────────────────────┘

┌────────────────────────┐  ┌──────────────────────────────┐
│       saved_jobs       │  │      job_preferences         │
├────────────────────────┤  ├──────────────────────────────┤
│ user_id  FK → users    │  │ user_id  FK → users  UNIQUE  │
│ job_id   FK → jobs     │  │ roles    TEXT[]               │
│ UNIQUE (user_id,job_id)│  │ locations  TEXT[]             │
└────────────────────────┘  │ work_type  TEXT               │
                             │ salary_min INT                │
                             └──────────────────────────────┘

┌──────────────────────────────────────────┐
│           recruiter_job_postings         │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ recruiter_id  BIGINT         FK → users   │
│ title         TEXT                        │
│ description   TEXT                        │
│ location      TEXT                        │
│ salary_range  TEXT                        │
│ created_at    TIMESTAMPTZ                 │
└──────────────────────────────────────────┘


┌──────────────────────────────────────────┐
│             forum_categories             │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ name          TEXT                        │
│ description   TEXT                        │
└──────────┬───────────────────────────────┘
           │ 1:N
           ▼
┌──────────────────────────────────────────┐
│             forum_threads                │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ category_id   BIGINT         FK           │
│ author_id     BIGINT         FK → users   │
│ title         TEXT                        │
│ content       TEXT                        │
│ upvote_count  INT            default 0    │
│ created_at    TIMESTAMPTZ                 │
└──────────┬─────────────────┬─────────────┘
           │ 1:N             │ 1:N
           ▼                 ▼
┌────────────────────┐  ┌────────────────────┐
│   forum_replies    │  │   thread_upvotes   │
├────────────────────┤  ├────────────────────┤
│ id   BIGINT   PK   │  │ user_id  FK        │
│ thread_id  FK      │  │ thread_id  FK      │
│ author_id  FK      │  │ UNIQUE (user,thread│
│ content  TEXT      │  └────────────────────┘
│ created_at         │
└────────────────────┘


┌──────────────────────────────────────────┐
│             conversations                │
├──────────────────────────────────────────┤
│ id            BIGINT         PK           │
│ created_at    TIMESTAMPTZ                 │
└──────────┬───────────────────────────────┘
           │ 1:N
           ▼
┌──────────────────────────────────────────┐
│        conversation_participants         │
├──────────────────────────────────────────┤
│ conversation_id  FK                       │
│ user_id          FK → users              │
│ UNIQUE (conversation_id, user_id)        │
└──────────┬───────────────────────────────┘
           │ 1:N
           ▼
┌──────────────────────────────────────────┐
│                messages                  │
├──────────────────────────────────────────┤
│ id               BIGINT      PK           │
│ conversation_id  FK                       │
│ sender_id        FK → users              │
│ content          TEXT                    │
│ created_at       TIMESTAMPTZ             │
│                                          │
│ delivered in real-time via WS            │
│ /ws/messages                             │
└──────────────────────────────────────────┘


┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│    challenges      │  │challenge_completions│  │   notifications    │
├────────────────────┤  ├────────────────────┤  ├────────────────────┤
│ id  BIGINT    PK   │  │ user_id  FK         │  │ id  BIGINT    PK   │
│ title  TEXT        │  │ challenge_id  FK    │  │ user_id  FK        │
│ difficulty  TEXT   │  │ completed_at  TS    │  │ content  TEXT      │
│ url  TEXT          │  │ UNIQUE (user,chall) │  │ is_read  BOOLEAN   │
│ date  DATE         │  └────────────────────┘  │ created_at  TS     │
└────────────────────┘                          └────────────────────┘

┌────────────────────┐  ┌────────────────────┐  ┌────────────────────┐
│      posts         │  │   post_comments    │  │    user_follows    │
├────────────────────┤  ├────────────────────┤  ├────────────────────┤
│ id  BIGINT    PK   │  │ id  BIGINT    PK   │  │ follower_id  FK    │
│ author_id  FK      │  │ post_id  FK        │  │ followee_id  FK    │
│ content  TEXT      │  │ author_id  FK      │  │ UNIQUE (f1, f2)    │
│ like_count  INT    │  │ content  TEXT      │  └────────────────────┘
│ created_at  TS     │  └────────────────────┘
└────────────────────┘
```

---

## Features

### Authentication
Stateless JWT for API calls; Spring session only during the OAuth redirect.

- Email/password signup and login
- Google OAuth2 — upserts user on first login
- Role selection at signup: `JOB_SEEKER` or `RECRUITER`
- Onboarding gate redirects new users before they can access protected pages

### Profiles
- Editable public profile with headline, bio, avatar, and cover image
- Experience entries, project entries, and skill tags with proficiency level
- Profile visibility toggle (public / private)
- Public profile pages viewable by other users via `/profile/:userId`
- Follow/unfollow other users

### Jobs
- Browse jobs with company, salary range, type, and location
- Save and unsave jobs
- Apply via external link (`apply_url`)
- Set job preferences (target roles, locations, work type, salary floor)

### Recruiter Dashboard
- Separate dashboard for `RECRUITER`-role users
- Post new job openings with title, description, location, and salary range
- View all your posted jobs
- Browse talent pool of job-seeker profiles

### Daily Coding Challenges
- Daily challenge fetched from LeetCode via a scheduled background job
- Track completions per user
- Points and streak display

### Community Forums
- Forum categories (e.g. career advice, interview prep, general)
- Thread creation with title and body
- Threaded replies per post
- Upvote threads — one upvote per user enforced

### Real-time Messaging
- Start a direct conversation with any user
- Send and receive messages over WebSocket (`/ws/messages`)
- Conversation list with unread state in the floating message widget

### Notifications
- In-app notification feed
- Filter by unread
- Mark one or all as read

### AI Assistant
Powered by Groq's low-latency inference API.

- **Cover letter generator** — paste a job description, get a tailored cover letter
- **Career chat** — ask career questions and get contextual answers

### Resume Parser
- Upload a PDF resume
- PDFBox extracts text server-side
- Structured profile fields returned for auto-fill

### Search
- Global search across jobs and user profiles via Elasticsearch

---

## Getting Started

**Prerequisites:** Docker, Docker Compose, Node.js 20+

### 1. Clone

```bash
git clone https://github.com/LittleTom388/SpinNode.git
cd SpinNode
```

### 2. Environment variables

```bash
export DB_URL=jdbc:postgresql://localhost:5432/spinnode
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export JWT_SECRET=a-random-secret-at-least-32-characters-long
export GOOGLE_CLIENT_ID=your_google_client_id        # optional — OAuth only
export GOOGLE_CLIENT_SECRET=your_google_client_secret
export GROQ_API_KEY=your_groq_api_key                # optional — AI features only
```

> Register `http://localhost:4173` as an authorised redirect URI in your Google Cloud Console credentials.

### 3. Start the backend

```bash
createdb spinnode
cd server
./mvnw spring-boot:run
```

Backend runs on `http://localhost:8080`. Flyway applies all migrations on startup.

### 4. Start the frontend

```bash
cd client
npm install
npm run dev -- --host localhost --port 4173
```

Frontend runs on `http://localhost:4173`. Vite proxies `/auth`, `/oauth2`, `/ws`, and `/api` to the Spring backend.

### Docker (backend only)

```bash
cd server
docker build -t spinnode-server .
docker run -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://host.docker.internal:5432/spinnode \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=your_password \
  -e JWT_SECRET=your_jwt_secret \
  spinnode-server
```

---

## Roadmap

- [ ] Role-based endpoint authorization (`@PreAuthorize`)
- [ ] File upload storage for avatars and cover images (S3 / object store)
- [ ] Docker Compose for full local stack (server + PostgreSQL + Redis)
- [ ] Job application pipeline — apply, track status, recruiter review
- [ ] Automated test coverage for service layer
