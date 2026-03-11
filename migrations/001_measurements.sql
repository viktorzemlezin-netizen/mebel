CREATE TABLE IF NOT EXISTS measurements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL,
  photos_json TEXT,
  measurements_json TEXT,
  room_summary_json TEXT,
  completed_at TEXT,
  measurer_name TEXT
);
