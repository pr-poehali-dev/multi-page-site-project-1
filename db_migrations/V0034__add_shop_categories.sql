ALTER TABLE t_p73771717_multi_page_site_proj.shop_products
    ADD COLUMN category_id INTEGER;

CREATE TABLE t_p73771717_multi_page_site_proj.shop_categories (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);