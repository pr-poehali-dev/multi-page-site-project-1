CREATE TABLE IF NOT EXISTS concerts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  poster_url TEXT,
  ticket_link TEXT,
  details_link TEXT,
  location VARCHAR(500),
  event_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_concerts_event_date ON concerts(event_date);
CREATE INDEX IF NOT EXISTS idx_concerts_status ON concerts(status);
