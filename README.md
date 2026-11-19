# SoferFit

SoferFit is a React and TypeScript fitness-planning web app with a Django REST API. The frontend includes onboarding, a muscle-focused routine explorer, and member dashboard screens. The detailed muscle map is an interactive frontend feature; it does not send muscle selections to the backend or implement heatmap/intensity tracking.

## Requirements

- Node.js and npm
- Python 3.13 (the version used to validate this checkout)
- A browser supported by Playwright/Chromium to run browser tests
- Optional PostgreSQL server for backend development; SQLite is for local development and tests only

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

## Dashboard workout plans and demo mode

The dashboard builds a deterministic 60- or 90-day workout schedule from the challenge start date, requested weekly frequency, and session duration. Training days are distributed across each seven-day block; Sunday recovery entries are optional. The schedule uses the frontend's built-in workout templates, not an AI model or a trainer-validated prescription.

When the frontend is connected to Django and the member is signed in, the dashboard loads and saves one plan per account through `GET` and `PUT /api/workouts/plan/`. Plan changes are also kept in browser storage, and the dashboard reports loading, saving, saved, or sync-error status. If the backend URL is unset, the plan is browser-only demo data: it is not saved to an account or shared across browsers. Workout plan data is separate from completed workout-session and progress records.

## Internal demo data and safety

SoferFit is currently an internal demo, not a production service. Use synthetic accounts and do not enter real health, injury, body-measurement, or progress-photo data. The footer's **Demo privacy & data** disclosure describes what the current browser and API store. Progress photos remain in browser storage, and backend authentication tokens are currently stored in `localStorage`; neither is an approved design for sensitive production data. Before real users in the Philippines, have a responsible privacy adviser assess applicable Data Privacy Act and NPC requirements; this project is not a compliance certification.

The workout builder uses deterministic, prewritten templates in the browser. It does not use an AI model, medically assess injuries, or provide trainer-validated prescriptions. The injury/health-condition option only turns on a low-impact preference by default in the workout builder; it does not adapt every generated or scheduled exercise.

The profile page provides account deletion. With the backend configured, `DELETE /api/me/` deletes the account and related records and revokes refresh tokens. It also clears the dashboard data and authentication values from the current browser. It cannot clear data in another browser or define retention in backups; backup/retention operations are not configured. The dashboard export only includes data currently available in that browser, not all server-side records.

## Muscle map

The routine explorer combines an interactive muscle map with local exercise suggestions. Its main implementation is in `src/frontend/components/BodyMap.tsx` (anatomical map and focus mapping), `src/frontend/hooks/useExplorer.ts` (selection and preset state), `src/frontend/data/exercises.ts` (suggestion data), and `src/frontend/pages/LandingPage.tsx` (controls and presentation).

### Selecting muscle targets

- The map displays front or back views. Selecting an anatomical region adds its mapped focus group; selecting it again toggles that group off. The selected-focus chips also let users remove a group directly.
- The left and right sides of a mirrored region map to the same focus group. Selecting either side therefore highlights both sides and produces one set of suggestions for that group.
- Back targets distinguish upper, middle, and lower lats and trapezius. Chest, abs, shoulders, forearms, glutes, hamstrings, calves, quads, and lower back map to their corresponding focus categories; smaller anatomical regions are grouped as documented by `focusForRegion` in `BodyMap.tsx`.
- Selecting **Full Body** clears individual groups and uses the dedicated Full Body suggestion list. It can be toggled off by choosing it again or replaced by selecting an individual map region.
- Exercise suggestions for multiple targets are combined from the local data. The explorer uses up to four entries per selected focus group, chooses the bodyweight or gym variant according to the equipment setting, and consolidates duplicate exercise names while adding all relevant focus tags. Full Body uses its own equipment-specific exercise list.

### Training splits and sessions

The split selector provides **Custom**, **Push/Pull/Legs**, and **Upper/Lower**. Selecting a split preset automatically loads its first session. Session targets are recommended starting points, not locked selections; users can add or remove groups using the map and focus chips.

| Split | Session | Initial focus groups |
|---|---|---|
| Push/Pull/Legs | Push | Chest, Front Deltoid, Triceps |
| Push/Pull/Legs | Pull | Upper/Mid/Lower Lats, Upper/Mid/Lower Trapezius, Rear Deltoid, Biceps, Forearms, Lower Back |
| Push/Pull/Legs | Legs | Quads, Hamstring, Gluteal, Calves |
| Upper/Lower | Upper | Chest, Front/Rear Deltoid, Upper/Mid/Lower Lats, Upper/Mid/Lower Trapezius, Biceps, Triceps, Forearms |
| Upper/Lower | Lower | Quads, Hamstring, Gluteal, Calves, Lower Back |

Changing sessions replaces the current targets, including manual edits; the interface explains this next to the active-session indicator. Selecting **Custom** hides session choices and retains the current targets. These controls configure one session at a time: they do not create or save a weekly schedule, assign rest days, or track progression.

### Full Body suggestion

When at least one selected focus group belongs to each of the explorer's upper-body, core, and lower-body categories, it offers Full Body as an optional alternative. This is a simple category-coverage heuristic, not a training assessment: it does not evaluate exercise volume, session balance, recovery, or suitability, and it never changes the selection automatically. The category definitions are `UPPER_BODY_FOCUS`, `CORE_FOCUS`, and `LOWER_BODY_FOCUS` in `useExplorer.ts`.

### Accessibility, responsiveness, and scope

The anatomical regions are keyboard-operable controls. The map supports Tab focus, Enter/Space activation, arrow-key region navigation, and Home/End navigation; the visible controls expose their selected state to assistive technology. Focus-group changes are announced, and individual focus chips have descriptive removal labels. At narrow widths, filter controls can scroll horizontally and have larger touch targets.

The Man/Woman model choice adds a subtle decorative hair detail only; it does not change the anatomical data. The explorer has hover and selected-region styling, but no heatmap, intensity tracking, or backend persistence for its muscle-map selections. Dashboard workout plans are a separate feature described above. Exercise suggestions and split definitions are frontend data, not an AI-generated or trainer-validated program.

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

The [GitHub Actions workflow](.github/workflows/ci.yml) runs TypeScript and production-build checks, Django tests and configuration checks, migration consistency, and Playwright flows against a temporary local Django server. It runs for pushes and pull requests targeting `main`.

The workflow runs Django tests against PostgreSQL. SQLite remains the default for local development/test runs when `DB_NAME` is unset. `DJANGO_ENV=production` requires explicit PostgreSQL connection settings and will not silently fall back to SQLite.

## Backend

The Django project, API, migrations, and backend-specific setup are in [`src/backend`](src/backend/). See its [README](src/backend/README.md) for local setup, environment configuration, migrations, routes, and tests.

## Project documentation

- [Architecture overview](docs/ARCHITECTURE.md) — components, request flow, data boundaries, and CI responsibilities
- [Development runbook](docs/DEVELOPMENT_RUNBOOK.md) — Docker startup, migrations, health checks, testing, troubleshooting, and production safety reminders
- [Product requirements](PRODUCT_REQUIREMENTS.md) — current product scope and constraints
