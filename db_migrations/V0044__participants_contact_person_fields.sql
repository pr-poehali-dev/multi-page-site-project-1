ALTER TABLE t_p73771717_multi_page_site_proj.participants
  ADD COLUMN IF NOT EXISTS contact_position VARCHAR(255),
  ADD COLUMN IF NOT EXISTS vk_link VARCHAR(500);