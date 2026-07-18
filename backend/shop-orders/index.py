import json
import os
import hashlib
import psycopg2
import requests
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


def tbank_token(params: dict, password: str) -> str:
    """Генерация подписи для T-Bank API (SHA-256 по отсортированным значениям)"""
    items = sorted({**params, 'Password': password}.items())
    concat = ''.join(str(v) for _, v in items)
    return hashlib.sha256(concat.encode('utf-8')).hexdigest()


def tbank_request(terminal_key: str, password: str, method: str, params: dict) -> dict:
    payload = {'TerminalKey': terminal_key, **params}
    payload['Token'] = tbank_token(payload, password)
    resp = requests.post(
        f'https://securepay.tinkoff.ru/v2/{method}',
        json=payload,
        timeout=15
    )
    return resp.json()


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Заказы интернет-магазина + интеграция с Т-Банком.
    POST /?action=pay      — создать заказ и получить ссылку оплаты Т-Банка { product_id, form_data, return_url }
    POST /?action=repay    — повторно оплатить существующий неоплаченный заказ { order_id, return_url }
    POST /?action=callback — webhook от Т-Банка (авто-пометка заказа оплаченным)
    GET  /?action=check&order_id=X — проверить статус оплаты заказа у банка
    POST /                 — создать заказ без оплаты { product_id, form_data }
    GET  /?contest_id=X    — список заказов по конкурсу (для админки)
    GET  /?product_id=X    — список заказов по товару
    GET  /?email=X         — список заказов покупателя по email (личный кабинет)
    PUT  /?id=X            — обновить статус { status }
    PUT  /?action=remove&id=X — скрыть заказ
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

    terminal_key = os.environ.get('TBANK_TERMINAL_KEY', '')
    password = os.environ.get('TBANK_PASSWORD', '')

    conn = get_conn()
    conn.autocommit = False

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            # ── Создать заказ + зарегистрировать в Т-Банке ───────────────────
            if method == 'POST' and action == 'pay':
                body = json.loads(event.get('body') or '{}')
                product_id = body.get('product_id')
                form_data = body.get('form_data', {})
                return_url = body.get('return_url', '')

                if not product_id:
                    conn.rollback()
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'product_id required'})}

                cur.execute(f'''
                    SELECT id, name, price FROM {SCHEMA}.shop_products
                    WHERE id = %s AND is_active = TRUE
                ''', (product_id,))
                product = cur.fetchone()
                if not product:
                    conn.rollback()
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'Product not found'})}

                cur.execute(f'''
                    INSERT INTO {SCHEMA}.shop_orders (product_id, form_data, status)
                    VALUES (%s, %s, 'pending') RETURNING id
                ''', (product_id, json.dumps(form_data)))
                order_id = cur.fetchone()['id']

                amount_kopecks = int(float(product['price']) * 100)
                host = (event.get('headers') or {}).get('host', '')
                base = f'https://{host}' if host else ''
                base_return = return_url or f'{base}/shop/success'
                success_url = f'{base_return}?order_id={order_id}'

                tbank_resp = tbank_request(terminal_key, password, 'Init', {
                    'Amount': amount_kopecks,
                    'OrderId': str(order_id),
                    'Description': product['name'][:250],
                    'SuccessURL': success_url,
                    'FailURL': success_url.replace('success', 'fail'),
                    'Language': 'ru',
                })
                print(f"[TBANK] Init response: {tbank_resp}")

                if not tbank_resp.get('Success'):
                    conn.rollback()
                    return {'statusCode': 502, 'headers': CORS,
                            'body': json.dumps({
                                'error': tbank_resp.get('Message', 'Ошибка банка'),
                                'details': tbank_resp.get('Details', '')
                            })}

                tbank_order_id = tbank_resp.get('PaymentId', '')
                payment_url = tbank_resp.get('PaymentURL', '')

                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_orders
                    SET alfa_order_id = %s, payment_url = %s
                    WHERE id = %s
                ''', (str(tbank_order_id), payment_url, order_id))
                conn.commit()

                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'order_id': order_id, 'payment_url': payment_url})}

            # ── Повторная оплата существующего заказа ─────────────────────────
            if method == 'POST' and action == 'repay':
                body = json.loads(event.get('body') or '{}')
                order_id = body.get('order_id')
                return_url = body.get('return_url', '')

                if not order_id:
                    conn.rollback()
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'order_id required'})}

                cur.execute(f'''
                    SELECT o.id, o.status, o.product_id, p.name, p.price
                    FROM {SCHEMA}.shop_orders o
                    JOIN {SCHEMA}.shop_products p ON p.id = o.product_id
                    WHERE o.id = %s
                ''', (order_id,))
                order = cur.fetchone()
                if not order:
                    conn.rollback()
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'Order not found'})}

                if order['status'] in ('paid', 'completed'):
                    conn.rollback()
                    return {'statusCode': 200, 'headers': CORS,
                            'body': json.dumps({'status': 'paid', 'order_id': int(order['id'])})}

                amount_kopecks = int(float(order['price']) * 100)
                host = (event.get('headers') or {}).get('host', '')
                base = f'https://{host}' if host else ''
                base_return = return_url or f'{base}/shop/success'
                success_url = f'{base_return}?order_id={order_id}'

                tbank_resp = tbank_request(terminal_key, password, 'Init', {
                    'Amount': amount_kopecks,
                    'OrderId': str(order_id),
                    'Description': order['name'][:250],
                    'SuccessURL': success_url,
                    'FailURL': success_url.replace('success', 'fail'),
                    'Language': 'ru',
                })
                print(f"[TBANK] Repay Init response: {tbank_resp}")

                if not tbank_resp.get('Success'):
                    conn.rollback()
                    return {'statusCode': 502, 'headers': CORS,
                            'body': json.dumps({
                                'error': tbank_resp.get('Message', 'Ошибка банка'),
                                'details': tbank_resp.get('Details', '')
                            })}

                tbank_order_id = tbank_resp.get('PaymentId', '')
                payment_url = tbank_resp.get('PaymentURL', '')

                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_orders
                    SET alfa_order_id = %s, payment_url = %s, status = 'pending'
                    WHERE id = %s
                ''', (str(tbank_order_id), payment_url, order_id))
                conn.commit()

                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'order_id': int(order_id), 'payment_url': payment_url})}

            # ── Webhook от Т-Банка ────────────────────────────────────────────
            if method == 'POST' and action == 'callback':
                raw_body = event.get('body') or ''
                try:
                    body = json.loads(raw_body)
                except Exception:
                    body = {}

                print(f"[TBANK] callback: {body}")

                cb_status = body.get('Status', '')
                our_order_id = body.get('OrderId', '')

                if cb_status == 'CONFIRMED' and our_order_id:
                    cur.execute(f'''
                        UPDATE {SCHEMA}.shop_orders SET status = 'paid'
                        WHERE id = %s AND status != 'paid'
                    ''', (our_order_id,))
                    conn.commit()

                return {'statusCode': 200, 'headers': CORS, 'body': 'OK'}

            # ── Проверка статуса у банка (вызывается фронтендом после редиректа) ─
            if method == 'GET' and action == 'check':
                order_id = params.get('order_id')
                if not order_id:
                    conn.rollback()
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'order_id required'})}

                cur.execute(f'''
                    SELECT id, status, alfa_order_id FROM {SCHEMA}.shop_orders WHERE id = %s
                ''', (order_id,))
                order = cur.fetchone()
                if not order:
                    conn.rollback()
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'not found'})}

                if order['status'] == 'paid':
                    conn.rollback()
                    return {'statusCode': 200, 'headers': CORS,
                            'body': json.dumps({'status': 'paid', 'order_id': int(order['id'])})}

                if order['alfa_order_id']:
                    tbank_resp = tbank_request(terminal_key, password, 'GetState', {
                        'PaymentId': order['alfa_order_id'],
                    })
                    print(f"[TBANK] GetState response: {tbank_resp}")
                    tbank_status = tbank_resp.get('Status', '')
                    if tbank_status == 'CONFIRMED':
                        cur.execute(f'''
                            UPDATE {SCHEMA}.shop_orders SET status = 'paid' WHERE id = %s
                        ''', (order_id,))
                        conn.commit()
                        return {'statusCode': 200, 'headers': CORS,
                                'body': json.dumps({'status': 'paid', 'order_id': int(order_id)})}

                conn.rollback()
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'status': order['status'], 'order_id': int(order_id)})}

            # ── CREATE order (без оплаты) ─────────────────────────────────────
            if method == 'POST':
                body = json.loads(event.get('body') or '{}')
                product_id = body.get('product_id')
                form_data = body.get('form_data', {})
                if not product_id:
                    conn.rollback()
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'product_id required'})}
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.shop_orders (product_id, form_data, status)
                    VALUES (%s, %s, 'new') RETURNING *
                ''', (product_id, json.dumps(form_data)))
                order = dict(cur.fetchone())
                order['form_data'] = dict(order['form_data']) if order['form_data'] else {}
                conn.commit()
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'order': order}, default=json_serial)}

            # ── LIST orders ───────────────────────────────────────────────────
            if method == 'GET':
                conn.rollback()
                contest_id = params.get('contest_id')
                product_id = params.get('product_id')
                email = params.get('email')
                if email:
                    cur.execute(f'''
                        SELECT o.*, p.name AS product_name, p.price,
                               c.title AS contest_title
                        FROM {SCHEMA}.shop_orders o
                        JOIN {SCHEMA}.shop_products p ON p.id = o.product_id
                        LEFT JOIN {SCHEMA}.contests c ON c.id = p.contest_id
                        WHERE o.status != '__hidden__'
                          AND lower(o.form_data->>'Адрес электронной почты') = lower(%s)
                        ORDER BY o.created_at DESC
                    ''', (email,))
                    rows = []
                    for r in cur.fetchall():
                        row = dict(r)
                        row['price'] = float(row['price'])
                        row['form_data'] = dict(row['form_data']) if row['form_data'] else {}
                        rows.append(row)
                    return {'statusCode': 200, 'headers': CORS,
                            'body': json.dumps({'orders': rows}, default=json_serial)}
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
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'orders': rows}, default=json_serial)}

            # ── REMOVE order ──────────────────────────────────────────────────
            if method == 'PUT' and action == 'remove':
                oid = params.get('id')
                if not oid:
                    conn.rollback()
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id required'})}
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_orders SET status = '__hidden__' WHERE id = %s
                ''', (oid,))
                conn.commit()
                return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

            # ── UPDATE order status ───────────────────────────────────────────
            if method == 'PUT':
                oid = params.get('id')
                body = json.loads(event.get('body') or '{}')
                status = body.get('status', '')
                if not oid or not status:
                    conn.rollback()
                    return {'statusCode': 400, 'headers': CORS,
                            'body': json.dumps({'error': 'id and status required'})}
                cur.execute(f'''
                    UPDATE {SCHEMA}.shop_orders SET status = %s WHERE id = %s RETURNING *
                ''', (status, oid))
                order = cur.fetchone()
                if not order:
                    conn.rollback()
                    return {'statusCode': 404, 'headers': CORS,
                            'body': json.dumps({'error': 'not found'})}
                conn.commit()
                return {'statusCode': 200, 'headers': CORS,
                        'body': json.dumps({'order': dict(order)}, default=json_serial)}

        conn.rollback()
        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}

    except Exception as e:
        conn.rollback()
        return {'statusCode': 500, 'headers': CORS, 'body': json.dumps({'error': str(e)})}
    finally:
        conn.close()