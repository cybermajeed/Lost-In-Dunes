-- ============================================
-- Lost In Dunes – SUPABASE SCHEMA
-- ============================================

-- 1. Locations
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  terrain_type TEXT NOT NULL CHECK (terrain_type IN ('desert', 'ruins', 'oasis', 'canyon', 'burial_site')),
  richness_score INTEGER NOT NULL CHECK (richness_score BETWEEN 1 AND 10),
  x_coord INTEGER NOT NULL,
  y_coord INTEGER NOT NULL
);

-- 2. Players
CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  level INTEGER NOT NULL DEFAULT 1,
  experience INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Artifacts (raw discoveries)
CREATE TABLE IF NOT EXISTS artifacts (
  id SERIAL PRIMARY KEY,
  code_name TEXT NOT NULL UNIQUE,
  material TEXT NOT NULL,
  estimated_age INTEGER NOT NULL,  -- in years
  condition TEXT NOT NULL CHECK (condition IN ('pristine', 'good', 'damaged', 'fragment')),
  location_id INTEGER REFERENCES locations(id),
  discovered_by INTEGER REFERENCES players(id),
  hidden_type TEXT NOT NULL,       -- truth, revealed after analysis
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Discoveries (junction: who found what, when)
CREATE TABLE IF NOT EXISTS discoveries (
  id SERIAL PRIMARY KEY,
  player_id INTEGER NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  artifact_id INTEGER NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, artifact_id)
);

-- 5. Classifications (analysis results)
CREATE TABLE IF NOT EXISTS classifications (
  id SERIAL PRIMARY KEY,
  artifact_id INTEGER NOT NULL UNIQUE REFERENCES artifacts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('tool', 'ritual', 'weapon', 'ornament', 'unknown')),
  civilization TEXT NOT NULL DEFAULT 'unknown',
  confidence_level INTEGER NOT NULL CHECK (confidence_level BETWEEN 0 AND 100),
  analyzed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Hypotheses
CREATE TABLE IF NOT EXISTS hypotheses (
  id SERIAL PRIMARY KEY,
  artifact_id INTEGER NOT NULL REFERENCES artifacts(id) ON DELETE CASCADE,
  theory_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('confirmed', 'rejected', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SEED DATA
-- ============================================

INSERT INTO locations (name, terrain_type, richness_score, x_coord, y_coord) VALUES
  ('The Sunken Quarter',   'ruins',       9, 3, 2),
  ('Golden Dunes',         'desert',      4, 7, 5),
  ('Mirage Oasis',         'oasis',       6, 5, 8),
  ('Serpent Canyon',       'canyon',      7, 2, 6),
  ('The Silent Tombs',     'burial_site', 10, 8, 3),
  ('Forgotten Outpost',    'ruins',       5, 4, 4),
  ('Red Sand Fields',      'desert',      3, 6, 7);

-- ============================================
-- USEFUL VIEWS
-- ============================================

-- Full artifact detail with location + player + classification
CREATE OR REPLACE VIEW artifact_full AS
SELECT
  a.id,
  a.code_name,
  a.material,
  a.estimated_age,
  a.condition,
  a.created_at AS discovered_at,
  l.name AS location_name,
  l.terrain_type,
  p.name AS discovered_by,
  c.type AS classified_type,
  c.civilization,
  c.confidence_level,
  COALESCE(c.type, 'unanalyzed') AS status
FROM artifacts a
LEFT JOIN locations l ON a.location_id = l.id
LEFT JOIN players p ON a.discovered_by = p.id
LEFT JOIN classifications c ON c.artifact_id = a.id;

-- Civilization pattern detection: groups artifacts by material + civilization
CREATE OR REPLACE VIEW civilization_patterns AS
SELECT
  c.civilization,
  a.material,
  COUNT(*) AS artifact_count,
  AVG(c.confidence_level) AS avg_confidence,
  MIN(a.estimated_age) AS youngest,
  MAX(a.estimated_age) AS oldest
FROM classifications c
JOIN artifacts a ON c.artifact_id = a.id
WHERE c.civilization != 'unknown'
GROUP BY c.civilization, a.material
HAVING COUNT(*) >= 2;
