CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.chat_messages (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES t_p73771717_multi_page_site_proj.participants(id),
  sender VARCHAR(10) NOT NULL CHECK (sender IN ('admin', 'user')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  is_read BOOLEAN DEFAULT FALSE
);