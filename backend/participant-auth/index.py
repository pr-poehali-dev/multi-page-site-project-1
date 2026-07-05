import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import hashlib


def hash_password(password: str) -> str:
    '''Хеширование пароля SHA-256'''
    return hashlib.sha256(password.encode()).hexdigest()


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p73771717_multi_page_site_proj')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Авторизация участников и управление ими.
    POST - авторизация (email+password)
    GET ?action=list - список всех участников (для админа)
    GET ?action=chat&participant_id=X - чат с участником
    POST ?action=send - отправить сообщение (body: {participant_id, message, sender})
    PUT ?action=read&participant_id=X - пометить прочитанными
    PUT ?action=delete&id=X - удалить участника
    GET ?email=xxx - получить заявки по email (legacy)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    try:
        if method == 'POST':
            params = event.get('queryStringParameters') or {}
            action = params.get('action')
            body_data = json.loads(event.get('body', '{}'))

            # Отправка сообщения в чат
            if action == 'send':
                pid = body_data.get('participant_id')
                message = (body_data.get('message') or '').strip()
                sender = body_data.get('sender', 'admin')
                if not pid or not message:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите participant_id и message'}), 'isBase64Encoded': False}
                if sender not in ('admin', 'user'):
                    sender = 'admin'
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f"INSERT INTO {SCHEMA}.chat_messages (participant_id, sender, message) VALUES (%s, %s, %s) RETURNING id, participant_id, sender, message, created_at, is_read", (pid, sender, message))
                    msg = dict(cur.fetchone())
                    if msg.get('created_at'): msg['created_at'] = msg['created_at'].isoformat()
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'message': msg}), 'isBase64Encoded': False}

            email = body_data.get('email')
            password = body_data.get('password')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email и пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    '''
                    SELECT 
                        p.id,
                        p.full_name,
                        p.email,
                        p.phone,
                        p.birth_date,
                        p.city,
                        p.password_hash
                    FROM participants p
                    WHERE p.email = %s
                    ''',
                    (email,)
                )
                participant = cur.fetchone()
                
                if not participant:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }
                
                if not participant['password_hash']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'error': 'Пароль не установлен',
                            'message': 'Для входа в личный кабинет необходимо подать новую заявку с установкой пароля'
                        }),
                        'isBase64Encoded': False
                    }
                
                if participant['password_hash'] != password_hash:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверный email или пароль'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    '''
                    SELECT 
                        a.id,
                        a.contest_id,
                        a.category,
                        a.performance_title,
                        a.participation_format,
                        a.nomination,
                        a.experience,
                        a.achievements,
                        a.additional_info,
                        a.status,
                        a.submitted_at,
                        c.title as contest_title,
                        c.start_date,
                        c.end_date,
                        c.status as contest_status
                    FROM applications a
                    JOIN contests c ON a.contest_id = c.id
                    WHERE a.participant_id = %s
                    ORDER BY a.submitted_at DESC
                    ''',
                    (participant['id'],)
                )
                applications = cur.fetchall()
                
                for app in applications:
                    if app.get('submitted_at'):
                        app['submitted_at'] = app['submitted_at'].isoformat()
                    if app.get('start_date'):
                        app['start_date'] = app['start_date'].isoformat()
                    if app.get('end_date'):
                        app['end_date'] = app['end_date'].isoformat()
                
                participant_data = dict(participant)
                del participant_data['password_hash']
                
                if participant_data.get('birth_date'):
                    participant_data['birth_date'] = participant_data['birth_date'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'participant': participant_data,
                        'applications': applications
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            params = event.get('queryStringParameters') or {}
            action = params.get('action')
            if action == 'delete':
                pid = params.get('id')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите id'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(f'UPDATE {SCHEMA}.participants SET email = NULL, phone = NULL, password_hash = NULL, full_name = \'[удалён]\' WHERE id = %s', (pid,))
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}
            elif action == 'read':
                pid = params.get('participant_id')
                reader = params.get('reader', 'admin')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите participant_id'}), 'isBase64Encoded': False}
                sender_to_mark = 'user' if reader == 'admin' else 'admin'
                with conn.cursor() as cur:
                    cur.execute(f"UPDATE {SCHEMA}.chat_messages SET is_read = TRUE WHERE participant_id = %s AND sender = %s", (pid, sender_to_mark))
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}
            return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неизвестное действие'}), 'isBase64Encoded': False}

        elif method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action')

            # Список участников для администратора
            if action == 'list':
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'''
                        SELECT p.id, p.full_name, p.email, p.phone, p.city, p.created_at,
                               COUNT(DISTINCT a.id) AS applications_count,
                               COUNT(DISTINCT cm.id) FILTER (WHERE cm.sender = 'user' AND cm.is_read = FALSE) AS unread_count
                        FROM {SCHEMA}.participants p
                        LEFT JOIN {SCHEMA}.applications a ON a.participant_id = p.id
                        LEFT JOIN {SCHEMA}.chat_messages cm ON cm.participant_id = p.id
                        GROUP BY p.id ORDER BY p.created_at DESC
                    ''')
                    rows = cur.fetchall()
                    for r in rows:
                        if r.get('created_at'): r['created_at'] = r['created_at'].isoformat()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'participants': [dict(r) for r in rows]}), 'isBase64Encoded': False}

            # Количество непрочитанных сообщений от организаторов для участника
            elif action == 'unread':
                pid = params.get('participant_id')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите participant_id'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.chat_messages WHERE participant_id = %s AND sender = 'admin' AND is_read = FALSE", (pid,))
                    count = cur.fetchone()[0]
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'unread_count': count}), 'isBase64Encoded': False}

            # Чат с участником
            elif action == 'chat':
                pid = params.get('participant_id')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите participant_id'}), 'isBase64Encoded': False}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'SELECT id, participant_id, sender, message, created_at, is_read FROM {SCHEMA}.chat_messages WHERE participant_id = %s ORDER BY created_at ASC', (pid,))
                    rows = cur.fetchall()
                    for r in rows:
                        if r.get('created_at'): r['created_at'] = r['created_at'].isoformat()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'messages': [dict(r) for r in rows]}), 'isBase64Encoded': False}

            # Отправить сообщение (через GET action=send для простоты — но лучше POST)
            email = params.get('email')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    '''
                    SELECT 
                        p.id,
                        p.full_name,
                        p.email,
                        p.phone,
                        p.birth_date,
                        p.city
                    FROM participants p
                    WHERE p.email = %s
                    ''',
                    (email,)
                )
                participant = cur.fetchone()
                
                if not participant:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Участник не найден'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    '''
                    SELECT 
                        a.id,
                        a.contest_id,
                        a.category,
                        a.performance_title,
                        a.participation_format,
                        a.nomination,
                        a.experience,
                        a.achievements,
                        a.additional_info,
                        a.status,
                        a.submitted_at,
                        c.title as contest_title,
                        c.start_date,
                        c.end_date,
                        c.status as contest_status
                    FROM applications a
                    JOIN contests c ON a.contest_id = c.id
                    WHERE a.participant_id = %s
                    ORDER BY a.submitted_at DESC
                    ''',
                    (participant['id'],)
                )
                applications = cur.fetchall()
                
                for app in applications:
                    if app.get('submitted_at'):
                        app['submitted_at'] = app['submitted_at'].isoformat()
                    if app.get('start_date'):
                        app['start_date'] = app['start_date'].isoformat()
                    if app.get('end_date'):
                        app['end_date'] = app['end_date'].isoformat()
                
                if participant.get('birth_date'):
                    participant['birth_date'] = participant['birth_date'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'participant': participant,
                        'applications': applications
                    }),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Метод не поддерживается'}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()