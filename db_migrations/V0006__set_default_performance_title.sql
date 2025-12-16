-- Установка значения по умолчанию для существующих записей с пустым performance_title
UPDATE participants 
SET performance_title = 'Название номера не указано' 
WHERE performance_title IS NULL;