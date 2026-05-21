CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.contest_jury_access (
  id SERIAL PRIMARY KEY,
  contest_id INTEGER NOT NULL,
  jury_member_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(contest_id, jury_member_id)
);

CREATE INDEX IF NOT EXISTS idx_contest_jury_access_contest ON t_p73771717_multi_page_site_proj.contest_jury_access(contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_jury_access_jury ON t_p73771717_multi_page_site_proj.contest_jury_access(jury_member_id);
