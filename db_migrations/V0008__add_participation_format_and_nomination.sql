-- Добавление полей participation_format и nomination в таблицу applications
ALTER TABLE applications 
ADD COLUMN participation_format VARCHAR(50),
ADD COLUMN nomination VARCHAR(255);