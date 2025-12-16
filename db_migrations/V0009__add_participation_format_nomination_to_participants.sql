-- Добавление полей participation_format и nomination в таблицу participants
ALTER TABLE participants 
ADD COLUMN participation_format VARCHAR(50),
ADD COLUMN nomination VARCHAR(255);