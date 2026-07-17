import json
import os
import base64
import random
import string
import uuid
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, date
from decimal import Decimal

SCHEMA = 't_p73771717_multi_page_site_proj'

MAX_BACKGROUND_SIZE_BYTES = 20 * 1024 * 1024  # 20 МБ

JURY_COUNTS = [1, 2, 3, 4, 5]
LEVELS = ['grand_prix_min', 'laureate_1_min', 'laureate_2_min', 'laureate_3_min', 'diplom_1_min', 'diplom_2_min', 'diplom_3_min']

DEFAULT_SCORING = {}
for n in JURY_COUNTS:
    DEFAULT_SCORING[f'jury_count_{n}_grand_prix_min'] = n * 95
    DEFAULT_SCORING[f'jury_count_{n}_laureate_1_min'] = n * 85
    DEFAULT_SCORING[f'jury_count_{n}_laureate_2_min'] = n * 75
    DEFAULT_SCORING[f'jury_count_{n}_laureate_3_min'] = n * 65
    DEFAULT_SCORING[f'jury_count_{n}_diplom_1_min'] = n * 55
    DEFAULT_SCORING[f'jury_count_{n}_diplom_2_min'] = n * 45
    DEFAULT_SCORING[f'jury_count_{n}_diplom_3_min'] = n * 35


def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f'Object of type {type(obj)} is not JSON serializable')


def _resp(status: int, data: Dict[str, Any]) -> Dict[str, Any]:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(data, default=json_serial),
        'isBase64Encoded': False,
    }


