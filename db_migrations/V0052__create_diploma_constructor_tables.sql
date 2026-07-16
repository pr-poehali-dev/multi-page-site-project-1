CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.diploma_templates (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  template_type TEXT NOT NULL DEFAULT 'diploma',
  orientation TEXT NOT NULL DEFAULT 'portrait',
  background_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.diploma_template_fields (
  id SERIAL PRIMARY KEY,
  template_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.diploma_templates(id),
  data_key TEXT NOT NULL DEFAULT 'custom',
  custom_text TEXT NOT NULL DEFAULT '',
  pos_x NUMERIC NOT NULL DEFAULT 10,
  pos_y NUMERIC NOT NULL DEFAULT 10,
  width NUMERIC NOT NULL DEFAULT 30,
  height NUMERIC NOT NULL DEFAULT 10,
  font_family TEXT NOT NULL DEFAULT 'Montserrat',
  font_size NUMERIC NOT NULL DEFAULT 16,
  font_color TEXT NOT NULL DEFAULT '#000000',
  font_weight TEXT NOT NULL DEFAULT 'normal',
  line_height NUMERIC NOT NULL DEFAULT 1.2,
  text_align TEXT NOT NULL DEFAULT 'center',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.diploma_fonts (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  font_url TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_diploma_template_fields_template_id
  ON t_p73771717_multi_page_site_proj.diploma_template_fields(template_id);
