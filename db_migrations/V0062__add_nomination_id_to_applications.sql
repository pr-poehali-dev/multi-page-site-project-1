ALTER TABLE t_p73771717_multi_page_site_proj.applications
    ADD COLUMN IF NOT EXISTS nomination_id INTEGER REFERENCES t_p73771717_multi_page_site_proj.nominations(id);