def upload_to_s3(file_b64: str, key: str, content_type: str) -> str:
    file_data = base64.b64decode(file_b64)
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=file_data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление программой конкурса, системой оценивания и конструктором дипломов.
    --- Программа ---
    GET  /?contest_id=X                     — получить программу и правила оценивания конкурса
    POST /                                  — создать строку программы
    PUT  /                                  — обновить строку программы
    DELETE /                                — удалить строку программы
    POST /?action=scoring                   — сохранить систему оценивания конкурса
    --- Конструктор дипломов: шаблоны ---
    GET  /?action=templates                 — список всех шаблонов
    GET  /?action=template&id=X             — шаблон + его поля
    POST /?action=template_create           — создать { name, template_type, orientation }
    PUT  /?action=template_update&id=X      — обновить { name, template_type, orientation, background_url }
    DELETE /?action=template_delete&id=X    — удалить шаблон
    POST /?action=upload_background&id=X    — загрузить фон { file_base64, file_name }
    DELETE /?action=delete_background&id=X  — удалить фон
    POST /?action=save_fields&template_id=X — сохранить поля шаблона (полная замена)
    --- Конструктор дипломов: шрифты ---
    GET  /?action=fonts                     — список загруженных шрифтов
    POST /?action=upload_font               — загрузить шрифт { name, file_base64, file_name }
    DELETE /?action=delete_font&id=X        — удалить шрифт
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True

    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    try:
        if method == 'GET':
            if action == 'templates':
                return list_templates(conn)
            elif action == 'template':
                return get_template(conn, params.get('id'))
            elif action == 'fonts':
                return list_fonts(conn)
            else:
                return get_program(conn, event)
        elif method == 'POST':
            if action == 'scoring':
                return save_scoring(conn, event)
            elif action == 'template_create':
                return create_template(conn, event)
            elif action == 'upload_background':
                return upload_background(conn, params.get('id'), event)
            elif action == 'save_fields':
                return save_fields(conn, params.get('template_id'), event)
            elif action == 'upload_font':
                return upload_font(conn, event)
            else:
                return create_row(conn, event)
        elif method == 'PUT':
            if action == 'template_update':
                return update_template(conn, params.get('id'), event)
            else:
                return update_row(conn, event)
        elif method == 'DELETE':
            if action == 'template_delete':
                return delete_template(conn, params.get('id'))
            elif action == 'delete_font':
                return delete_font(conn, params.get('id'))
            elif action == 'delete_background':
                return delete_background(conn, params.get('id'))
            else:
                return delete_row(conn, event)
        else:
            return {'statusCode': 405, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Метод не поддерживается'}), 'isBase64Encoded': False}
    finally:
        conn.close()


def generate_diploma_number(conn) -> str:
    '''Генерация уникального номера диплома: 2 случайные буквы + 6 цифр (сквозная нумерация)'''
    series = ''.join(random.choices(string.ascii_uppercase, k=2))
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT COALESCE(MAX(CAST(SUBSTRING(diploma_number FROM 3) AS INTEGER)), 0) + 1 AS next_num
            FROM {SCHEMA}.contest_program
            WHERE diploma_number ~ '^[A-Z]{{2}}[0-9]{{6}}$'
        ''')
        next_num = cur.fetchone()['next_num']
    return f'{series}{str(next_num).zfill(6)}'


def get_program(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Получение программы и правил оценивания конкурса'''
    params = event.get('queryStringParameters') or {}
    contest_id = params.get('contest_id')

    if not contest_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'contest_id обязателен'}), 'isBase64Encoded': False}

    scoring_cols = ', '.join([f'jury_count_{n}_{lvl}' for n in JURY_COUNTS for lvl in LEVELS])

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT id, order_number, region, directing_party, participant_name, age, nomination, piece_title, duration, diploma_number, director_name, participation_format
            FROM {SCHEMA}.contest_program
            WHERE contest_id = %s
            ORDER BY order_number
        ''', (contest_id,))
        rows = list(cur.fetchall())

        cur.execute(f'''
            SELECT {scoring_cols}
            FROM {SCHEMA}.contest_scoring_rules
            WHERE contest_id = %s
        ''', (contest_id,))
        scoring = cur.fetchone()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'rows': rows, 'scoring': dict(scoring) if scoring else DEFAULT_SCORING}),
        'isBase64Encoded': False
    }


def create_row(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Добавление строки в программу'''
    body = json.loads(event.get('body', '{}'))
    contest_id = body.get('contest_id')
    if not contest_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'contest_id обязателен'}), 'isBase64Encoded': False}

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT COALESCE(MAX(order_number), 0) + 1 AS next_num
            FROM {SCHEMA}.contest_program
            WHERE contest_id = %s
        ''', (contest_id,))
        next_num = cur.fetchone()['next_num']

        order_number = body.get('order_number', next_num)

        diploma_number = generate_diploma_number(conn)

        cur.execute(f'''
            INSERT INTO {SCHEMA}.contest_program
              (contest_id, order_number, region, directing_party, participant_name, age, nomination, piece_title, duration, diploma_number, director_name, participation_format)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, order_number, region, directing_party, participant_name, age, nomination, piece_title, duration, diploma_number, director_name, participation_format
        ''', (
            contest_id,
            order_number,
            body.get('region', ''),
            body.get('directing_party', ''),
            body.get('participant_name', ''),
            body.get('age', ''),
            body.get('nomination', ''),
            body.get('piece_title', ''),
            body.get('duration', ''),
            diploma_number,
            body.get('director_name', ''),
            body.get('participation_format', '')
        ))
        row = dict(cur.fetchone())

    return {
        'statusCode': 201,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'row': row}),
        'isBase64Encoded': False
    }


def update_row(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Обновление строки программы'''
    body = json.loads(event.get('body', '{}'))
    row_id = body.get('id')
    if not row_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'id строки обязателен'}), 'isBase64Encoded': False}

    fields = ['order_number', 'region', 'directing_party', 'participant_name', 'age', 'nomination', 'piece_title', 'duration', 'diploma_number', 'director_name', 'participation_format']
    updates = []
    values = []
    for f in fields:
        if f in body:
            updates.append(f'{f} = %s')
            values.append(body[f])

    if not updates:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Нет полей для обновления'}), 'isBase64Encoded': False}

    values.append(row_id)
    with conn.cursor() as cur:
        cur.execute(f'UPDATE {SCHEMA}.contest_program SET {", ".join(updates)}, updated_at = NOW() WHERE id = %s', values)

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }


