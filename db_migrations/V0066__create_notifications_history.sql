CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.notifications (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    contest_id INTEGER NULL REFERENCES t_p73771717_multi_page_site_proj.contests(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.notification_reads (
    notification_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.notifications(id),
    participant_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.participants(id),
    read_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (notification_id, participant_id)
);