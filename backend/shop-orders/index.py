import json
import os
import hashlib
import tempfile
import psycopg2
import requests
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, date

# Т-Банк использует цепочку сертификатов Минцифры РФ (Russian Trusted Root/Sub CA),
# которая отсутствует в стандартном системном хранилище доверенных сертификатов.
# Без этого bundle все запросы к securepay.tinkoff.ru падают с SSLCertVerificationError.
RUSSIAN_TRUSTED_ROOT_CA = """-----BEGIN CERTIFICATE-----
MIIFwjCCA6qgAwIBAgICEAAwDQYJKoZIhvcNAQELBQAwcDELMAkGA1UEBhMCUlUx
PzA9BgNVBAoMNlRoZSBNaW5pc3RyeSBvZiBEaWdpdGFsIERldmVsb3BtZW50IGFu
ZCBDb21tdW5pY2F0aW9uczEgMB4GA1UEAwwXUnVzc2lhbiBUcnVzdGVkIFJvb3Qg
Q0EwHhcNMjIwMzAxMjEwNDE1WhcNMzIwMjI3MjEwNDE1WjBwMQswCQYDVQQGEwJS
VTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwgRGV2ZWxvcG1lbnQg
YW5kIENvbW11bmljYXRpb25zMSAwHgYDVQQDDBdSdXNzaWFuIFRydXN0ZWQgUm9v
dCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAMfFOZ8pUAL3+r2n
qqE0Zp52selXsKGFYoG0GM5bwz1bSFtCt+AZQMhkWQheI3poZAToYJu69pHLKS6Q
XBiwBC1cvzYmUYKMYZC7jE5YhEU2bSL0mX7NaMxMDmH2/NwuOVRj8OImVa5s1F4U
zn4Kv3PFlDBjjSjXKVY9kmjUBsXQrIHeaqmUIsPIlNWUnimXS0I0abExqkbdrXbX
YwCOXhOO2pDUx3ckmJlCMUGacUTnylyQW2VsJIyIGA8V0xzdaeUXg0VZ6ZmNUr5Y
Ber/EAOLPb8NYpsAhJe2mXjMB/J9HNsoFMBFJ0lLOT/+dQvjbdRZoOT8eqJpWnVD
U+QL/qEZnz57N88OWM3rabJkRNdU/Z7x5SFIM9FrqtN8xewsiBWBI0K6XFuOBOTD
4V08o4TzJ8+Ccq5XlCUW2L48pZNCYuBDfBh7FxkB7qDgGDiaftEkZZfApRg2E+M9
G8wkNKTPLDc4wH0FDTijhgxR3Y4PiS1HL2Zhw7bD3CbslmEGgfnnZojNkJtcLeBH
BLa52/dSwNU4WWLubaYSiAmA9IUMX1/RpfpxOxd4Ykmhz97oFbUaDJFipIggx5sX
ePAlkTdWnv+RWBxlJwMQ25oEHmRguNYf4Zr/Rxr9cS93Y+mdXIZaBEE0KS2iLRqa
OiWBki9IMQU4phqPOBAaG7A+eP8PAgMBAAGjZjBkMB0GA1UdDgQWBBTh0YHlzlpf
BKrS6badZrHF+qwshzAfBgNVHSMEGDAWgBTh0YHlzlpfBKrS6badZrHF+qwshzAS
BgNVHRMBAf8ECDAGAQH/AgEEMA4GA1UdDwEB/wQEAwIBhjANBgkqhkiG9w0BAQsF
AAOCAgEAALIY1wkilt/urfEVM5vKzr6utOeDWCUczmWX/RX4ljpRdgF+5fAIS4vH
tmXkqpSCOVeWUrJV9QvZn6L227ZwuE15cWi8DCDal3Ue90WgAJJZMfTshN4OI8cq
W9E4EG9wglbEtMnObHlms8F3CHmrw3k6KmUkWGoa+/ENmcVl68u/cMRl1JbW2bM+
/3A+SAg2c6iPDlehczKx2oa95QW0SkPPWGuNA/CE8CpyANIhu9XFrj3RQ3EqeRcS
AQQod1RNuHpfETLU/A2gMmvn/w/sx7TB3W5BPs6rprOA37tutPq9u6FTZOcG1Oqj
C/B7yTqgI7rbyvox7DEXoX7rIiEqyNNUguTk/u3SZ4VXE2kmxdmSh3TQvybfbnXV
4JbCZVaqiZraqc7oZMnRoWrXRG3ztbnbes/9qhRGI7PqXqeKJBztxRTEVj8ONs1d
WN5szTwaPIvhkhO3CO5ErU2rVdUr89wKpNXbBODFKRtgxUT70YpmJ46VVaqdAhOZ
D9EUUn4YaeLaS8AjSF/h7UkjOibNc4qVDiPP+rkehFWM66PVnP1Msh93tc+taIfC
EYVMxjh8zNbFuoc7fzvvrFILLe7ifvEIUqSVIC/AzplM/Jxw7buXFeGP1qVCBEHq
391d/9RAfaZ12zkwFsl+IKwE/OZxW8AHa9i1p4GO0YSNuczzEm4=
-----END CERTIFICATE-----"""

