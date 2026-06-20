CREATE TABLE t_p73771717_multi_page_site_proj.shop_products (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    photo_url TEXT NOT NULL DEFAULT '',
    payment_url TEXT NOT NULL DEFAULT '',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p73771717_multi_page_site_proj.shop_form_fields (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    field_name TEXT NOT NULL DEFAULT '',
    field_label TEXT NOT NULL DEFAULT '',
    field_type TEXT NOT NULL DEFAULT 'text',
    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE t_p73771717_multi_page_site_proj.shop_orders (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL,
    form_data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'new',
    created_at TIMESTAMP DEFAULT NOW()
);