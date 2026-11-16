# SoferFit Django backend

This directory contains the Django REST Framework API used by the SoferFit frontend. It provides account/profile, workout, program, challenge, workout-session, and physical-progress endpoints. It is not a Node backend or a planned API; the routes below are implemented by this Django project.

## Requirements and local setup

The pinned Python dependencies are in `requirements.txt`. From this directory, create and activate a virtual environment, install dependencies, apply migrations, and start Django:

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
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

**Development-only configuration:** the current settings use a hard-coded Django secret key, `DEBUG=True`, an empty `ALLOWED_HOSTS`, and allow all CORS origins. Do not expose this configuration as a production service. Production use requires proper secret management and environment-specific host, debug, and CORS settings.

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

The Django test modules currently contain no substantive test cases. The frontend Playwright suite includes browser tests and optional full-stack flows. To run those with the backend, keep Django running in one terminal and, from the repository root in another terminal, configure the API URL and run the test:

```powershell
$env:VITE_API_URL = "http://127.0.0.1:8000/api"
npx playwright test
```

Playwright starts Vite, not Django; the backend must already be running. The tests in `test/soferfit-flow.spec.ts` perform API assertions only when `VITE_API_URL` is set. See the repository-root README for frontend checks and the login regression test.
