ALTER TABLE t_p73771717_multi_page_site_proj.notifications
    ADD COLUMN IF NOT EXISTS participant_id INTEGER NULL REFERENCES t_p73771717_multi_page_site_proj.participants(id);