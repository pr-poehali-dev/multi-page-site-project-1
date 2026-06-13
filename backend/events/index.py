import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление мероприятиями афиши
    GET / - список мероприятий
    POST / - создать мероприятие
    PUT / - обновить мероприятие
    DELETE /?id=X - удалить мероприятие
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

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True

    try:
        if method == 'GET':
            return get_events(conn, event)
        elif method == 'POST':
            return create_event(conn, event)
        elif method == 'PUT':
            return update_event(conn, event)
        elif method == 'DELETE':
            return delete_event(conn, event)
        else:
            return _resp(405, {'error': 'Метод не поддерживается'})
    finally:
        conn.close()


def _resp(status: int, data: dict) -> dict:
    return {
        'statusCode': status,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(data, ensure_ascii=False, default=str),
        'isBase64Encoded': False
    }


def get_events(conn, event: dict) -> dict:
    '''Получить список мероприятий группы'''
    params = event.get('queryStringParameters') or {}
    only_published = params.get('published', 'true') == 'true'
    group_id = params.get('group_id')

    if not group_id:
        return _resp(400, {'error': 'group_id обязателен'})

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if only_published:
            cur.execute('''
                SELECT id, title, description, event_date, deadline, location, poster_url, ticket_url, page_url, is_published, created_at
                FROM events
                WHERE is_published = true AND group_id = %s
                ORDER BY event_date ASC
            ''', (group_id,))
        else:
            cur.execute('''
                SELECT id, title, description, event_date, deadline, location, poster_url, ticket_url, page_url, is_published, created_at
                FROM events
                WHERE group_id = %s
                ORDER BY event_date ASC
            ''', (group_id,))
        rows = cur.fetchall()
    return _resp(200, {'events': rows, 'total': len(rows)})


def create_event(conn, event: dict) -> dict:
    '''Создать мероприятие'''
    body = json.loads(event.get('body', '{}'))

    title = body.get('title', '').strip()
    if not title:
        return _resp(400, {'error': 'Название обязательно'})

    event_date = body.get('event_date')
    if not event_date:
        return _resp(400, {'error': 'Дата обязательна'})

    group_id = body.get('group_id')
    if not group_id:
        return _resp(400, {'error': 'group_id обязателен'})

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            INSERT INTO events (title, description, event_date, deadline, location, poster_url, ticket_url, page_url, is_published, group_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (
            title,
            body.get('description', ''),
            event_date,
            body.get('deadline') or None,
            body.get('location', ''),
            body.get('poster_url'),
            body.get('ticket_url'),
            body.get('page_url'),
            body.get('is_published', True),
            group_id
        ))
        result = cur.fetchone()
    return _resp(201, {'success': True, 'id': result['id']})


def update_event(conn, event: dict) -> dict:
    '''Обновить мероприятие'''
    body = json.loads(event.get('body', '{}'))
    event_id = body.get('id')
    if not event_id:
        return _resp(400, {'error': 'ID обязателен'})

    group_id = body.get('group_id')
    if not group_id:
        return _resp(400, {'error': 'group_id обязателен'})

    fields = ['title', 'description', 'event_date', 'deadline', 'location', 'poster_url', 'ticket_url', 'page_url', 'is_published']
    updates = []
    values = []
    for f in fields:
        if f in body:
            updates.append(f'{f} = %s')
            values.append(body[f])

    if not updates:
        return _resp(400, {'error': 'Нет данных для обновления'})

    updates.append('updated_at = NOW()')
    values.extend([event_id, group_id])

    with conn.cursor() as cur:
        cur.execute(f"UPDATE events SET {', '.join(updates)} WHERE id = %s AND group_id = %s", values)

    return _resp(200, {'success': True})


def delete_event(conn, event: dict) -> dict:
    '''Удалить мероприятие'''
    params = event.get('queryStringParameters') or {}
    event_id = params.get('id')
    if not event_id:
        return _resp(400, {'error': 'ID обязателен'})

    group_id = params.get('group_id')
    if not group_id:
        return _resp(400, {'error': 'group_id обязателен'})

    with conn.cursor() as cur:
        cur.execute('DELETE FROM events WHERE id = %s AND group_id = %s', (event_id, group_id))

    return _resp(200, {'success': True})