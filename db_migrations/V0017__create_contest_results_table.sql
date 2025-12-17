-- Создание таблицы для итогов конкурсов
CREATE TABLE IF NOT EXISTS contest_results (
    id SERIAL PRIMARY KEY,
    contest_id INTEGER NOT NULL REFERENCES contests(id),
    title VARCHAR(500) NOT NULL,
    description TEXT,
    pdf_url TEXT,
    published_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по конкурсу
CREATE INDEX IF NOT EXISTS idx_contest_results_contest_id ON contest_results(contest_id);

-- Индекс для сортировки по дате публикации
CREATE INDEX IF NOT EXISTS idx_contest_results_published_date ON contest_results(published_date DESC);