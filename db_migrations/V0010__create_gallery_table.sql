CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.gallery_items (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('photo', 'video')),
  contest_id INTEGER REFERENCES t_p73771717_multi_page_site_proj.contests(id),
  display_order INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gallery_contest ON t_p73771717_multi_page_site_proj.gallery_items(contest_id);
CREATE INDEX idx_gallery_order ON t_p73771717_multi_page_site_proj.gallery_items(display_order);
CREATE INDEX idx_gallery_featured ON t_p73771717_multi_page_site_proj.gallery_items(is_featured);