# Product Requirements

## Overview
This document captures the **formal acceptance criteria** for SoferFit. It is used by developers, QA, and product owners to verify that each feature meets the intended business goals before any production release.

| Requirement ID | Description | Acceptance Criteria | Owner |
|---|---|---|---|
| R-01 | User Registration | Email must be unique (case‑insensitive) and a password meeting the Django password validators. Returns JWTs on success. | Backend Team |
| R-02 | Account Deletion | Authenticated user can delete their account; all related tokens are revoked. | Backend Team |
| R-03 | Fitness Profile Completion | Users can edit age, sex, height, weight, etc. All fields are optional except `unit_system`. | Frontend Team |
| R-04 | Challenge Creation | Authenticated users can start a 60‑ or 90‑day challenge. Only one active challenge per user. | Backend Team |
| R-05 | Daily Workout Retrieval | `GET /api/workouts/today/` returns the correct workout based on challenge start date. | Backend Team |
| R-06 | Saved Workout Plan | Users can save, update, retrieve and delete a plan. Persistence verified via DB. | Backend Team |
| R-07 | Data Retention / Privacy | A privacy notice is displayed on first login; users can request data deletion. | Legal / Product |
| R-08 | Security – Token Storage | Access/Refresh tokens are stored in HttpOnly, Secure cookies; no token is ever persisted in `localStorage`. | Security Lead |
| R-09 | Rate Limiting | Login limited to 20 requests/minute and registration to 20/hour across all instances (Redis‑backed). | Backend Team |
| R-10 | Monitoring | Errors are reported to Sentry; health endpoint `/api/health/` returns `{status: "ok"}`. | Ops Team |

## Data Retention Policy
- Personal data (age, weight, injury status) is retained **until the user requests deletion**.
- Backups retain data for **30 days**; older backups are purged.
- Synthetic demo data may be used for public demos.

## Launch Checklist
- [ ] All acceptance criteria met (checked in CI).
- [ ] Security review completed.
- [ ] Privacy notice approved.
- [ ] Runbook updated.
- [ ] Monitoring & alerts configured.

---
*This file lives at the repo root as `PRODUCT_REQUIREMENTS.md` and is linked from the README.*