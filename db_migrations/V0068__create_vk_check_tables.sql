CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.vk_check_posts (
    contest_id INTEGER PRIMARY KEY REFERENCES t_p73771717_multi_page_site_proj.contests(id),
    post_url TEXT NOT NULL,
    owner_id BIGINT NOT NULL,
    post_id BIGINT NOT NULL,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.vk_check_results (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.contests(id),
    application_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.applications(id),
    vk_user_id BIGINT NULL,
    vk_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    liked BOOLEAN NOT NULL DEFAULT FALSE,
    reposted BOOLEAN NOT NULL DEFAULT FALSE,
    commented BOOLEAN NOT NULL DEFAULT FALSE,
    checked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(contest_id, application_id)
);