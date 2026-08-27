UPDATE t_p73771717_multi_page_site_proj.participants
SET vk_user_id = NULL, vk_link = NULL
WHERE full_name = '[удалён]' AND (vk_user_id IS NOT NULL OR vk_link IS NOT NULL);