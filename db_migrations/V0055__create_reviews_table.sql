CREATE TABLE t_p73771717_multi_page_site_proj.reviews (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    team_name VARCHAR(255) NOT NULL DEFAULT '',
    text TEXT NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_reviews_published ON t_p73771717_multi_page_site_proj.reviews (is_published, created_at DESC);