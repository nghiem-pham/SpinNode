# SpinNode

SpinNode is a full-stack social hiring platform built for early-career professionals and recruiters. The app combines job discovery, profile management, coding challenges, forums, notifications, and messaging in a single product experience.

This project was built to practice end-to-end product development across:
- modern React frontend architecture
- Spring Boot REST API design
- PostgreSQL schema design and migrations
- JWT and Google OAuth authentication
- recruiter/job seeker user flows

## Demo Scope

Current product flows include:
- email/password signup and login
- Google OAuth login
- role selection during signup: `JOB_SEEKER` or `RECRUITER`
- profile editing with experience, projects, skills, avatar, and cover image
- job browsing and saved jobs
- daily coding challenges
- community forums and thread creation
- notifications
- direct messaging UI
- search across jobs and companies

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS v4
- Radix UI primitives
- Lucide icons

### Backend
- Java 17
- Spring Boot 3
- Spring Security
- OAuth2 Client
- JWT
- Spring Data JPA
- Flyway
- PostgreSQL

## Architecture

The repository is split into two apps:

```text
spinnode/
├── client/   # React + Vite frontend
└── server/   # Spring Boot backend
```

### Frontend responsibilities
- route protection and auth state
- feature pages for jobs, profile, challenges, forums, messages, notifications
- API integration through a shared client layer
- modern glass-style UI system with reusable inputs, buttons, modals, and surfaces

### Backend responsibilities
- authentication and authorization
- user/profile/job/forum/message/challenge APIs
- persistence with PostgreSQL
- database migrations through Flyway
- Google OAuth success/failure redirect flow

## Key Features

### 1. Authentication
- JWT-based login for API access
- Google OAuth login flow
- `/api/me` endpoint for session restoration
- user role support:
  - `JOB_SEEKER`
  - `RECRUITER`

### 2. Profile System
- editable public profile
- experience entries
- project entries
- skill tags with proficiency level
- avatar and cover image support

### 3. Jobs
- list jobs with company, salary, type, location, and requirements
- save/unsave jobs
- recruiter-ready domain model for future job posting flows

### 4. Challenges
- daily coding challenge feed
- challenge completion tracking
- points and streak metrics

### 5. Forums
- forum categories
- thread creation
- upvote support
- filtered and sorted thread views

### 6. Messaging
- conversation list
- unread state
- message thread loading
- send/read actions

### 7. Notifications
- unread/all filtering
- mark one or all as read

## API Surface

Main backend modules currently exposed:

- `POST /auth/register`
- `POST /auth/login`
- `GET /api/me`
- `GET /api/profile`
- `PATCH /api/profile`
- `GET /api/jobs`
- `POST /api/jobs/{jobId}/save`
- `GET /api/challenges`
- `POST /api/challenges/daily/complete`
- `GET /api/forums/categories`
- `GET /api/forums/threads`
- `POST /api/forums/threads`
- `POST /api/forums/threads/{threadId}/upvote`
- `GET /api/messages/conversations`
- `POST /api/messages/conversations`
- `GET /api/notifications`
- `PATCH /api/notifications/{notificationId}/read`
- `PATCH /api/notifications/read-all`
- `GET /api/search`

## Database Design

The backend uses Flyway migrations to evolve schema safely. Core tables include:

- `users`
- `user_profiles`
- `experiences`
- `projects`
- `skills`
- `companies`
- `jobs`
- `saved_jobs`
- `challenges`
- `challenge_completions`
- `forum_categories`
- `forum_threads`
- `thread_upvotes`
- `conversations`
- `conversation_participants`
- `messages`
- `notifications`
- `posts`
- `post_comments`
- `post_likes`
- `user_follows`

Recent migration updates aligned the schema with the entity model and added support for:
- user roles
- post comments and likes
- follows
- forum thread upvotes

## Local Setup

### Prerequisites
- Node.js 20+
- Java 17
- PostgreSQL running locally
- Maven wrapper support

### 1. Clone

```bash
git clone <your-repo-url>
cd spinnode
```

### 2. Create the database

Create a PostgreSQL database named:

```bash
spinnode
```

### 3. Configure backend

The backend currently reads local config from:

[application.yml](/Users/nghiempham/Projects/FULLSTACK/spinnode/server/src/main/resources/application.yml)

You should update the following for your own machine before sharing or deploying:
- PostgreSQL username/password
- JWT secret
- Google OAuth client ID/secret

Recommended Google OAuth frontend URL in local development:

```text
http://localhost:4173
```

### 4. Start the backend

```bash
cd server
./mvnw spring-boot:run
```

Backend runs on:

```text
http://localhost:8080
```

### 5. Start the frontend

```bash
cd client
npm install
npm run dev -- --host localhost --port 4173
```

Frontend runs on:

```text
http://localhost:4173
```

The Vite dev server proxies `/auth`, `/oauth2`, and `/api` requests to the Spring backend.

## Build and Test

### Frontend build

```bash
cd client
npm run build
```

### Backend tests

```bash
cd server
./mvnw test
```

## Product Decisions

A few intentional choices in this project:

- Split frontend and backend into separate apps to reflect real production-style ownership boundaries.
- Use Flyway instead of `ddl-auto=create` so schema changes stay explicit and reviewable.
- Keep auth stateless with JWT for API calls while allowing sessions only where OAuth redirect flow needs them.
- Add user roles now so recruiter-only features can be layered in without reworking auth later.
- Use a feature-rich domain model instead of a minimal CRUD demo so the project is interview-friendly.

## What I Would Improve Next

Planned or natural next steps:

- recruiter dashboard for posting and managing jobs
- job applications pipeline
- role-based authorization at endpoint level
- pagination and infinite scroll for large feeds
- WebSocket-backed real-time messaging
- file upload storage for avatars and media
- stronger automated test coverage
- containerized local setup with Docker Compose
- deployment configuration

## Interview Talking Points

If I were discussing this project in an interview, I would highlight:

- how I structured a full-stack app across frontend and backend boundaries
- how authentication works across JWT and Google OAuth
- how I used migrations to fix schema drift instead of hiding it
- how I modeled user roles to support recruiter and job seeker workflows
- how I designed reusable UI primitives and then applied them across pages
- tradeoffs between seed data, internal APIs, and external job/challenge providers

## Notes

- Google OAuth in local development should use the same host consistently. `localhost` and `127.0.0.1` are treated as different redirect URIs.
- The repo currently includes local-development configuration; sensitive credentials should be moved to environment variables before public release.

---

If you are reviewing this project as a recruiter or engineer, the best pages to inspect first are:
- signup/login
- jobs
- profile
- challenges
- forums
- messaging
