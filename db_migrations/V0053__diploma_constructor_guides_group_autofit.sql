ALTER TABLE t_p73771717_multi_page_site_proj.diploma_templates
  ADD COLUMN IF NOT EXISTS guides TEXT NOT NULL DEFAULT '[]';

ALTER TABLE t_p73771717_multi_page_site_proj.diploma_template_fields
  ADD COLUMN IF NOT EXISTS group_id INTEGER NULL,
  ADD COLUMN IF NOT EXISTS auto_fit BOOLEAN NOT NULL DEFAULT true;