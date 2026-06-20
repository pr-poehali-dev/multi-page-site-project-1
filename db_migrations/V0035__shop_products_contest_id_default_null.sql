ALTER TABLE t_p73771717_multi_page_site_proj.shop_products
    ALTER COLUMN contest_id SET DEFAULT NULL;

UPDATE t_p73771717_multi_page_site_proj.shop_products
    SET contest_id = NULL WHERE contest_id = 0;