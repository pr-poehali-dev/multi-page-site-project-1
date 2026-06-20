ALTER TABLE t_p73771717_multi_page_site_proj.shop_orders
  ADD COLUMN IF NOT EXISTS alfa_order_id TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_url TEXT NOT NULL DEFAULT '';