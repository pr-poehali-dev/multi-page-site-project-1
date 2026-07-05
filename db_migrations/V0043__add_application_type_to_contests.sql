ALTER TABLE t_p73771717_multi_page_site_proj.contests
  ADD COLUMN IF NOT EXISTS application_type VARCHAR(20) NOT NULL DEFAULT 'external';