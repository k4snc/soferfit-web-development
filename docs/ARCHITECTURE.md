# SoferFit architecture

## Scope

SoferFit is a React and TypeScript frontend backed by a Django REST Framework API. The local development stack runs the API with PostgreSQL and Redis through Docker Compose. The frontend can also run in demo mode without the API, using browser storage for supported flows.

## System overview

~~~mermaid
flowchart LR
    Browser[Browser]
    Vite[Vite dev server<br/>React + TypeScript]
    API[Django REST API<br/>Gunicorn in Docker]
    DB[(PostgreSQL 16)]
    Redis[(Redis 7)]
    Storage[(Browser localStorage)]
    CI[GitHub Actions CI]

    Browser --> Vite
    Vite -->|HTTP JSON + JWT bearer token| API
    Vite --> Storage
    API --> DB
    API --> Redis
    CI -->|build, type-check, tests| Vite
    CI -->|Django checks and tests| API
~~~

## Repository layout

| Path | Responsibility |
| --- | --- |
| `src/frontend/` | React pages, components, state, API client, and local demo behavior |
| `src/backend/` | Django project, REST endpoints, models, serializers, migrations, and tests |
| `docker-compose.yml` | Local PostgreSQL, Redis, and backend services |
| `Dockerfile` | Backend image build and Python dependency installation |
| `entrypoint.sh` | Applies migrations and starts Gunicorn |
| `test/` | Playwright browser tests |
| `.github/workflows/ci.yml` | CI validation for frontend, backend, migrations, and full-stack browser flows |

## Frontend and API flow

The frontend reads `VITE_API_URL` at startup. When it is set to `http://127.0.0.1:8000/api`, the API client sends requests to the Django API. Successful registration and login return access and refresh JWTs. The access token is stored in browser `localStorage` and sent in the `Authorization: Bearer <token>` header for protected requests.

When `VITE_API_URL` is unset, supported account, onboarding, and dashboard flows use the browser-storage fallback. This is demo behavior, not shared server-side persistence.

~~~mermaid
sequenceDiagram
    participant B as Browser
    participant F as Frontend API client
    participant D as Django API
    participant P as PostgreSQL
    participant R as Redis

    B->>F: Submit registration or login
    F->>D: POST /api/register/ or /api/login/
    D->>P: Read or create user
    D->>R: Apply request throttling
    D-->>F: User data + access/refresh JWTs
    F->>B: Store member and tokens locally
    B->>F: Request protected feature
    F->>D: JSON request with Authorization header
    D->>P: Read user-owned data
    D-->>F: JSON response
~~~

## Backend boundaries

- `accounts` owns authentication, fitness profiles, onboarding, account deletion, and health checks.
- `workouts` owns exercises, workouts, programs, challenges, sessions, progress, and saved dashboard plans.
- PostgreSQL is the database used by Docker and production-style configuration.
- SQLite is the default for standalone development and test mode when `DB_NAME` is unset.
- Redis is used when `REDIS_URL` is configured; test mode and standalone development use Django's local-memory cache when Redis is not configured.
- Production configuration fails fast when required database, Redis, CORS, allowed-host, HTTPS, SMTP, or secret-key settings are missing.

## Security and data boundaries

The current internal demo stores JWTs in `localStorage`, which is not an approved production storage design for sensitive user data. The API uses JWT bearer authentication and case-insensitive unique email protection. The frontend may store demo profile and plan data in browser storage when the API is not configured.

Do not use real health, injury, body-measurement, or progress-photo data. Before production use, define a reviewed token-storage design, HTTPS deployment, secret management, backup/retention policy, privacy controls, and abuse protection.

## CI boundary

GitHub Actions runs from this repository root. It validates the frontend type-check and production build, installs and tests the Django backend against PostgreSQL, checks migration consistency, validates production configuration, and runs Playwright flows. The local Docker Compose stack is for development verification; it is not a production deployment definition.

