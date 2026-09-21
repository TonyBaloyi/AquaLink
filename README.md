# AquaLink — Backend (Application / API Layer)

REST API for the AquaLink clean water management platform, built to the solution
architecture diagram: **Node.js + Express + PostgreSQL**, serving the household
portal, the supplier dashboard and the administrator dashboard, and ingesting
readings from the flow and tank-level sensors on the physical layer.

Frontend it pairs with: https://aqualink-khaki.vercel.app/

---

## 1. How the code maps to the architecture

| Diagram element | Where it lives |
|---|---|
| RESTful API Gateway | `src/app.js`, `src/routes.js` |
| Authentication & Authorization | `src/middleware/auth.js`, `src/services/supabase-auth.service.js`, `src/modules/auth/` |
| Business Logic Layer | `src/modules/*/ *.service.js` |
| File / Document Service | `src/services/file.service.js` |
| Background Jobs / Scheduler | `src/jobs/scheduler.js` |
| User Management | `src/modules/users/` |
| Household Management | `src/modules/households/` |
| Supplier Management | `src/modules/suppliers/` (+ `boreholes/`) |
| Subscription Management | `src/modules/subscriptions/` |
| Payment Management | `src/modules/payments/` |
| Water Usage Management | `src/modules/readings/` |
| Alert Management | `src/modules/alerts/` |
| Reporting & Analytics | `src/modules/reports/` |
| Relational database (8 entities) | `src/db/schema.sql` |
| Payment Gateway (external) | `src/services/payment.gateway.js` |
| Notification Service (external) | `src/services/notification.service.js` |
| IoT / sensor ingestion | `POST /readings` with the `X-Device-Key` header |

Every module follows the same three-file shape:

```
routes.js       HTTP surface + zod validation schemas
controller.js   request/response handling only
service.js      business logic and SQL
```

---

## 2. Getting started

This backend now uses **Supabase Auth for credentials/session tokens** and
**Supabase PostgreSQL for the application data**. The AquaLink `users` table
stores the same UUID as `auth.users.id`; it does **not** store passwords.

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Set these values in `.env` before running migrations:

```text
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DATABASE_URL=postgresql://...
DB_SSL=true
CORS_ORIGIN=http://localhost:3000,https://aqualink-khaki.vercel.app
PASSWORD_RESET_REDIRECT_URL=https://aqualink-khaki.vercel.app/reset-password
```

The `SUPABASE_SECRET_KEY` is backend-only. Never put it in the Vercel frontend.
If the Supabase project still exposes the older key name, the backend also accepts
`SUPABASE_SERVICE_ROLE_KEY` as a compatibility fallback.

## 3. Authentication architecture

The old custom bcrypt/JWT authentication has been removed from the active API flow.
Supabase Auth now handles password storage, access tokens and refresh tokens.
The backend validates the bearer access token with Supabase Auth and then loads the
matching AquaLink application profile from PostgreSQL.

```text
Vercel frontend
      |
      | Authorization: Bearer <Supabase access token>
      v
AquaLink REST API
      |----------------------|
      v                      v
Supabase Auth          Supabase PostgreSQL
(auth.users)            (AquaLink tables)
```

The API response keeps the existing `accessToken`, `refreshToken`, `user` and
`profile` fields so the current frontend contract needs minimal changes.

### Authentication endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/auth/register` | Creates a household in Supabase Auth + AquaLink DB and returns a session |
| POST | `/auth/login` | Signs in through Supabase Auth |
| POST | `/auth/refresh` | Refreshes the Supabase session |
| POST | `/auth/forgot-password` | Starts Supabase password recovery email |
| POST | `/auth/reset-password` | Sets a new password using a recovery access token |
| GET | `/auth/me` | Returns the current AquaLink user/profile |
| POST | `/auth/change-password` | Verifies current password, then changes it through Supabase |
| POST | `/auth/logout` | Compatibility endpoint; the frontend should also clear its local Supabase session/token |

## 4. Database migration

`src/db/schema.sql` is now Supabase-specific: `users.id` references
`auth.users(id)` and passwords are no longer stored in the application table.

For a **new Supabase project**, the simplest setup is:

```bash
npm run db:migrate
npm run db:seed
```

The seed creates three demo Supabase Auth accounts and matching application profiles:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@aqualink.co.za` | `Password123` |
| Supplier | `supplier@aqualink.co.za` | `Password123` |
| Household | `household@aqualink.co.za` | `Password123` |

Change/remove these demo credentials before production.

## 5. Vercel frontend

The existing frontend is:

`https://aqualink-khaki.vercel.app/`

The frontend should point to the deployed AquaLink API using its existing
Next.js variable:

```text
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND-HOST/api/v1
```

Add that variable in **Vercel → Project → Settings → Environment Variables**
for Production (and Preview/Development if required), then redeploy.

The frontend should continue sending:

```http
Authorization: Bearer <accessToken>
```

for protected API requests.

## 6. Password recovery

Supabase sends the recovery email. Set the Supabase Auth redirect URL to the
same value used by `PASSWORD_RESET_REDIRECT_URL`, for example:

```text
https://aqualink-khaki.vercel.app/reset-password
```

The recovery page must read the recovery access token/session supplied by
Supabase and call:

```http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "accessToken": "RECOVERY_ACCESS_TOKEN",
  "newPassword": "NewPassword123!"
}
```

## 7. Security rules

- `SUPABASE_PUBLISHABLE_KEY`: may be used by browser-side Supabase code.
- `SUPABASE_SECRET_KEY`: backend only; never expose it in JavaScript sent to the browser.
- `DATABASE_URL`: backend only; never put it in `NEXT_PUBLIC_*` variables.
- `.env`: never commit it to GitHub.
- The `users` table does not store passwords; Supabase Auth owns credential storage and session tokens.
- IoT devices still use `X-Device-Key`; this is separate from human Supabase authentication.

## 8. API reference

The application modules remain the same:

`auth`, `users`, `suppliers`, `boreholes`, `households`, `subscriptions`,
`payments`, `readings`, `alerts`, `reports`.

All protected routes continue to use role gates such as `authorize('admin')`,
`authorize('supplier')` and `authorize('household')`.

## 9. Background jobs

`src/jobs/scheduler.js` still runs the billing, overdue-payment and sensor-health
jobs when `ENABLE_SCHEDULER=true`. If the backend host does not support a persistent
process, disable this setting and move these jobs to a dedicated scheduler/cron service.

## 10. Production checklist

1. Create the Supabase project.
2. Enable Email/Password authentication.
3. Copy the Supabase URL, publishable key and secret key into the backend environment.
4. Add the Supabase PostgreSQL connection string as `DATABASE_URL`.
5. Run `npm run db:migrate` once against the new project.
6. Run `npm run db:seed` only if you want the demo data.
7. Deploy this backend as the AquaLink API.
8. Add `NEXT_PUBLIC_API_URL` to the Vercel frontend.
9. Set `CORS_ORIGIN` to the exact Vercel origin.
10. Configure the password-recovery redirect URL in Supabase Auth.
11. Test register → login → protected request → refresh → logout.
12. Remove demo accounts and replace device/payment/notification credentials before production.
