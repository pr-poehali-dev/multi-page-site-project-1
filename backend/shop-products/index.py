import json
import os
import base64
import boto3
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, date


def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f'Object of type {type(obj)} is not JSON serializable')


SCHEMA = 't_p73771717_multi_page_site_proj'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Управление категориями и товарами интернет-магазина.
    --- Категории ---
    GET  /?action=categories                      — список всех категорий
    POST /?action=category_create                 — создать категорию { name, sort_order }
    PUT  /?action=category_update&id=X            — обновить { name, sort_order }
    PUT  /?action=category_delete&id=X            — удалить (помечает deleted=true)
    --- Товары ---
    GET  /?action=list&category_id=X             — список товаров категории
    GET  /?action=product&id=X                   — товар + поля формы
    POST /?action=create                         — создать товар
    PUT  /?action=update&id=X                    — обновить товар
    POST /?action=upload_photo&id=X              — загрузить фото товара
    --- Поля формы ---
    GET  /?action=fields&product_id=X            — поля формы товара
    POST /?action=save_fields&product_id=X       — сохранить поля формы (полная замена)
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400',
            },
            'body': '',
        }

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    conn = get_conn()
    conn.autocommit = True

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            # ══ CATEGORIES ═══════════════════════════════════════════════════════

            if method == 'GET' and action == 'categories':
                cur.execute(f'''
                    SELECT * FROM {SCHEMA}.shop_categories
                    ORDER BY sort_order, id
                ''')
                cats = [dict(r) for r in cur.fetchall()]
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'categories': cats}, default=json_serial)}

            if method == 'POST' and action == 'category_create':
                body = json.loads(event.get('body') or '{}')
                name = body.get('name', '').strip()
                if not name:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'name required'})}
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.shop_categories (name, sort_order)
                    VALUES (%s, %s) RETURNING *
                ''', (name, body.get('sort_order', 0)))
                cat = dict(cur.fetchone())
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'category': cat}, default=json_serial)}

            if method == 'PUT' and action == 'category_update':
                cid = params.get('id')
                body = json.loads(event.get('body') or '{}')
                if not cid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                sets, vals = [], []
                if 'name' in body:
                    sets.append('name = %s'); vals.append(body['name'])
                if 'sort_order' in body:
                    sets.append('sort_order = %s'); vals.append(body['sort_order'])
                if not sets:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'nothing to update'})}
                vals.append(cid)
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_categories SET {', '.join(sets)}
                    WHERE id = %s RETURNING *
                ''', vals)
                cat = cur.fetchone()
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'category': dict(cat) if cat else None}, default=json_serial)}

            # Удаление категории — обнуляем category_id у товаров, удаляем запись
            if method == 'PUT' and action == 'category_delete':
                cid = params.get('id')
                if not cid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_products SET category_id = NULL WHERE category_id = %s
                ''', (cid,))
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_categories SET name = '__deleted__' WHERE id = %s
                ''', (cid,))
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'ok': True})}

            # ══ PRODUCTS ═════════════════════════════════════════════════════════

            if method == 'GET' and action == 'list':
                category_id = params.get('category_id')
                if category_id:
                    cur.execute(f'''
                        SELECT p.*, sc.name AS category_name
                        FROM {SCHEMA}.shop_products p
                        LEFT JOIN {SCHEMA}.shop_categories sc ON sc.id = p.category_id
                        WHERE p.category_id = %s
                          AND p.name NOT IN ('__hidden__', '__deleted__')
                        ORDER BY p.sort_order, p.id
                    ''', (category_id,))
                else:
                    cur.execute(f'''
                        SELECT p.*, sc.name AS category_name
                        FROM {SCHEMA}.shop_products p
                        LEFT JOIN {SCHEMA}.shop_categories sc ON sc.id = p.category_id
                        WHERE p.name NOT IN ('__hidden__', '__deleted__')
                        ORDER BY p.sort_order, p.id
                    ''')
                rows = [dict(r) for r in cur.fetchall()]
                for r in rows:
                    r['price'] = float(r['price'])
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'products': rows}, default=json_serial)}

            if method == 'GET' and action == 'product':
                pid = params.get('id')
                if not pid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                cur.execute(f'''
                    SELECT p.*, sc.name AS category_name
                    FROM {SCHEMA}.shop_products p
                    LEFT JOIN {SCHEMA}.shop_categories sc ON sc.id = p.category_id
                    WHERE p.id = %s
                ''', (pid,))
                row = cur.fetchone()
                if not row:
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'not found'})}
                product = dict(row)
                product['price'] = float(product['price'])
                cur.execute(f'''
                    SELECT * FROM {SCHEMA}.shop_form_fields
                    WHERE product_id = %s ORDER BY sort_order, id
                ''', (pid,))
                fields = [dict(f) for f in cur.fetchall()]
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'product': product, 'fields': fields}, default=json_serial)}

            if method == 'POST' and action == 'create':
                body = json.loads(event.get('body') or '{}')
                name = body.get('name', '').strip()
                if not name:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'name required'})}
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.shop_products
                      (contest_id, category_id, name, description, price, photo_url, payment_url, is_active, sort_order)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
                    RETURNING *
                ''', (
                    0,
                    body.get('category_id') or None,
                    name,
                    body.get('description', ''),
                    float(body.get('price', 0)),
                    body.get('photo_url', ''),
                    body.get('payment_url', ''),
                    body.get('is_active', True),
                    body.get('sort_order', 0),
                ))
                product = dict(cur.fetchone())
                product['price'] = float(product['price'])
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'product': product}, default=json_serial)}

            if method == 'PUT' and action == 'update':
                pid = params.get('id')
                body = json.loads(event.get('body') or '{}')
                if not pid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                fields_map = ['name', 'description', 'price', 'photo_url', 'payment_url',
                              'is_active', 'sort_order', 'category_id']
                sets, vals = [], []
                for f in fields_map:
                    if f in body:
                        sets.append(f'{f} = %s')
                        if f == 'price':
                            vals.append(float(body[f]))
                        elif f == 'category_id':
                            vals.append(body[f] or None)
                        else:
                            vals.append(body[f])
                if not sets:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'nothing to update'})}
                vals.append(pid)
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_products SET {', '.join(sets)}
                    WHERE id = %s RETURNING *
                ''', vals)
                product = dict(cur.fetchone())
                product['price'] = float(product['price'])
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'product': product}, default=json_serial)}

            if method == 'POST' and action == 'upload_photo':
                pid = params.get('id')
                body = json.loads(event.get('body') or '{}')
                file_b64 = body.get('file_base64', '')
                file_name = body.get('file_name', 'photo.jpg')
                if not pid or not file_b64:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id and file_base64 required'})}
                file_data = base64.b64decode(file_b64)
                ext = file_name.rsplit('.', 1)[-1].lower() if '.' in file_name else 'jpg'
                key = f'shop/{pid}/photo.{ext}'
                s3 = boto3.client(
                    's3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
                )
                content_type = f'image/{ext}' if ext != 'jpg' else 'image/jpeg'
                s3.put_object(Bucket='files', Key=key, Body=file_data, ContentType=content_type)
                photo_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
                cur.execute(f'UPDATE {SCHEMA}.shop_products SET photo_url = %s WHERE id = %s',
                            (photo_url, pid))
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'photo_url': photo_url})}

            # ══ FORM FIELDS ═══════════════════════════════════════════════════════

            if method == 'GET' and action == 'fields':
                pid = params.get('product_id')
                if not pid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'product_id required'})}
                cur.execute(f'''
                    SELECT * FROM {SCHEMA}.shop_form_fields
                    WHERE product_id = %s ORDER BY sort_order, id
                ''', (pid,))
                fields = [dict(f) for f in cur.fetchall()]
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'fields': fields}, default=json_serial)}

            if method == 'POST' and action == 'save_fields':
                pid = params.get('product_id')
                body = json.loads(event.get('body') or '{}')
                fields = body.get('fields', [])
                if not pid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'product_id required'})}
                cur.execute(f'SELECT id FROM {SCHEMA}.shop_products WHERE id = %s', (pid,))
                if not cur.fetchone():
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'product not found'})}
                cur.execute(f'SELECT id FROM {SCHEMA}.shop_form_fields WHERE product_id = %s', (pid,))
                existing_ids = {r['id'] for r in cur.fetchall()}
                new_ids = {f['id'] for f in fields if f.get('id')}
                to_remove = existing_ids - new_ids
                for rid in to_remove:
                    cur.execute(f'UPDATE {SCHEMA}.shop_form_fields SET field_name=%s WHERE id=%s',
                                ('__deleted__', rid))
                saved = []
                for i, f in enumerate(fields):
                    fid = f.get('id')
                    label = f.get('field_label', '')
                    fname = f.get('field_name', label.lower().replace(' ', '_'))
                    ftype = f.get('field_type', 'text')
                    req = f.get('is_required', False)
                    if fid and fid in existing_ids:
                        cur.execute(f'''
                            UPDATE {SCHEMA}.shop_form_fields
                            SET field_name=%s, field_label=%s, field_type=%s, is_required=%s, sort_order=%s
                            WHERE id=%s RETURNING *
                        ''', (fname, label, ftype, req, i, fid))
                    else:
                        cur.execute(f'''
                            INSERT INTO {SCHEMA}.shop_form_fields
                              (product_id, field_name, field_label, field_type, is_required, sort_order)
                            VALUES (%s,%s,%s,%s,%s,%s) RETURNING *
                        ''', (pid, fname, label, ftype, req, i))
                    saved.append(dict(cur.fetchone()))
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'fields': saved}, default=json_serial)}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}

    finally:
        conn.close()