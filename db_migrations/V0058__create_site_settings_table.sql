CREATE TABLE IF NOT EXISTS t_p73771717_multi_page_site_proj.site_settings (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  message TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO t_p73771717_multi_page_site_proj.site_settings (key, enabled, message)
VALUES (
  'maintenance_notice',
  FALSE,
  'На сайте проводятся технические работы. При обнаружении каких-либо неисправностей пишите нам в чат организатора. Максимально стараемся сделать сервис удобным для Вас и будем признательны за обнаружение недочетов.

С уважением, команда «ИНДИГО»'
)
ON CONFLICT (key) DO NOTHING;