-- Create jury members table
CREATE TABLE IF NOT EXISTS jury_members (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    specialty VARCHAR(255) NOT NULL,
    bio TEXT NOT NULL,
    image_url TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial jury members
INSERT INTO jury_members (name, role, specialty, bio, image_url, sort_order) VALUES
('Анна Петрова', 'Заслуженная артистка России', 'Вокал', 'Солистка Большого театра, профессор консерватории. Лауреат международных конкурсов.', NULL, 1),
('Михаил Соколов', 'Народный артист России', 'Фортепиано', 'Пианист с мировым именем, руководитель музыкальной академии.', NULL, 2),
('Елена Волкова', 'Хореограф-постановщик', 'Хореография', 'Художественный руководитель балетной труппы, постановщик 50+ спектаклей.', NULL, 3),
('Дмитрий Кузнецов', 'Дирижер', 'Оркестр', 'Главный дирижер симфонического оркестра, лауреат премии Грэмми.', NULL, 4),
('Ольга Смирнова', 'Музыкальный критик', 'Теория музыки', 'Доктор искусствоведения, автор 10 книг о современной музыке.', NULL, 5),
('Игорь Новиков', 'Композитор', 'Композиция', 'Автор музыки к 30 кинофильмам и театральным постановкам.', NULL, 6);