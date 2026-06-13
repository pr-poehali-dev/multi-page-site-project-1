ALTER TABLE events ADD COLUMN IF NOT EXISTS group_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_events_group_id ON events(group_id);