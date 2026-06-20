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
    Управление товарами интернет-магазина и полями форм заявок.
    GET  /?action=list&contest_id=X          — список товаров конкурса
    GET  /?action=product&id=X               — товар + поля формы
    POST /?action=create                     — создать товар (+ фото base64)
    PUT  /?action=update&id=X                — обновить товар
    POST /?action=upload_photo&id=X          — загрузить фото товара
    GET  /?action=fields&product_id=X        — поля формы товара
    POST /?action=save_fields&product_id=X   — сохранить поля формы (полная замена)
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
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

            # ── LIST products by contest ──────────────────────────────────────
            if method == 'GET' and action == 'list':
                contest_id = params.get('contest_id')
                if not contest_id:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'contest_id required'})}
                cur.execute(f'''
                    SELECT p.*, c.title AS contest_title
                    FROM {SCHEMA}.shop_products p
                    JOIN {SCHEMA}.contests c ON c.id = p.contest_id
                    WHERE p.contest_id = %s
                    ORDER BY p.sort_order, p.id
                ''', (contest_id,))
                rows = [dict(r) for r in cur.fetchall()]
                for r in rows:
                    r['price'] = float(r['price'])
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'products': rows}, default=json_serial)}

            # ── GET single product + fields ────────────────────────────────────
            if method == 'GET' and action == 'product':
                pid = params.get('id')
                if not pid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                cur.execute(f'''
                    SELECT p.*, c.title AS contest_title
                    FROM {SCHEMA}.shop_products p
                    JOIN {SCHEMA}.contests c ON c.id = p.contest_id
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

            # ── CREATE product ────────────────────────────────────────────────
            if method == 'POST' and action == 'create':
                body = json.loads(event.get('body') or '{}')
                contest_id = body.get('contest_id')
                name = body.get('name', '').strip()
                if not contest_id or not name:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'contest_id and name required'})}
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.shop_products
                      (contest_id, name, description, price, photo_url, payment_url, is_active, sort_order)
                    VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
                    RETURNING *
                ''', (
                    contest_id, name,
                    body.get('description', ''),
                    float(body.get('price', 0)),
                    body.get('photo_url', ''),
                    body.get('payment_url', ''),
                    body.get('is_active', True),
                    body.get('sort_order', 0),
                ))
                product = dict(cur.fetchone())
                product['price'] = float(product['price'])
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'product': product}, default=json_serial)}

            # ── UPDATE product ────────────────────────────────────────────────
            if method == 'PUT' and action == 'update':
                pid = params.get('id')
                body = json.loads(event.get('body') or '{}')
                if not pid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                fields_map = ['name', 'description', 'price', 'photo_url', 'payment_url',
                              'is_active', 'sort_order']
                sets, vals = [], []
                for f in fields_map:
                    if f in body:
                        sets.append(f'{f} = %s')
                        vals.append(float(body[f]) if f == 'price' else body[f])
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
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'product': product}, default=json_serial)}

            # ── UPLOAD photo ──────────────────────────────────────────────────
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
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_products SET photo_url = %s WHERE id = %s
                ''', (photo_url, pid))
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'photo_url': photo_url})}

            # ── GET form fields ───────────────────────────────────────────────
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
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'fields': fields}, default=json_serial)}

            # ── SAVE form fields (full replace) ───────────────────────────────
            if method == 'POST' and action == 'save_fields':
                pid = params.get('product_id')
                body = json.loads(event.get('body') or '{}')
                fields = body.get('fields', [])
                if not pid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'product_id required'})}
                # delete old and insert new (safer than cascade delete, since no FK constraint violation risk)
                cur.execute(f'SELECT id FROM {SCHEMA}.shop_products WHERE id = %s', (pid,))
                if not cur.fetchone():
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'product not found'})}
                # mark removed by keeping only new ids
                cur.execute(
                    f'SELECT id FROM {SCHEMA}.shop_form_fields WHERE product_id = %s', (pid,))
                existing_ids = {r['id'] for r in cur.fetchall()}
                new_ids = {f['id'] for f in fields if f.get('id')}
                to_remove = existing_ids - new_ids
                if to_remove:
                    cur.execute(
                        f'UPDATE {SCHEMA}.shop_form_fields SET product_id = NULL WHERE id = ANY(%s)',
                        (list(to_remove),))
                    cur.execute(
                        f'UPDATE {SCHEMA}.shop_form_fields SET product_id = %s WHERE id = ANY(%s) AND FALSE',
                        (pid, list(to_remove)))
                    # actual removal via update trick not possible without DELETE; insert fresh
                    for rid in to_remove:
                        cur.execute(
                            f'UPDATE {SCHEMA}.shop_form_fields SET field_name=%s WHERE id=%s',
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
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'fields': saved}, default=json_serial)}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}

    finally:
        conn.close()