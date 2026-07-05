-- Заморозка редактирования отдельной заявки участником
ALTER TABLE t_p73771717_multi_page_site_proj.applications
  ADD COLUMN IF NOT EXISTS editing_locked BOOLEAN NOT NULL DEFAULT FALSE;

-- Заморозка редактирования заявок для всего конкурса разом
ALTER TABLE t_p73771717_multi_page_site_proj.contests
  ADD COLUMN IF NOT EXISTS applications_locked BOOLEAN NOT NULL DEFAULT FALSE;