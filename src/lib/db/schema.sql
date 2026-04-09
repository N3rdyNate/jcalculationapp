CREATE TABLE IF NOT EXISTS scenarios (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  name           TEXT NOT NULL,
  description    TEXT,
  input_json     TEXT NOT NULL,
  result_json    TEXT NOT NULL,
  heating_total  REAL NOT NULL,
  cooling_total  REAL NOT NULL,
  climate_zone   TEXT NOT NULL,
  square_footage REAL NOT NULL,
  created_at     TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scenarios_created ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_climate ON scenarios(climate_zone);

CREATE TABLE IF NOT EXISTS calculation_history (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  scenario_id  INTEGER,
  input_json   TEXT NOT NULL,
  result_json  TEXT NOT NULL,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (scenario_id) REFERENCES scenarios(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_history_created ON calculation_history(created_at DESC);
