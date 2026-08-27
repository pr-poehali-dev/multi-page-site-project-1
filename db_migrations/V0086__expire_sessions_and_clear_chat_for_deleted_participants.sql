UPDATE t_p73771717_multi_page_site_proj.participant_sessions
SET expires_at = '2000-01-01 00:00:00'
WHERE participant_id IN (SELECT id FROM t_p73771717_multi_page_site_proj.participants WHERE full_name = '[удалён]');

UPDATE t_p73771717_multi_page_site_proj.chat_messages
SET message = '[удалено]'
WHERE participant_id IN (SELECT id FROM t_p73771717_multi_page_site_proj.participants WHERE full_name = '[удалён]');