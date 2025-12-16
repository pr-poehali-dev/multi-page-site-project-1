-- Обновляем существующих участников с одобренными заявками
UPDATE participants p 
SET 
    contest_id = a.contest_id,
    age = EXTRACT(YEAR FROM AGE(NOW(), p.birth_date))::INTEGER,
    category = a.category,
    status = 'approved'
FROM applications a 
WHERE p.id = a.participant_id 
  AND a.status = 'approved' 
  AND p.contest_id IS NULL;