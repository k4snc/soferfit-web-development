# SoferFit Django backend

This directory contains the Django REST Framework API used by the SoferFit frontend. It provides account/profile, workout, program, challenge, workout-session, and physical-progress endpoints. It is not a Node backend or a planned API; the routes below are implemented by this Django project.

## Requirements and local setup

The pinned Python dependencies are in `requirements.txt`. From this directory, create and activate a virtual environment, install dependencies, apply migrations, and start Django:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
Copy-Item .env.example .env
python manage.py migrate
python manage.py runserver
```

Before starting Django, replace `DJANGO_SECRET_KEY` in `.env` with a locally generated value:

```powershell
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

The API is then available at `http://127.0.0.1:8000/api/`. Django admin is at `http://127.0.0.1:8000/admin/`.

The repository may also have an existing `venv` directory, but it is local and ignored by Git. The `.venv` above is a suggested per-checkout environment; either environment works when its dependencies are installed.

## Database and environment

By default, the backend uses SQLite at `src/backend/db.sqlite3`. Django loads an optional `.env` file from this directory. Setting `DB_NAME` switches the configured database engine to PostgreSQL:

| Variable | Purpose | Default |
| --- | --- | --- |
| `DB_NAME` | PostgreSQL database name; when set, enables PostgreSQL configuration | Unset (SQLite) |
| `DB_USER` | PostgreSQL user | No default in settings |
| `DB_PASSWORD` | PostgreSQL password | No default in settings |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |

For example, create a local `src/backend/.env` (do not commit it) with PostgreSQL connection values:

```dotenv
DB_NAME=soferfit
DB_USER=soferfit
DB_PASSWORD=replace-with-a-local-password
DB_HOST=localhost
DB_PORT=5432
```

PostgreSQL must be installed and running when `DB_NAME` is set. Otherwise, omit these variables and use SQLite.

### Security configuration

The backend requires `DJANGO_SECRET_KEY` in all environments. Keep `.env` private; never commit it or use the example placeholder as a real key. `DJANGO_ENV` accepts `development`, `test`, or `production`. Development defaults to `DEBUG=True`; production defaults to `DEBUG=False` and fails to start if the secret key, explicit allowed hosts, or HTTPS CORS origins are missing. Production also enables secure session/CSRF cookies, HTTPS redirects, and one-year HSTS by default.

For production, set these values in the hosting provider's secret/configuration store rather than committing them:

| Variable | Production guidance |
| --- | --- |
| `DJANGO_ENV` | `production` |
| `DJANGO_SECRET_KEY` | Unique, randomly generated secret with at least 50 characters |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated exact API hostnames; do not use `*` |
| `CORS_ALLOWED_ORIGINS` | Comma-separated HTTPS frontend origins |
| `DJANGO_SECURE_SSL_REDIRECT` | Keep `True` when Django can detect HTTPS correctly |
| `DJANGO_HSTS_SECONDS` | Defaults to `31536000` in production; enable only after HTTPS is working |
| `EMAIL_HOST`, `EMAIL_PORT` | SMTP server and port for production email |
| `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD` | SMTP credentials, if required by the provider |
| `EMAIL_USE_TLS`, `EMAIL_USE_SSL` | Use the transport mode required by the provider; never enable both |
| `DEFAULT_FROM_EMAIL` | Verified sender address for production email |

If TLS terminates at a reverse proxy, configure Django's trusted-proxy HTTPS detection only for the actual trusted proxy; otherwise HTTPS redirects can loop or trust spoofed headers. CORS should list only the deployed frontend origins. The login and registration endpoints have per-IP DRF throttles; DRF's default in-memory cache is process-local, so production deployments with multiple workers or instances should use a shared cache and edge-level abuse protection.

`python manage.py check --deploy` may report `security.W005` and `security.W021`: HSTS is enabled for the API host, but subdomain coverage and browser preload are intentionally off by default. Enable them only after confirming every affected subdomain permanently supports HTTPS and your organization is ready for browser preload.

The checked-in `.env.example` is for local development. It explicitly allows the local Vite origins and disables HTTPS-only cookie/redirect settings for local HTTP. Do not deploy it as production configuration.

## Migrations and sample data

The `accounts` and `workouts` apps have committed migrations. Apply them after choosing the database:

```powershell
python manage.py migrate
python manage.py showmigrations
```

To check for model changes that lack migrations:

```powershell
python manage.py makemigrations --check --dry-run
```

An optional `seed_data` management command creates a small starter set of exercises, a workout, and sample program days:

```powershell
python manage.py seed_data
```

