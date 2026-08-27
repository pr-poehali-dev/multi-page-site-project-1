ALTER TABLE t_p73771717_multi_page_site_proj.application_files
ADD COLUMN IF NOT EXISTS category VARCHAR(20) NOT NULL DEFAULT 'attachment';

COMMENT ON COLUMN t_p73771717_multi_page_site_proj.application_files.category IS
'attachment — файл, приложенный участником к заявке; material — фото/видео с выступления, загруженные организатором';