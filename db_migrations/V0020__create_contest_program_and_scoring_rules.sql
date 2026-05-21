CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.contest_scoring_rules (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER NOT NULL,
  grand_prix_min INTEGER NOT NULL DEFAULT 95,
  laureate_1_min INTEGER NOT NULL DEFAULT 85,
  laureate_2_min INTEGER NOT NULL DEFAULT 75,
  laureate_3_min INTEGER NOT NULL DEFAULT 65,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contest_id)
);

CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.contest_program (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER NOT NULL,
  order_number INTEGER NOT NULL,
  region TEXT NOT NULL DEFAULT '',
  directing_party TEXT NOT NULL DEFAULT '',
  participant_name TEXT NOT NULL DEFAULT '',
  age TEXT NOT NULL DEFAULT '',
  nomination TEXT NOT NULL DEFAULT '',
  piece_title TEXT NOT NULL DEFAULT '',
  duration TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contest_program_contest_id ON t_p73771717_multi_page_site_proj.contest_program(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_scoring_rules_contest_id ON t_p73771717_multi_page_site_proj.contest_scoring_rules(contest_id);