RUSSIAN_TRUSTED_SUB_CA = """-----BEGIN CERTIFICATE-----
MIIHQjCCBSqgAwIBAgICEAIwDQYJKoZIhvcNAQELBQAwcDELMAkGA1UEBhMCUlUx
PzA9BgNVBAoMNlRoZSBNaW5pc3RyeSBvZiBEaWdpdGFsIERldmVsb3BtZW50IGFu
ZCBDb21tdW5pY2F0aW9uczEgMB4GA1UEAwwXUnVzc2lhbiBUcnVzdGVkIFJvb3Qg
Q0EwHhcNMjIwMzAyMTEyNTE5WhcNMjcwMzA2MTEyNTE5WjBvMQswCQYDVQQGEwJS
VTE/MD0GA1UECgw2VGhlIE1pbmlzdHJ5IG9mIERpZ2l0YWwgRGV2ZWxvcG1lbnQg
YW5kIENvbW11bmljYXRpb25zMR8wHQYDVQQDDBZSdXNzaWFuIFRydXN0ZWQgU3Vi
IENBMIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA9YPqBKOk19NFymrE
wehzrhBEgT2atLezpduB24mQ7CiOa/HVpFCDRZzdxqlh8drku408/tTmWzlNH/br
HuQhZ/miWKOf35lpKzjyBd6TPM23uAfJvEOQ2/dnKGGJbsUo1/udKSvxQwVHpVv3
S80OlluKfhWPDEXQpgyFqIzPoxIQTLZ0deirZwMVHarZ5u8HqHetRuAtmO2ZDGQn
vVOJYAjls+Hiueq7Lj7Oce7CQsTwVZeP+XQx28PAaEZ3y6sQEt6rL06ddpSdoTMp
BnCqTbxW+eWMyjkIn6t9GBtUV45yB1EkHNnj2Ex4GwCiN9T84QQjKSr+8f0psGrZ
vPbCbQAwNFJjisLixnjlGPLKa5vOmNwIh/LAyUW5DjpkCx004LPDuqPpFsKXNKpa
L2Dm6uc0x4Jo5m+gUTVORB6hOSzWnWDj2GWfomLzzyjG81DRGFBpco/O93zecsIN
3SL2Ysjpq1zdoS01CMYxie//9zWvYwzI25/OZigtnpCIrcd2j1Y6dMUFQAzAtHE+
qsXflSL8HIS+IJEFIQobLlYhHkoE3avgNx5jlu+OLYe0dF0Ykx1PGNjbwqvTX37R
Cn32NMjlotW2QcGEZhDKj+3urZizp5xdTPZitA+aEjZM/Ni71VOdiOP0igbw6asZ
2fxdozZ1TnSSYNYvNATwthNmZysCAwEAAaOCAeUwggHhMBIGA1UdEwEB/wQIMAYB
Af8CAQAwDgYDVR0PAQH/BAQDAgGGMB0GA1UdDgQWBBTR4XENCy2BTm6KSo9MI7NM
XqtpCzAfBgNVHSMEGDAWgBTh0YHlzlpfBKrS6badZrHF+qwshzCBxwYIKwYBBQUH
AQEEgbowgbcwOwYIKwYBBQUHMAKGL2h0dHA6Ly9yb3N0ZWxlY29tLnJ1L2NkcC9y
b290Y2Ffc3NsX3JzYTIwMjIuY3J0MDsGCCsGAQUFBzAChi9odHRwOi8vY29tcGFu
eS5ydC5ydS9jZHAvcm9vdGNhX3NzbF9yc2EyMDIyLmNydDA7BggrBgEFBQcwAoYv
aHR0cDovL3JlZXN0ci1wa2kucnUvY2RwL3Jvb3RjYV9zc2xfcnNhMjAyMi5jcnQw
gbAGA1UdHwSBqDCBpTA1oDOgMYYvaHR0cDovL3Jvc3RlbGVjb20ucnUvY2RwL3Jv
b3RjYV9zc2xfcnNhMjAyMi5jcmwwNaAzoDGGL2h0dHA6Ly9jb21wYW55LnJ0LnJ1
L2NkcC9yb290Y2Ffc3NsX3JzYTIwMjIuY3JsMDWgM6Axhi9odHRwOi8vcmVlc3Ry
LXBraS5ydS9jZHAvcm9vdGNhX3NzbF9yc2EyMDIyLmNybDANBgkqhkiG9w0BAQsF
AAOCAgEARBVzZls79AdiSCpar15dA5Hr/rrT4WbrOfzlpI+xrLeRPrUG6eUWIW4v
Sui1yx3iqGLCjPcKb+HOTwoRMbI6ytP/ndp3TlYua2advYBEhSvjs+4vDZNwXr/D
anbwIWdurZmViQRBDFebpkvnIvru/RpWud/5r624Wp8voZMRtj/cm6aI9LtvBfT9
cfzhOaexI/99c14dyiuk1+6QhdwKaCRTc1mdfNQmnfWNRbfWhWBlK3h4GGE9JK33
Gk8ZS8DMrkdAh0xby4xAQ/mSWAfWrBmfzlOqGyoB1U47WTOeqNbWkkoAP2ys94+s
Jg4NTkiDVtXRF6nr6fYi0bSOvOFg0IQrMXO2Y8gyg9ARdPJwKtvWX8VPADCYMiWH
h4n8bZokIrImVKLDQKHY4jCsND2HHdJfnrdL2YJw1qFskNO4cSNmZydw0Wkgjv9k
F+KxqrDKlB8MZu2Hclph6v/CZ0fQ9YuE8/lsHZ0Qc2HyiSMnvjgK5fDc3TD4fa8F
E8gMNurM+kV8PT8LNIM+4Zs+LKEV8nqRWBaxkIVJGekkVKO8xDBOG/aN62AZKHOe
GcyIdu7yNMMRihGVZCYr8rYiJoKiOzDqOkPkLOPdhtVlgnhowzHDxMHND/E2WA5p
ZHuNM/m0TXt2wTTPL7JH2YC0gPz/BvvSzjksgzU5rLbRyUKQkgU=
-----END CERTIFICATE-----"""

