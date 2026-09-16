# 💧 AquaLink

### Smart Water Distribution for Rural Communities

AquaLink is a smart water distribution solution designed to improve access to reliable and affordable water in rural communities.

The system connects local borehole owners with nearby households through a managed water distribution network, supported by a digital platform for managing suppliers, households, payments, water usage, alerts, and reports.

---

## 🚰 The Problem

Many rural households face challenges such as:

- Travelling long distances to collect water
- Unreliable water availability
- Dependence on informal water suppliers
- Unpredictable water prices
- Difficulty transporting water
- Limited monitoring of water usage and supply

AquaLink aims to make reliable water access available closer to people's homes.

---

## 💡 The Solution

AquaLink connects local borehole suppliers with surrounding households through a managed pipe network.

```text
Borehole
   ↓
Pipe Network
   ↓
Buffer Tank
   ↓
Household Taps

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
| Authentication & Authorization | `src/middleware/auth.js`, `src/utils/jwt.js`, `src/modules/auth/` |
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

```bash
cp .env.example .env          # then set DATABASE_URL and JWT_SECRET
npm install
npm run db:migrate            # applies src/db/schema.sql
npm run db:seed               # demo suppliers, households, plans, readings
npm run dev                   # http://localhost:4000/api/v1
```

`npm run db:reset` drops and rebuilds everything.

Seeded logins (password `Password123`):

| Role | Email |
|---|---|
| Admin | admin@aqualink.co.za |
| Supplier | supplier@aqualink.co.za |
| Household | household@aqualink.co.za |

---

## 3. Data model

Eight core tables exactly as the data layer specifies — `users`, `households`,
`suppliers`, `boreholes`, `subscriptions`, `payments`, `sensor_readings`,
`alerts` — plus two supporting tables: `sensors` (a reading has to belong to a
registered device) and `subscription_plans` (so plans and fees are data, not
hard-coded strings). A `notifications` table logs every SMS/email the platform
sends.

Relationships: a supplier owns many boreholes → a borehole serves many
households → a household has one active subscription and many payments →
each borehole has flow and level sensors producing readings, and readings or
billing raise alerts.

---

## 4. Authentication

JWT bearer tokens. `POST /auth/login` accepts the `userType` the login screen
sends (`admin` / `supplier` / `household`) and rejects the login if the account
is not that role — so the Admin and Supplier tabs behave the way the UI implies.

```
Authorization: Bearer <accessToken>
```

Role gates are applied per route with `authorize('admin')` etc. Suppliers are
scoped to their own boreholes and households automatically; household users can
only read their own record.

Sensors do not use JWTs — they post readings with `X-Device-Key`.

---

## 5. API reference (prefix `/api/v1`)

### Auth
| Method | Path | Access |
|---|---|---|
| POST | `/auth/register` | public (household self-registration) |
| POST | `/auth/login` | public |
| POST | `/auth/refresh` | public |
| POST | `/auth/forgot-password` | public |
| POST | `/auth/reset-password` | public |
| GET | `/auth/me` | any signed-in user |
| POST | `/auth/change-password` | any signed-in user |

### Users — `admin`
`GET /users` · `POST /users` · `GET /users/:id` · `PATCH /users/:id` ·
`PATCH /users/:id/status` · `DELETE /users/:id`

### Suppliers
`GET /suppliers/me` · `GET /suppliers/me/dashboard` (supplier) ·
`GET|POST /suppliers` · `GET|PATCH|DELETE /suppliers/:id` ·
`GET /suppliers/:id/dashboard` (admin)

### Boreholes — `admin`, `supplier`
`GET /boreholes` · `POST /boreholes` · `GET /boreholes/:id` ·
`GET /boreholes/:id/tank` · `POST /boreholes/:id/sensors` ·
`PATCH /boreholes/:id` · `DELETE /boreholes/:id` (admin)

### Households
`GET /households/me` (household) · `GET /households` (admin, supplier) ·
`POST /households` (admin) · `GET /households/:id` ·
`GET /households/:id/summary` · `PATCH /households/:id` · `DELETE /households/:id`

### Subscriptions
`GET /subscriptions/plans` · `POST /subscriptions/plans` (admin) ·
`PATCH /subscriptions/plans/:id` (admin) · `GET /subscriptions` ·
`POST /subscriptions` (subscribe) · `GET /subscriptions/:id` ·
`PATCH /subscriptions/:id/status` (admin) · `PATCH /subscriptions/:id/plan`

### Payments
`GET /payments` · `GET /payments/:id` · `POST /payments/invoices` (admin) ·
`POST /payments/:id/pay` · `PATCH /payments/:id/mark-paid` (admin) ·
`POST /payments/webhook` (gateway callback, no JWT)

### Readings / water usage
`POST /readings` and `POST /readings/batch` (device key) ·
`GET /readings` · `GET /readings/usage?granularity=day&days=30`

### Alerts
`GET /alerts` · `GET /alerts/:id` · `POST /alerts` ·
`PATCH /alerts/:id/acknowledge` · `PATCH /alerts/:id/resolve`

### Reports — `admin`
`GET /reports/overview` · `/usage` · `/revenue` · `/alerts` · `/top-consumers`

Every response is wrapped consistently:

```jsonc
{ "success": true, "data": { }, "meta": { "page": 1, "limit": 20, "total": 42 } }
{ "success": false, "error": { "message": "Validation failed", "details": [ ] } }
```

---

## 6. Example requests

```bash
# Login
curl -X POST localhost:4000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"supplier@aqualink.co.za","password":"Password123","userType":"supplier"}'

# Supplier dashboard
curl localhost:4000/api/v1/suppliers/me/dashboard -H "Authorization: Bearer $TOKEN"

# A sensor reports a reading
curl -X POST localhost:4000/api/v1/readings \
  -H 'Content-Type: application/json' -H 'X-Device-Key: aqualink-device-key' \
  -d '{"serial_number":"LVL-0001","water_level_percent":18}'

# Household pays an invoice
curl -X POST localhost:4000/api/v1/payments/$ID/pay \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"method":"mobile_money"}'
```

---

## 7. Background jobs

`src/jobs/scheduler.js` runs three cron tasks (disable with `ENABLE_SCHEDULER=false`):

- **02:00 daily** — raise the next monthly invoice for every active subscription
- **03:00 daily** — flag overdue invoices, alert the household, suspend after 14 days
- **every 30 min** — sensors that stopped reporting raise `no_flow` / `sensor_offline`

A tank level at or below `LOW_TANK_THRESHOLD` raises a `low_tank` alert at
ingest time rather than on a timer.

---

## 8. Connecting the Vercel frontend

Add the API base URL to the Next.js project:

```
NEXT_PUBLIC_API_URL=https://your-api-host/api/v1
```

and add the frontend origin to `CORS_ORIGIN` in `.env`. Store the
`accessToken` from `/auth/login` and send it as a bearer header; the `profile`
object in the login response already carries the supplier or household record
so the dashboard can render on first paint.

---

## 9. Notes before production

- Swap the mock payment adapter for real PayFast/Yoco credentials and verify
  the webhook signature against the provider's IP allow-list.
- Replace the console notifier with Twilio or SendGrid in
  `services/notification.service.js`.
- Refresh tokens are stateless; add a `refresh_tokens` table if you need
  server-side revocation on logout.
- Give each sensor its own key instead of the shared `DEVICE_API_KEY`.
