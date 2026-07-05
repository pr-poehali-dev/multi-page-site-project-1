-- Добавляем колонку для маркировки системных (обязательных) полей формы
ALTER TABLE t_p73771717_multi_page_site_proj.application_form_fields
  ADD COLUMN IF NOT EXISTS system_key VARCHAR(50);

-- Добавляем колонку "Формат участия" в программу конкурса
ALTER TABLE t_p73771717_multi_page_site_proj.contest_program
  ADD COLUMN IF NOT EXISTS participation_format TEXT NOT NULL DEFAULT '';

-- Привязываем уже существующие поля шаблона №1 к системным ключам
UPDATE t_p73771717_multi_page_site_proj.application_form_fields SET system_key = 'participant_name', is_required = TRUE WHERE template_id = 1 AND field_name = 'field_1';
UPDATE t_p73771717_multi_page_site_proj.application_form_fields SET system_key = 'directing_party', is_required = TRUE WHERE template_id = 1 AND field_name = 'field_16';
UPDATE t_p73771717_multi_page_site_proj.application_form_fields SET system_key = 'age_category', is_required = TRUE WHERE template_id = 1 AND field_name = 'field_3';
UPDATE t_p73771717_multi_page_site_proj.application_form_fields SET system_key = 'nomination', is_required = TRUE WHERE template_id = 1 AND field_name = 'field_4';
UPDATE t_p73771717_multi_page_site_proj.application_form_fields SET system_key = 'duration', is_required = TRUE WHERE template_id = 1 AND field_name = 'field_6';
UPDATE t_p73771717_multi_page_site_proj.application_form_fields SET system_key = 'piece_title', is_required = TRUE WHERE template_id = 1 AND field_name = 'field_7';
UPDATE t_p73771717_multi_page_site_proj.application_form_fields SET system_key = 'director_name', is_required = TRUE WHERE template_id = 1 AND field_name = 'field_10';

-- Добавляем недостающие системные поля шаблону №1
INSERT INTO t_p73771717_multi_page_site_proj.application_form_fields
  (template_id, field_name, field_label, field_type, options, is_required, sort_order, system_key)
SELECT 1, 'sys_region', 'Регион проживания', 'text', '', TRUE, 17, 'region'
WHERE NOT EXISTS (SELECT 1 FROM t_p73771717_multi_page_site_proj.application_form_fields WHERE template_id = 1 AND system_key = 'region');

INSERT INTO t_p73771717_multi_page_site_proj.application_form_fields
  (template_id, field_name, field_label, field_type, options, is_required, sort_order, system_key)
SELECT 1, 'sys_participation_format', 'Формат участия', 'select', 'Очно,Заочно,Онлайн', TRUE, 18, 'participation_format'
WHERE NOT EXISTS (SELECT 1 FROM t_p73771717_multi_page_site_proj.application_form_fields WHERE template_id = 1 AND system_key = 'participation_format');