# SoferFit development runbook

This runbook covers local Docker development, database migrations, API checks, frontend startup, testing, and common startup failures.

## Prerequisites

- Docker Desktop with the Docker Engine running
- Node.js and npm
- Python 3.13 for standalone backend work
- Chromium installed by Playwright for browser tests

Run commands from the repository root:

~~~powershell
cd C:\Users\user\Documents\ChatGPT\soft_eng_project\soferfit-web-development
~~~

## Start the backend stack

Build and start PostgreSQL, Redis, and Django:

~~~powershell
docker compose up -d --build
docker compose ps
~~~

Expected services:

| Service | Expected state | Port |
| --- | --- | --- |
| `backend` | `Up` | `8000` |
| `db` | `Up (healthy)` | `5432` |
| `redis` | `Up` | `6379` |

The backend entrypoint automatically runs migrations before starting Gunicorn.

## Check the API

Open this URL in a browser:

~~~text
http://127.0.0.1:8000/api/health/
~~~

Expected response:

~~~json
{"status":"ok"}
~~~

PowerShell equivalent:

~~~powershell
$response = Invoke-WebRequest `
  -Uri "http://127.0.0.1:8000/api/health/" `
  -UseBasicParsing

Write-Output "HTTP $($response.StatusCode)"
Write-Output $response.Content
~~~

## Apply and inspect migrations

Run a migration manually inside the running backend container:

~~~powershell
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py showmigrations
docker compose exec backend python manage.py makemigrations --check --dry-run
~~~

`No migrations to apply.` means the database is already current. The accounts migration `0004_normalize_user_emails` normalizes email addresses and creates the case-insensitive unique index. The merge migration resolves the earlier migration branches.

If the normalization migration reports conflicting user IDs, stop and resolve those duplicate accounts before retrying. Do not delete the migration or bypass the constraint.

## Start the frontend

Use a second PowerShell window:

~~~powershell
$env:VITE_API_URL = "http://127.0.0.1:8000/api"
npm.cmd run dev
~~~

Open the Vite URL, normally `http://localhost:5173`.

To use browser-only demo mode, leave `VITE_API_URL` unset. Demo mode does not share data with the backend or other browsers.

## Validation commands

Backend checks:

~~~powershell
docker compose exec backend python manage.py check
docker compose exec backend python manage.py test --noinput
docker compose exec backend python manage.py makemigrations --check --dry-run
~~~

Frontend checks:

~~~powershell
npx.cmd tsc --noEmit
npm.cmd run build
~~~

Browser checks:

~~~powershell
npx.cmd playwright install --with-deps chromium
npx.cmd playwright test
~~~

For API-backed login and full-stack flows, set `VITE_API_URL` in the same terminal that runs Playwright. A local Windows Playwright run may show passing test dots but fail to exit while cleaning up the Vite process; treat the CI result as the authoritative full-suite result and record the local runner issue instead of claiming a clean pass.

## Stop the stack

Stop containers and remove the Compose network:

~~~powershell
docker compose down
~~~

This does not remove database volumes unless a volume-removal option is explicitly supplied. Do not use `docker compose down -v` unless you intentionally want to delete local database data.

## Troubleshooting

### `service "backend" is not running`

The container started and then exited. Inspect the status and logs:

~~~powershell
docker compose ps -a
docker compose logs --tail=120 backend
~~~

Fix the first traceback in the log, rebuild, and restart:

~~~powershell
docker compose up -d --build backend
~~~

### `EMAIL_HOST must be set in production`

The local Compose file must use `DJANGO_ENV=development`. Production mode requires SMTP settings, an explicit HTTPS CORS list, allowed hosts, PostgreSQL settings, Redis, and a production secret key. Do not add fake SMTP values to make a production configuration appear valid.

### `NoReverseMatch` or 404 responses for workout endpoints

Confirm the project URL configuration includes:

~~~python
path('api/workouts/', include('workouts.urls'))
~~~

Also confirm `workouts/views.py` imports the DRF decorator:

~~~python
from rest_framework.decorators import action
~~~

### 401 responses after login

The current frontend uses JWT bearer authentication. Confirm that the API client stores the access token and sends:

~~~text
Authorization: Bearer <access-token>
~~~

Also confirm `VITE_API_URL` ends at `/api` and does not include an individual endpoint.

### Redis import or cache errors

The Python dependency is declared in `src/backend/requirements.txt`. Docker uses Redis through `REDIS_URL`. Test mode and standalone development use local memory cache when `REDIS_URL` is absent. Production requires `REDIS_URL` and the `redis` Python package.

### Migration graph conflicts

Run:

~~~powershell
docker compose exec backend python manage.py showmigrations accounts
~~~

Do not delete or rename an applied migration. Resolve the dependency graph with a reviewed merge migration and test against both a fresh database and an existing development database.

## Production safety checklist

Before any real deployment:

- Set a unique `DJANGO_SECRET_KEY` of at least 50 characters.
- Set `DJANGO_ENV=production` and `DJANGO_DEBUG=false`.
- Configure explicit `DJANGO_ALLOWED_HOSTS` and HTTPS `CORS_ALLOWED_ORIGINS`.
- Configure PostgreSQL and `REDIS_URL` through a secret/configuration store.
- Configure verified SMTP settings and `DEFAULT_FROM_EMAIL`.
- Confirm HTTPS proxy handling, secure cookies, HSTS, backups, retention, and monitoring.
- Replace browser `localStorage` token storage with an approved production authentication design.
- Use synthetic data until privacy, security, and health-data requirements are reviewed.

