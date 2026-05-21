CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.program_scores (
  id SERIAL PRIMARY KEY,
  program_row_id INTEGER NOT NULL,
  jury_member_id INTEGER NOT NULL,
  contest_id INTEGER NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(program_row_id, jury_member_id)
);

CREATE INDEX IF NOT EXISTS idx_program_scores_row ON t_p73771717_multi_page_site_proj.program_scores(program_row_id);
CREATE INDEX IF NOT EXISTS idx_program_scores_jury ON t_p73771717_multi_page_site_proj.program_scores(jury_member_id);
CREATE INDEX IF NOT EXISTS idx_program_scores_contest ON t_p73771717_multi_page_site_proj.program_scores(contest_id);
