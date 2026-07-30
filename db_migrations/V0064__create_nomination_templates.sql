-- Шаблоны номинаций (создаются один раз, назначаются на любой конкурс)
CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.nomination_templates (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Номинации внутри шаблона
CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.nomination_template_items (
    id SERIAL PRIMARY KEY,
    template_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.nomination_templates(id),
    name TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nom_template_items_template ON t_p73771717_multi_page_site_proj.nomination_template_items(template_id);

-- Критерии внутри номинации шаблона
CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.nomination_template_criteria (
    id SERIAL PRIMARY KEY,
    template_item_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.nomination_template_items(id),
    name TEXT NOT NULL,
    max_score INTEGER NOT NULL DEFAULT 10,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_nom_template_criteria_item ON t_p73771717_multi_page_site_proj.nomination_template_criteria(template_item_id);