It is a minimal development dataset, not a complete 60- or 90-day program.

## API routes

All API routes are under `/api/`. Protected endpoints use JWT bearer authentication: `Authorization: Bearer <access-token>`.

### Accounts and fitness profile

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/register/` | Public | Register with email and password; returns user data and access/refresh tokens |
| `POST` | `/api/login/` | Public | Obtain access/refresh tokens using email and password |
| `POST` | `/api/token/refresh/` | Public | Refresh an access token |
| `POST` | `/api/logout/` | Authenticated | Blacklist a supplied refresh token |
| `GET` | `/api/me/` | Authenticated | Get the current user |
| `GET`, `PUT`, `PATCH` | `/api/assessment/` | Authenticated | Retrieve or update the current user's fitness profile |
| `GET`, `PUT`, `PATCH` | `/api/me/onboarding/` | Authenticated | Retrieve or update that same fitness profile for onboarding |

### Workouts and progress

The following router resources support standard Django REST Framework collection/detail operations as allowed by their permissions:

| Resource | Collection route |
| --- | --- |
| Exercises | `/api/workouts/exercises/` |
| Workouts | `/api/workouts/workouts/` |
| Programs | `/api/workouts/programs/` |
| Current user's challenges | `/api/workouts/challenges/` |
| Current user's workout sessions | `/api/workouts/sessions/` |
| Current user's physical progress entries | `/api/workouts/progress/` |

Additional implemented actions:

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/workouts/workouts/today/` | Authenticated | Get today's workout or rest-day response for the active challenge |
| `GET` | `/api/workouts/programs/recommended/` | Authenticated | List programs matching the user's fitness profile |
| `POST` | `/api/workouts/programs/{id}/add_day/` | Content admin | Add a day to a program |
| `GET` | `/api/workouts/sessions/dashboard/` | Authenticated | Get dashboard challenge and completed-session summary |

Exercise and workout reads are public; their create/update/delete operations require the content-admin permission. Program reads are public; program writes and `add_day` require content-admin permission. Challenge, session, and progress resources are scoped to the authenticated user. See `accounts/urls.py`, `workouts/urls.py`, and their viewsets for serializer fields and permission details.

### Saved dashboard workout plan

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/workouts/plan/` | Authenticated | Return the current user's saved plan as `{"plan": ...}`, or `{"plan": null}` if none exists |
| `PUT` | `/api/workouts/plan/` | Authenticated | Create or replace the current user's one saved plan |
| `DELETE` | `/api/workouts/plan/` | Authenticated | Delete the current user's saved plan; returns `204 No Content` |

The `PUT` body contains `start_date` (ISO date), `duration_days` (`60` or `90`), `days_per_week` (`1`–`7`), `session_minutes` (`5`–`180`), and a `schedule` list. Each scheduled workout includes an ID, date, name, duration, equipment, target tags, and one or more exercises; optional intensity, low-impact, sets, and recovery flags are supported. Workout IDs must be unique within a plan. The endpoint stores schedule data for the signed-in user and does not create workout-session or progress records. The frontend maps the API's snake_case fields to its camelCase model.

## Frontend connection

The Vite frontend reads `VITE_API_URL` at build/dev-server startup. Set it to the API prefix, not to an individual route:

```powershell
$env:VITE_API_URL = "http://127.0.0.1:8000/api"
npm run dev
```

The browser calls the configured base plus API paths. For example, login calls `/login/`, which resolves to `/api/login/`. JWT access and refresh tokens are stored in browser `localStorage` by the frontend service. If `VITE_API_URL` is unset, the frontend uses its local-storage fallback for supported account and onboarding flows instead of making API requests.

## Tests and checks

From this directory:

```powershell
python manage.py check
python manage.py test
```

The backend tests cover authentication throttling, logout token handling, workout-session ownership, and saved-plan authentication, validation, and per-user access. The frontend Playwright suite includes browser tests and optional full-stack flows. To run those with the backend, keep Django running in one terminal and, from the repository root in another terminal, configure the API URL and run the test:

```powershell
$env:VITE_API_URL = "http://127.0.0.1:8000/api"
npx playwright test
```

Playwright starts Vite, not Django; the backend must already be running. The tests in `test/soferfit-flow.spec.ts` perform API assertions—including saving and resuming a workout plan—when `VITE_API_URL` is set. Without that variable, they verify browser-only demo mode instead. The workflow at `.github/workflows/ci.yml` starts Django with its runner-local SQLite database before running Playwright against the API.

See the repository-root README for frontend checks and the login regression test.
