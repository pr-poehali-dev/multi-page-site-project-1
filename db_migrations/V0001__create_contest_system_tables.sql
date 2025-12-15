-- Таблица конкурсов
CREATE TABLE IF NOT EXISTS contests (
    id SERIAL PRIMARY KEY,
    contest_key VARCHAR(100) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'upcoming',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица участников
CREATE TABLE IF NOT EXISTS participants (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) NOT NULL,
    birth_date DATE NOT NULL,
    city VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица заявок
CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    participant_id INTEGER REFERENCES participants(id),
    contest_id INTEGER REFERENCES contests(id),
    category VARCHAR(100) NOT NULL,
    experience VARCHAR(50),
    achievements TEXT,
    additional_info TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    UNIQUE(participant_id, contest_id)
);

-- Таблица загруженных файлов
CREATE TABLE IF NOT EXISTS application_files (
    id SERIAL PRIMARY KEY,
    application_id INTEGER REFERENCES applications(id),
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);
CREATE INDEX IF NOT EXISTS idx_applications_participant ON applications(participant_id);
CREATE INDEX IF NOT EXISTS idx_applications_contest ON applications(contest_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Вставляем начальные конкурсы
INSERT INTO contests (contest_key, title, description, start_date, end_date, status) VALUES
('winter-piano', 'Зимний конкурс пианистов 2025', 'Престижный конкурс для талантливых пианистов', '2025-02-01', '2025-02-15', 'upcoming'),
('spring-vocal', 'Весенний вокальный конкурс 2025', 'Конкурс для вокалистов всех возрастов', '2025-04-01', '2025-04-20', 'upcoming'),
('dance-festival', 'Танцевальный фестиваль 2025', 'Фестиваль современного танца', '2025-06-01', '2025-06-10', 'upcoming'),
('art-competition', 'Конкурс изобразительного искусства', 'Конкурс для художников и иллюстраторов', '2025-08-01', '2025-08-30', 'upcoming')
ON CONFLICT (contest_key) DO NOTHING;
