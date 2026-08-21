ALTER TABLE t_p73771717_multi_page_site_proj.shop_categories
    ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES t_p73771717_multi_page_site_proj.contests(id);