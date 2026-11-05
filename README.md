# SoferFit

SoferFit is a React and TypeScript fitness-planning web app with a Django REST API. The frontend includes onboarding, a muscle-focused routine explorer, and member dashboard screens. The detailed muscle map is an interactive frontend feature; it does not send muscle selections to the backend or implement heatmap/intensity tracking.

## Requirements

- Node.js and npm
- Python 3.13 (the version used to validate this checkout)
- A browser supported by Playwright/Chromium to run browser tests
- Optional PostgreSQL server for backend development; SQLite is used by default

## Run the frontend

From the repository root:

```powershell
npm ci
npm run dev
```

Vite prints the local URL (normally `http://localhost:5173`). To use the frontend without a backend, leave `VITE_API_URL` unset; supported account and onboarding operations use the local browser-storage fallback.

To connect it to the local Django API, set the API base URL before starting Vite:

```powershell
$env:VITE_API_URL = "http://127.0.0.1:8000/api"
npm run dev
```

The base URL includes `/api`; the frontend appends endpoint paths such as `/login/` and `/me/`. Start the backend separately as described in [the backend README](src/backend/README.md).

## Muscle map

The map uses [`@emmorts/body-muscles`](https://www.npmjs.com/package/@emmorts/body-muscles) to render selectable front and back anatomical regions. Those regions map to SoferFit's local workout-focus categories and exercise suggestions. The Man/Woman selector retains a subtle decorative hair distinction; it does not change the anatomy data. The map has interactive selection and hover styling, but no heatmap or intensity feature.

The library's license and attribution are recorded in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and [licenses/BODY-MUSCLES-APACHE-2.0.txt](licenses/BODY-MUSCLES-APACHE-2.0.txt).

## Checks and tests

```powershell
npm run build
npx tsc --noEmit
npx playwright test
```

Playwright starts the Vite frontend. The login regression test requires `VITE_API_URL`; without it, that test is skipped because the frontend uses its local fallback. To run it against the local API, start Django in another terminal, set the variable in the terminal running Playwright, and run:

```powershell
$env:VITE_API_URL = "http://127.0.0.1:8000/api"
npx playwright test test/soferfit-login.spec.ts
```

The multi-user full-stack flows in `test/soferfit-flow.spec.ts` also make real API assertions when `VITE_API_URL` is set. See [the backend README](src/backend/README.md) for backend tests and database setup.

## Backend

The Django project, API, migrations, and backend-specific setup are in [`src/backend`](src/backend/). See its [README](src/backend/README.md) for local setup, environment configuration, migrations, routes, and tests.
