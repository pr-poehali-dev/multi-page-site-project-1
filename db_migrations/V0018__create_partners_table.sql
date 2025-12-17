-- Создание таблицы для партнёров и спонсоров
CREATE TABLE IF NOT EXISTS partners (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT NOT NULL,
    website_url TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для сортировки по порядку отображения
CREATE INDEX IF NOT EXISTS idx_partners_display_order ON partners(display_order ASC);

-- Индекс для фильтрации активных партнёров
CREATE INDEX IF NOT EXISTS idx_partners_is_active ON partners(is_active);