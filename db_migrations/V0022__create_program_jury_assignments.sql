CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.program_jury_assignments (
  id SERIAL PRIMARY KEY,
  program_row_id INTEGER NOT NULL,
  contest_id INTEGER NOT NULL,
  jury_member_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(program_row_id, jury_member_id)
);

CREATE INDEX IF NOT EXISTS idx_pja_program_row ON t_p73771717_multi_page_site_proj.program_jury_assignments(program_row_id);
CREATE INDEX IF NOT EXISTS idx_pja_contest ON t_p73771717_multi_page_site_proj.program_jury_assignments(contest_id);
CREATE INDEX IF NOT EXISTS idx_pja_jury ON t_p73771717_multi_page_site_proj.program_jury_assignments(jury_member_id);
