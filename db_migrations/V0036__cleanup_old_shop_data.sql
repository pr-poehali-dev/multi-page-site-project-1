UPDATE t_p73771717_multi_page_site_proj.shop_products
    SET name = '__hidden__', is_active = false
    WHERE id IN (1,2,3,4,5);

UPDATE t_p73771717_multi_page_site_proj.shop_form_fields
    SET field_name = '__hidden__'
    WHERE product_id IN (1,2,3,4,5);

UPDATE t_p73771717_multi_page_site_proj.shop_orders
    SET status = 'cancelled'
    WHERE id IN (1,2);