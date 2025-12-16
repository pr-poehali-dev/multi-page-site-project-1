-- Добавляем поля для системы оценивания в таблицу participants
ALTER TABLE participants 
ADD COLUMN IF NOT EXISTS contest_id INTEGER REFERENCES contests(id),
ADD COLUMN IF NOT EXISTS age INTEGER,
ADD COLUMN IF NOT EXISTS category VARCHAR(100),
ADD COLUMN IF NOT EXISTS performance_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';

-- Создаем индекс для быстрого поиска по конкурсу и статусу
CREATE INDEX IF NOT EXISTS idx_participants_contest ON participants(contest_id);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);

-- Комментарии к новым полям
COMMENT ON COLUMN participants.contest_id IS 'ID конкурса, к которому относится участник';
COMMENT ON COLUMN participants.age IS 'Возраст участника (вычисляется из birth_date)';
COMMENT ON COLUMN participants.category IS 'Категория/номинация участника';
COMMENT ON COLUMN participants.performance_title IS 'Название выступления/произведения';
COMMENT ON COLUMN participants.status IS 'Статус: pending, approved, rejected';