def delete_row(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Удаление строки программы'''
    body = json.loads(event.get('body', '{}'))
    row_id = body.get('id')
    if not row_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'id строки обязателен'}), 'isBase64Encoded': False}

    with conn.cursor() as cur:
        cur.execute(f'DELETE FROM {SCHEMA}.contest_program WHERE id = %s', (row_id,))

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }


def save_scoring(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Сохранение системы оценивания (пороговых значений) конкурса'''
    body = json.loads(event.get('body', '{}'))
    contest_id = body.get('contest_id')
    if not contest_id:
        return _resp(400, {'error': 'contest_id обязателен'})

    cols = [f'jury_count_{n}_{lvl}' for n in JURY_COUNTS for lvl in LEVELS]
    values = [body.get(c, DEFAULT_SCORING[c]) for c in cols]

    with conn.cursor() as cur:
        cur.execute(f'SELECT id FROM {SCHEMA}.contest_scoring_rules WHERE contest_id = %s', (contest_id,))
        exists = cur.fetchone()
        if exists:
            sets = ', '.join([f'{c} = %s' for c in cols])
            cur.execute(f'UPDATE {SCHEMA}.contest_scoring_rules SET {sets}, updated_at = NOW() WHERE contest_id = %s', values + [contest_id])
        else:
            placeholders = ', '.join(['%s'] * (len(cols) + 1))
            cur.execute(f'INSERT INTO {SCHEMA}.contest_scoring_rules (contest_id, {", ".join(cols)}) VALUES ({placeholders})', [contest_id] + values)

    return _resp(200, {'success': True})


# ══════════════════════════════════════════════════════════════════════════════
# КОНСТРУКТОР ДИПЛОМОВ: ШАБЛОНЫ
# ══════════════════════════════════════════════════════════════════════════════

def list_templates(conn) -> Dict[str, Any]:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT t.*, COUNT(f.id) AS fields_count
            FROM {SCHEMA}.diploma_templates t
            LEFT JOIN {SCHEMA}.diploma_template_fields f ON f.template_id = t.id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        ''')
        templates = [dict(r) for r in cur.fetchall()]
    return _resp(200, {'templates': templates})


def get_template(conn, tid) -> Dict[str, Any]:
    if not tid:
        return _resp(400, {'error': 'id required'})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'SELECT * FROM {SCHEMA}.diploma_templates WHERE id = %s', (tid,))
        template = cur.fetchone()
        if not template:
            return _resp(404, {'error': 'not found'})
        cur.execute(f'''
            SELECT * FROM {SCHEMA}.diploma_template_fields
            WHERE template_id = %s ORDER BY sort_order, id
        ''', (tid,))
        fields = [dict(f) for f in cur.fetchall()]
    template = dict(template)
    try:
        template['guides'] = json.loads(template.get('guides') or '[]')
    except (json.JSONDecodeError, TypeError):
        template['guides'] = []
    return _resp(200, {'template': template, 'fields': fields})


def create_template(conn, event) -> Dict[str, Any]:
    body = json.loads(event.get('body') or '{}')
    name = (body.get('name') or '').strip()
    if not name:
        return _resp(400, {'error': 'name required'})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            INSERT INTO {SCHEMA}.diploma_templates (name, template_type, orientation)
            VALUES (%s, %s, %s) RETURNING *
        ''', (name, body.get('template_type', 'diploma'), body.get('orientation', 'portrait')))
        template = dict(cur.fetchone())
    return _resp(200, {'template': template})


