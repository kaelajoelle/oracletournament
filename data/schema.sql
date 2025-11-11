CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT);
CREATE TABLE quests (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'Planned',  -- Planned | In Progress | Complete
  notes TEXT
);
CREATE TABLE locations (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  notes TEXT
);
CREATE TABLE npcs (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT,          -- Oracle, Guardian, Shopkeep, etc.
  disposition TEXT,   -- Friendly, Hostile, Cryptic...
  location_id INTEGER,
  notes TEXT,
  FOREIGN KEY (location_id) REFERENCES locations(id)
);
CREATE TABLE encounters (
  id INTEGER PRIMARY KEY,
  quest_id INTEGER,
  location_id INTEGER,
  description TEXT,
  outcome TEXT,
  loot TEXT,
  FOREIGN KEY (quest_id) REFERENCES quests(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);
