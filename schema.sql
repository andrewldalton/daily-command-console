CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  day_id TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'work',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'pending',
  source TEXT NOT NULL DEFAULT 'manual',
  estimated_minutes INTEGER,
  due_time TEXT,
  notes TEXT,
  deferred_count INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS days (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL UNIQUE,
  image_url TEXT,
  ocr_text TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  total_tasks INTEGER NOT NULL DEFAULT 0,
  completed_tasks INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS trusted_devices (
  id TEXT PRIMARY KEY,
  ip_address TEXT NOT NULL,
  user_agent TEXT,
  trusted_at TEXT NOT NULL,
  last_seen TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tasks_day_id ON tasks(day_id);
CREATE INDEX IF NOT EXISTS idx_days_date ON days(date);
CREATE INDEX IF NOT EXISTS idx_trusted_ip ON trusted_devices(ip_address);
