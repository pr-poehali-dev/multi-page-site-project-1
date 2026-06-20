import json
import os
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
    Заказы интернет-магазина.
    POST /         — создать заказ { product_id, form_data: {} }
    GET  /?contest_id=X  — список заказов по конкурсу (для админки)
    GET  /?product_id=X  — список заказов по товару
    PUT  /?id=X          — обновить статус { status }
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
    CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    conn = get_conn()
    conn.autocommit = True

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            # ── CREATE order ──────────────────────────────────────────────────
            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                product_id = body.get('product_id')
                form_data = body.get('form_data', {})
                if not product_id:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'product_id required'})}
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.shop_orders (product_id, form_data, status)
                    VALUES (%s, %s, 'new') RETURNING *
                ''', (product_id, json.dumps(form_data)))
                order = dict(cur.fetchone())
                order['form_data'] = dict(order['form_data']) if order['form_data'] else {}
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'order': order}, default=json_serial)}

            # ── LIST orders ───────────────────────────────────────────────────
            if method == 'GET':
                contest_id = params.get('contest_id')
                product_id = params.get('product_id')
                if contest_id:
                    cur.execute(f'''
                        SELECT o.*, p.name AS product_name, p.price,
                               c.title AS contest_title
                        FROM {SCHEMA}.shop_orders o
                        JOIN {SCHEMA}.shop_products p ON p.id = o.product_id
                        JOIN {SCHEMA}.contests c ON c.id = p.contest_id
                        WHERE p.contest_id = %s AND o.status != '__hidden__'
                        ORDER BY o.created_at DESC
                    ''', (contest_id,))
                elif product_id:
                    cur.execute(f'''
                        SELECT o.*, p.name AS product_name, p.price
                        FROM {SCHEMA}.shop_orders o
                        JOIN {SCHEMA}.shop_products p ON p.id = o.product_id
                        WHERE o.product_id = %s AND o.status != '__hidden__'
                        ORDER BY o.created_at DESC
                    ''', (product_id,))
                else:
                    cur.execute(f'''
                        SELECT o.*, p.name AS product_name, p.price
                        FROM {SCHEMA}.shop_orders o
                        JOIN {SCHEMA}.shop_products p ON p.id = o.product_id
                        WHERE o.status != '__hidden__'
                        ORDER BY o.created_at DESC
                        LIMIT 500
                    ''')
                rows = []
                for r in cur.fetchall():
                    row = dict(r)
                    row['price'] = float(row['price'])
                    row['form_data'] = dict(row['form_data']) if row['form_data'] else {}
                    rows.append(row)
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'orders': rows}, default=json_serial)}

            # ── REMOVE order ──────────────────────────────────────────────────
            if method == 'PUT' and params.get('action') == 'remove':
                oid = params.get('id')
                if not oid:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_orders SET status = '__hidden__' WHERE id = %s
                ''', (oid,))
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

            # ── UPDATE order status ───────────────────────────────────────────
            if method == 'PUT':
                oid = params.get('id')
                body = json.loads(event.get('body') or '{}')
                status = body.get('status', '')
                if not oid or not status:
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id and status required'})}
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_orders SET status = %s WHERE id = %s RETURNING *
                ''', (status, oid))
                order = cur.fetchone()
                if not order:
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'not found'})}
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'order': dict(order)}, default=json_serial)}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}

    finally:
        conn.close()