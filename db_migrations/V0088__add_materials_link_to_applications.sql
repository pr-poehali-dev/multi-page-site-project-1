ALTER TABLE t_p73771717_multi_page_site_proj.applications
ADD COLUMN IF NOT EXISTS materials_link TEXT;

COMMENT ON COLUMN t_p73771717_multi_page_site_proj.applications.materials_link IS
'Ссылка на папку с фото/видео с выступления (Яндекс.Диск, Облако Mail.ru и т.п.), задаётся организатором';