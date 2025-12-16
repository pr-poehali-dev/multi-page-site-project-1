-- Добавляем поле для логина и пароля жюри
ALTER TABLE jury_members ADD COLUMN login VARCHAR(100) UNIQUE;
ALTER TABLE jury_members ADD COLUMN password_hash VARCHAR(255);

-- Таблица для хранения оценок конкурсантов
CREATE TABLE participant_scores (
  id SERIAL PRIMARY KEY,
  participant_id INTEGER NOT NULL REFERENCES participants(id),
  jury_member_id INTEGER NOT NULL REFERENCES jury_members(id),
  contest_id INTEGER NOT NULL REFERENCES contests(id),
  score DECIMAL(4, 2) NOT NULL CHECK (score >= 0 AND score <= 10),
  comment TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(participant_id, jury_member_id)
);

CREATE INDEX idx_participant_scores_participant ON participant_scores(participant_id);
CREATE INDEX idx_participant_scores_jury ON participant_scores(jury_member_id);
CREATE INDEX idx_participant_scores_contest ON participant_scores(contest_id);

-- Таблица для сессий жюри
CREATE TABLE jury_sessions (
  id SERIAL PRIMARY KEY,
  jury_member_id INTEGER NOT NULL REFERENCES jury_members(id),
  session_token VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_jury_sessions_token ON jury_sessions(session_token);
CREATE INDEX idx_jury_sessions_expires ON jury_sessions(expires_at);