_ca_bundle_path = None


def get_ca_bundle_path() -> str:
    """Записывает bundle доверенных сертификатов Минцифры РФ во временный файл (один раз за инстанс)"""
    global _ca_bundle_path
    if _ca_bundle_path and os.path.exists(_ca_bundle_path):
        return _ca_bundle_path
    fd, path = tempfile.mkstemp(suffix='.pem')
    with os.fdopen(fd, 'w') as f:
        f.write(RUSSIAN_TRUSTED_ROOT_CA + '\n' + RUSSIAN_TRUSTED_SUB_CA + '\n')
    _ca_bundle_path = path
    return path


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
        timeout=15,
        verify=get_ca_bundle_path()
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

                # Т-Банк не разрешает повторно инициализировать платёж с тем же OrderId —
                # добавляем суффикс с меткой времени, реальный order_id остаётся до дефиса
                tbank_order_ref = f"{order_id}-{int(datetime.now().timestamp())}"

                tbank_resp = tbank_request(terminal_key, password, 'Init', {
                    'Amount': amount_kopecks,
                    'OrderId': tbank_order_ref,
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
                # OrderId может содержать суффикс метки времени при повторной оплате (repay) — берём часть до дефиса
                real_order_id = our_order_id.split('-')[0] if our_order_id else ''

                if cb_status == 'CONFIRMED' and real_order_id:
                    cur.execute(f'''
                        UPDATE {SCHEMA}.shop_orders SET status = 'paid'
                        WHERE id = %s AND status != 'paid'
                    ''', (real_order_id,))
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