def update_template(conn, tid, event) -> Dict[str, Any]:
    body = json.loads(event.get('body') or '{}')
    if not tid:
        return _resp(400, {'error': 'id required'})
    sets, vals = [], []
    for f in ['name', 'template_type', 'orientation', 'background_url', 'guides']:
        if f in body:
            sets.append(f'{f} = %s')
            vals.append(json.dumps(body[f]) if f == 'guides' else body[f])
    if not sets:
        return _resp(400, {'error': 'nothing to update'})
    sets.append('updated_at = NOW()')
    vals.append(tid)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            UPDATE {SCHEMA}.diploma_templates SET {', '.join(sets)}
            WHERE id = %s RETURNING *
        ''', vals)
        template = cur.fetchone()
    return _resp(200, {'template': dict(template) if template else None})


def delete_template(conn, tid) -> Dict[str, Any]:
    if not tid:
        return _resp(400, {'error': 'id required'})
    with conn.cursor() as cur:
        cur.execute(f'DELETE FROM {SCHEMA}.diploma_template_fields WHERE template_id = %s', (tid,))
        cur.execute(f'DELETE FROM {SCHEMA}.diploma_templates WHERE id = %s', (tid,))
    return _resp(200, {'ok': True})


def upload_background(conn, tid, event) -> Dict[str, Any]:
    body = json.loads(event.get('body') or '{}')
    file_b64 = body.get('file_base64', '')
    file_name = body.get('file_name', 'bg.jpg')
    if not tid or not file_b64:
        return _resp(400, {'error': 'id and file_base64 required'})
    approx_size = len(file_b64) * 3 / 4
    if approx_size > MAX_BACKGROUND_SIZE_BYTES:
        return _resp(400, {'error': 'Максимальный размер подложки — 20 МБ'})
    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'jpg'
    content_type = f'image/{ext}' if ext != 'jpg' else 'image/jpeg'
    version = uuid.uuid4().hex[:8]
    url = upload_to_s3(file_b64, f'diploma-templates/{tid}/background_{version}.{ext}', content_type)
    with conn.cursor() as cur:
        cur.execute(f'UPDATE {SCHEMA}.diploma_templates SET background_url = %s, updated_at = NOW() WHERE id = %s', (url, tid))
    return _resp(200, {'background_url': url})


def delete_background(conn, tid) -> Dict[str, Any]:
    if not tid:
        return _resp(400, {'error': 'id required'})
    with conn.cursor() as cur:
        cur.execute(f"UPDATE {SCHEMA}.diploma_templates SET background_url = '', updated_at = NOW() WHERE id = %s", (tid,))
    return _resp(200, {'ok': True})


def save_fields(conn, tid, event) -> Dict[str, Any]:
    body = json.loads(event.get('body') or '{}')
    fields = body.get('fields', [])
    if not tid:
        return _resp(400, {'error': 'template_id required'})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'SELECT id FROM {SCHEMA}.diploma_templates WHERE id = %s', (tid,))
        if not cur.fetchone():
            return _resp(404, {'error': 'template not found'})
        cur.execute(f'DELETE FROM {SCHEMA}.diploma_template_fields WHERE template_id = %s', (tid,))
        saved = []
        for i, f in enumerate(fields):
            cur.execute(f'''
                INSERT INTO {SCHEMA}.diploma_template_fields
                  (template_id, data_key, custom_text, prefix_text, pos_x, pos_y, width, height,
                   font_family, font_size, font_color, font_weight, line_height, text_align, sort_order,
                   group_id, auto_fit)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                RETURNING *
            ''', (
                tid,
                f.get('data_key', 'custom'),
                f.get('custom_text', ''),
                f.get('prefix_text', ''),
                f.get('pos_x', 10),
                f.get('pos_y', 10),
                f.get('width', 30),
                f.get('height', 10),
                f.get('font_family', 'Montserrat'),
                f.get('font_size', 16),
                f.get('font_color', '#000000'),
                f.get('font_weight', 'normal'),
                f.get('line_height', 1.2),
                f.get('text_align', 'center'),
                i,
                f.get('group_id'),
                f.get('auto_fit', True),
            ))
            saved.append(dict(cur.fetchone()))
    return _resp(200, {'fields': saved})


# ══════════════════════════════════════════════════════════════════════════════
# КОНСТРУКТОР ДИПЛОМОВ: ШРИФТЫ
# ══════════════════════════════════════════════════════════════════════════════

def list_fonts(conn) -> Dict[str, Any]:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'SELECT * FROM {SCHEMA}.diploma_fonts ORDER BY name')
        fonts = [dict(r) for r in cur.fetchall()]
    return _resp(200, {'fonts': fonts})


def repair_font_bytes(file_data: bytes, ext: str) -> bytes:
    '''
    Чиним и облегчаем TTF/OTF файлы перед сохранением, чтобы их гарантированно
    принимал строгий OTS-санитайзер, встроенный в браузеры (Chrome и др.).
    Он отклоняет файл с ошибкой "Invalid font data", если:
      1) неверные контрольные суммы таблиц (частая проблема у старых/самодельных шрифтов) —
         чинится простым пересохранением через fontTools;
      2) нестандартный TrueType-байткод хинтинга в таблицах fpgm/prep/cvt/glyf
         (типично для шрифтов, сделанных в старых редакторах вроде FontForge/старых
         конвертеров 1990-2000х) — OTS может не суметь провалидировать такой байткод
         и просто отбраковывает весь файл. Убираем хинтинг через fontTools.subset —
         это безопасно и не портит начертание глифов, просто убирает пиксельные
         подсказки для мелких размеров на старых экранах.
    Если файл повреждён настолько, что fontTools не может его прочитать — возвращаем
    исходные байты как есть (пусть браузер сам решает).
    '''
    if ext not in ('ttf', 'otf'):
        return file_data
    import io
    try:
        from fontTools.ttLib import TTFont
        from fontTools import subset

        buf_in = io.BytesIO(file_data)
        font = TTFont(buf_in, fontNumber=0)

        options = subset.Options()
        options.hinting = False
        options.notdef_outline = True
        options.name_IDs = ['*']
        options.name_legacy = True
        options.glyph_names = True
        options.recalc_bounds = True
        options.recalc_timestamp = True
        subsetter = subset.Subsetter(options)
        subsetter.populate(glyphs=font.getGlyphOrder())
        subsetter.subset(font)

        buf_out = io.BytesIO()
        font.save(buf_out)
        return buf_out.getvalue()
    except Exception:
        try:
            buf_in = io.BytesIO(file_data)
            font = TTFont(buf_in, fontNumber=0)
            buf_out = io.BytesIO()
            font.save(buf_out)
            return buf_out.getvalue()
        except Exception:
            return file_data


def upload_font(conn, event) -> Dict[str, Any]:
    body = json.loads(event.get('body') or '{}')
    name = (body.get('name') or '').strip()
    file_b64 = body.get('file_base64', '')
    file_name = body.get('file_name', 'font.ttf')
    if not name or not file_b64:
        return _resp(400, {'error': 'name and file_base64 required'})
    ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'ttf'
    content_type = 'font/ttf' if ext == 'ttf' else 'font/otf' if ext == 'otf' else 'application/octet-stream'
    safe_name = name.replace(' ', '_')

    file_data = base64.b64decode(file_b64)
    file_data = repair_font_bytes(file_data, ext)
    file_b64_fixed = base64.b64encode(file_data).decode()

    # Уникальный суффикс в ключе файла — чтобы при повторной загрузке шрифта с тем же именем
    # получался новый URL и браузер/CDN не отдавали закэшированную старую версию файла.
    version = uuid.uuid4().hex[:8]
    url = upload_to_s3(file_b64_fixed, f'diploma-fonts/{safe_name}_{version}.{ext}', content_type)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'INSERT INTO {SCHEMA}.diploma_fonts (name, font_url) VALUES (%s, %s) RETURNING *', (name, url))
        font = dict(cur.fetchone())
    return _resp(200, {'font': font})


def delete_font(conn, fid) -> Dict[str, Any]:
    if not fid:
        return _resp(400, {'error': 'id required'})
    with conn.cursor() as cur:
        cur.execute(f'DELETE FROM {SCHEMA}.diploma_fonts WHERE id = %s', (fid,))
    return _resp(200, {'ok': True})