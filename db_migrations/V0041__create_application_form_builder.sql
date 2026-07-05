CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.application_form_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.application_form_fields (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.application_form_templates(id),
  field_name VARCHAR(100) NOT NULL,
  field_label VARCHAR(255) NOT NULL,
  field_type VARCHAR(30) NOT NULL DEFAULT 'text',
  options TEXT,
  is_required BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

ALTER TABLE t_p73771717_multi_page_site_proj.contests
  ADD COLUMN IF NOT EXISTS form_template_id INTEGER REFERENCES t_p73771717_multi_page_site_proj.application_form_templates(id);

ALTER TABLE t_p73771717_multi_page_site_proj.applications
  ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::jsonb;