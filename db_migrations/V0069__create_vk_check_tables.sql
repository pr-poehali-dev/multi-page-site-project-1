CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.vk_post_checks (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL UNIQUE REFERENCES t_p73771717_multi_page_site_proj.contests(id),
    post_url TEXT NOT NULL,
    owner_id INTEGER NOT NULL,
    post_id INTEGER NOT NULL,
    require_like BOOLEAN NOT NULL DEFAULT TRUE,
    require_repost BOOLEAN NOT NULL DEFAULT TRUE,
    require_comment BOOLEAN NOT NULL DEFAULT FALSE,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.vk_check_results (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.contests(id),
    application_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.applications(id),
    participant_id INTEGER NULL REFERENCES t_p73771717_multi_page_site_proj.participants(id),
    vk_screen VARCHAR(255) NULL,
    vk_id INTEGER NULL,
    liked BOOLEAN NOT NULL DEFAULT FALSE,
    reposted BOOLEAN NOT NULL DEFAULT FALSE,
    commented BOOLEAN NOT NULL DEFAULT FALSE,
    resolve_error TEXT NULL,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(application_id)
);
