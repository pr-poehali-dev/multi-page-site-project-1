ALTER TABLE t_p73771717_multi_page_site_proj.participants
  ADD COLUMN IF NOT EXISTS reset_code character varying(6) NULL,
  ADD COLUMN IF NOT EXISTS reset_code_expires_at timestamp without time zone NULL;