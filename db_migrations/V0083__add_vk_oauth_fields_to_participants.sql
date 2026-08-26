ALTER TABLE t_p73771717_multi_page_site_proj.participants
    ADD COLUMN IF NOT EXISTS vk_user_id BIGINT UNIQUE,
    ADD COLUMN IF NOT EXISTS profile_complete BOOLEAN NOT NULL DEFAULT TRUE;

ALTER TABLE t_p73771717_multi_page_site_proj.participants
    ALTER COLUMN phone SET DEFAULT '';
