import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

SCHEMA = 't_p73771717_multi_page_site_proj'


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление программой конкурса и системой оценивания
    GET /?contest_id=X - получить программу и правила оценивания конкурса
    POST / - создать/обновить строку программы
    PUT / - обновить строку программы
    DELETE / - удалить строку программы
    POST /scoring - сохранить систему оценивания конкурса
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

    path = event.get('path', '/')
    is_scoring = path.endswith('/scoring')

    try:
        if method == 'GET':
            return get_program(conn, event)
        elif method == 'POST' and is_scoring:
            return save_scoring(conn, event)
        elif method == 'POST':
            return create_row(conn, event)
        elif method == 'PUT':
            return update_row(conn, event)
        elif method == 'DELETE':
            return delete_row(conn, event)
        else:
            return {'statusCode': 405, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Метод не поддерживается'}), 'isBase64Encoded': False}
    finally:
        conn.close()


def get_program(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Получение программы и правил оценивания конкурса'''
    params = event.get('queryStringParameters') or {}
    contest_id = params.get('contest_id')

    if not contest_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'contest_id обязателен'}), 'isBase64Encoded': False}

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT id, order_number, region, directing_party, participant_name, age, nomination, piece_title, duration
            FROM {SCHEMA}.contest_program
            WHERE contest_id = %s
            ORDER BY order_number
        ''', (contest_id,))
        rows = list(cur.fetchall())

        cur.execute(f'''
            SELECT grand_prix_min, laureate_1_min, laureate_2_min, laureate_3_min
            FROM {SCHEMA}.contest_scoring_rules
            WHERE contest_id = %s
        ''', (contest_id,))
        scoring = cur.fetchone()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'rows': rows, 'scoring': dict(scoring) if scoring else None}),
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

        cur.execute(f'''
            INSERT INTO {SCHEMA}.contest_program
              (contest_id, order_number, region, directing_party, participant_name, age, nomination, piece_title, duration)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, order_number, region, directing_party, participant_name, age, nomination, piece_title, duration
        ''', (
            contest_id,
            order_number,
            body.get('region', ''),
            body.get('directing_party', ''),
            body.get('participant_name', ''),
            body.get('age', ''),
            body.get('nomination', ''),
            body.get('piece_title', ''),
            body.get('duration', '')
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

    fields = ['order_number', 'region', 'directing_party', 'participant_name', 'age', 'nomination', 'piece_title', 'duration']
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
    '''Сохранение системы оценивания конкурса (upsert)'''
    body = json.loads(event.get('body', '{}'))
    contest_id = body.get('contest_id')
    if not contest_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'contest_id обязателен'}), 'isBase64Encoded': False}

    grand_prix_min = body.get('grand_prix_min', 95)
    laureate_1_min = body.get('laureate_1_min', 85)
    laureate_2_min = body.get('laureate_2_min', 75)
    laureate_3_min = body.get('laureate_3_min', 65)

    with conn.cursor() as cur:
        cur.execute(f'''
            INSERT INTO {SCHEMA}.contest_scoring_rules (contest_id, grand_prix_min, laureate_1_min, laureate_2_min, laureate_3_min)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (contest_id) DO UPDATE SET
              grand_prix_min = EXCLUDED.grand_prix_min,
              laureate_1_min = EXCLUDED.laureate_1_min,
              laureate_2_min = EXCLUDED.laureate_2_min,
              laureate_3_min = EXCLUDED.laureate_3_min,
              updated_at = NOW()
        ''', (contest_id, grand_prix_min, laureate_1_min, laureate_2_min, laureate_3_min))

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True}),
        'isBase64Encoded': False
    }
