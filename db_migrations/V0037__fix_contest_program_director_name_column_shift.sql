-- Fix column shift: rows imported before director_name was added to import payload
-- Current wrong state: director_name=age, age=nomination, nomination=piece_title, piece_title='', duration=director_name
-- Target: director_name=duration(current), age=director_name(current), nomination=age(current), piece_title=nomination(current), duration=''
UPDATE t_p73771717_multi_page_site_proj.contest_program
SET
  director_name = duration,
  age           = director_name,
  nomination    = age,
  piece_title   = nomination,
  duration      = ''
WHERE piece_title = '' AND director_name != '';