# SoferFit backend boundary

The Figma Make preview runs the frontend only. The frontend currently uses the browser's `localStorage` as a development backend so registration and onboarding can be tested without a server.

When a deployed API is available, set `VITE_API_URL` to its base URL. The same frontend service will automatically use HTTP requests instead of local storage.

## Planned API

| Method | Route | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create an account and session |
| `POST` | `/auth/login` | Start a session |
| `POST` | `/auth/logout` | End a session |
| `GET` | `/me` | Load the current member |
| `PUT` | `/me/onboarding` | Save personalization answers |
| `GET` | `/workouts/today` | Load today's generated workout |
| `GET` | `/progress` | Load activity and progress statistics |
| `POST` | `/sessions` | Start a workout session |
| `PATCH` | `/sessions/:id` | Save exercise/session progress |

Passwords must only be handled by the real API and stored as secure hashes. The local development adapter does not persist passwords.

## Suggested production stack

- Node.js with Fastify or Express
- PostgreSQL for users, plans, workouts, and progress
- An ORM such as Prisma or Drizzle
- Secure, HTTP-only cookie sessions
- Zod request validation

The API adapter is located at `src/frontend/services/api.ts`.
