-- Manual J HVAC Load Calculator — initial schema
--
-- Tables:
--   scenarios           — named, saved house configurations with their
--                         computed heating/cooling loads
--   calculation_history — append-only log of every calculation run,
--                         optionally linked to a scenario
--
-- Input/result are stored as JSONB blobs so the engine can evolve its
-- shape without schema migrations. A few fields are denormalized onto
-- the scenarios table for efficient list queries and filtering.

CREATE TABLE IF NOT EXISTS scenarios (
  id             BIGSERIAL PRIMARY KEY,
  name           TEXT NOT NULL,
  description    TEXT,
  input_json     JSONB NOT NULL,
  result_json    JSONB NOT NULL,
  heating_total  DOUBLE PRECISION NOT NULL,
  cooling_total  DOUBLE PRECISION NOT NULL,
  climate_zone   TEXT NOT NULL,
  square_footage DOUBLE PRECISION NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenarios_created_at
  ON scenarios (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scenarios_climate_zone
  ON scenarios (climate_zone);

CREATE TABLE IF NOT EXISTS calculation_history (
  id           BIGSERIAL PRIMARY KEY,
  scenario_id  BIGINT REFERENCES scenarios(id) ON DELETE SET NULL,
  input_json   JSONB NOT NULL,
  result_json  JSONB NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_history_created_at
  ON calculation_history (created_at DESC);

-- Auto-update the updated_at timestamp on scenario edits.
CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS scenarios_touch_updated_at ON scenarios;
CREATE TRIGGER scenarios_touch_updated_at
  BEFORE UPDATE ON scenarios
  FOR EACH ROW
  EXECUTE FUNCTION touch_updated_at();

-- Row Level Security
--
-- This is a single-user app today: the API routes use the SERVICE ROLE
-- key which bypasses RLS. We still enable RLS as a defense-in-depth
-- measure so that the anon key cannot accidentally read/write scenarios
-- if it is exposed.
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE calculation_history ENABLE ROW LEVEL SECURITY;

-- No policies = deny-all for anon. Service role always bypasses RLS.
--
-- To add per-user scoping later:
--   ALTER TABLE scenarios ADD COLUMN user_id UUID REFERENCES auth.users(id);
--   CREATE POLICY "Users manage own scenarios"
--     ON scenarios FOR ALL
--     USING (auth.uid() = user_id)
--     WITH CHECK (auth.uid() = user_id);
