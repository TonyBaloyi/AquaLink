-- =====================================================================
-- AquaLink : Data Layer (3.1 Relational Database)
-- PostgreSQL schema
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- enums ----------------------------------------------------
DO $$ BEGIN
  CREATE TYPE user_role        AS ENUM ('admin','supplier','household');
  CREATE TYPE account_status   AS ENUM ('active','suspended','pending');
  CREATE TYPE sub_status       AS ENUM ('active','suspended','cancelled','pending');
  CREATE TYPE payment_status   AS ENUM ('pending','completed','failed','refunded');
  CREATE TYPE sensor_type      AS ENUM ('flow','level');
  CREATE TYPE alert_type       AS ENUM ('low_tank','no_flow','leak','overuse','payment_overdue','sensor_offline','system');
  CREATE TYPE alert_severity   AS ENUM ('info','warning','critical');
  CREATE TYPE alert_status     AS ENUM ('open','acknowledged','resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- 1. users -------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(160)  NOT NULL UNIQUE,
  phone         VARCHAR(30),
  role          user_role     NOT NULL DEFAULT 'household',
  status        account_status NOT NULL DEFAULT 'active',
  last_login_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ---------- 2. suppliers (borehole owners) ---------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  name          VARCHAR(160) NOT NULL,
  contact_phone VARCHAR(30),
  contact_email VARCHAR(160),
  village       VARCHAR(120),
  region        VARCHAR(120),
  status        account_status NOT NULL DEFAULT 'active',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- 3. boreholes ---------------------------------------------
CREATE TABLE IF NOT EXISTS boreholes (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id          UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  name                 VARCHAR(160) NOT NULL,
  location             VARCHAR(255),
  latitude             NUMERIC(9,6),
  longitude            NUMERIC(9,6),
  tank_capacity_litres INTEGER NOT NULL DEFAULT 500,
  yield_litres_per_hour INTEGER,
  status               account_status NOT NULL DEFAULT 'active',
  installed_at         DATE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_boreholes_supplier ON boreholes(supplier_id);

-- ---------- 4. households --------------------------------------------
CREATE TABLE IF NOT EXISTS households (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID UNIQUE REFERENCES users(id) ON DELETE SET NULL,
  borehole_id    UUID REFERENCES boreholes(id) ON DELETE SET NULL,
  address        VARCHAR(255) NOT NULL,
  village        VARCHAR(120),
  household_size INTEGER NOT NULL DEFAULT 1 CHECK (household_size > 0),
  meter_number   VARCHAR(60) UNIQUE,
  status         account_status NOT NULL DEFAULT 'active',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_households_borehole ON households(borehole_id);

-- ---------- 5. subscription plans + subscriptions ---------------------
CREATE TABLE IF NOT EXISTS subscription_plans (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(80) NOT NULL UNIQUE,
  monthly_fee     NUMERIC(10,2) NOT NULL CHECK (monthly_fee >= 0),
  litres_included INTEGER NOT NULL DEFAULT 0,
  rate_per_extra_litre NUMERIC(10,4) NOT NULL DEFAULT 0,
  description     TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id      UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  plan_id           UUID NOT NULL REFERENCES subscription_plans(id),
  status            sub_status NOT NULL DEFAULT 'pending',
  monthly_fee       NUMERIC(10,2) NOT NULL,
  start_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date          DATE,
  next_billing_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_household ON subscriptions(household_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_sub
  ON subscriptions(household_id) WHERE status = 'active';

-- ---------- 6. payments ----------------------------------------------
CREATE TABLE IF NOT EXISTS payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  amount          NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  method          VARCHAR(40) NOT NULL DEFAULT 'mobile_money',
  reference       VARCHAR(120) UNIQUE,
  status          payment_status NOT NULL DEFAULT 'pending',
  period_start    DATE,
  period_end      DATE,
  paid_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_payments_household ON payments(household_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- ---------- 7. sensors + readings (IoT layer) ------------------------
CREATE TABLE IF NOT EXISTS sensors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borehole_id   UUID NOT NULL REFERENCES boreholes(id) ON DELETE CASCADE,
  household_id  UUID REFERENCES households(id) ON DELETE SET NULL,
  type          sensor_type NOT NULL,
  serial_number VARCHAR(80) NOT NULL UNIQUE,
  status        account_status NOT NULL DEFAULT 'active',
  last_seen_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id                  BIGSERIAL PRIMARY KEY,
  sensor_id           UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  household_id        UUID REFERENCES households(id) ON DELETE SET NULL,
  litres_supplied     NUMERIC(12,3) NOT NULL DEFAULT 0,
  water_level_percent NUMERIC(5,2),
  recorded_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_readings_sensor_time ON sensor_readings(sensor_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_readings_household_time ON sensor_readings(household_id, recorded_at DESC);

-- ---------- 8. alerts -------------------------------------------------
CREATE TABLE IF NOT EXISTS alerts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id    UUID REFERENCES sensors(id) ON DELETE SET NULL,
  borehole_id  UUID REFERENCES boreholes(id) ON DELETE CASCADE,
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  type         alert_type NOT NULL,
  severity     alert_severity NOT NULL DEFAULT 'warning',
  message      TEXT NOT NULL,
  status       alert_status NOT NULL DEFAULT 'open',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status, created_at DESC);

-- ---------- notifications log (external service 3.2) -----------------
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  channel    VARCHAR(20) NOT NULL DEFAULT 'sms',
  subject    VARCHAR(160),
  body       TEXT NOT NULL,
  sent_at    TIMESTAMPTZ,
  status     VARCHAR(20) NOT NULL DEFAULT 'queued',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------- updated_at trigger ---------------------------------------
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

DO $$ DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','suppliers','households','subscriptions'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%1$s_touch ON %1$s', t);
    EXECUTE format('CREATE TRIGGER trg_%1$s_touch BEFORE UPDATE ON %1$s
                    FOR EACH ROW EXECUTE FUNCTION touch_updated_at()', t);
  END LOOP;
END $$;
