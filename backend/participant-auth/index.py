import json
import os
import secrets
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import hashlib


def hash_password(password: str) -> str:
    '''Хеширование пароля SHA-256'''
    return hashlib.sha256(password.encode()).hexdigest()


def check_admin_key(event: Dict[str, Any]) -> bool:
    '''Проверка ключа доступа для админских операций (X-Api-Key)'''
    expected = os.environ.get('ADMIN_API_KEY')
    if not expected:
        return True
    headers = event.get('headers') or {}
    token = headers.get('X-Api-Key') or headers.get('x-api-key')
    return token == expected


def create_session_token(conn, participant_id: int) -> str:
    '''Создаёт сессионный токен участника со сроком действия 30 дней'''
    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(days=30)
    with conn.cursor() as cur:
        cur.execute(
            f'INSERT INTO {SCHEMA}.participant_sessions (participant_id, session_token, expires_at) VALUES (%s, %s, %s)',
            (participant_id, token, expires_at)
        )
    return token


def get_participant_id_by_session(conn, event: Dict[str, Any]) -> int:
    '''Определяет participant_id по сессионному токену из заголовка Authorization/X-Authorization: Bearer <token>'''
    headers = event.get('headers') or {}
    auth_header = headers.get('X-Authorization') or headers.get('x-authorization') or headers.get('Authorization') or headers.get('authorization') or ''
    token = auth_header.replace('Bearer ', '').strip()
    if not token:
        return 0
    with conn.cursor() as cur:
        cur.execute(
            f'SELECT participant_id FROM {SCHEMA}.participant_sessions WHERE session_token = %s AND expires_at > NOW()',
            (token,)
        )
        row = cur.fetchone()
    return row[0] if row else 0


SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p73771717_multi_page_site_proj')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Авторизация участников и управление ими.
    POST - авторизация (email+password)
    GET ?action=list - список всех участников (для админа, требует X-Api-Key)
    GET ?action=chat&participant_id=X - чат с участником
    POST ?action=send - отправить сообщение (body: {participant_id, message, sender})
    POST ?action=save_push_token - сохранить Expo push-токен участника (требует Authorization: Bearer <session_token>)
    GET ?action=list_push_tokens - список всех push-токенов для рассылки (требует X-Api-Key)
    GET ?action=notifications - история push-уведомлений участника (требует Authorization: Bearer <session_token>)
    PUT ?action=mark_notification_read&id=X - пометить уведомление прочитанным (требует Authorization: Bearer <session_token>)
    PUT ?action=read&participant_id=X - пометить прочитанными
    PUT ?action=delete&id=X - удалить участника (требует X-Api-Key)
    GET ?email=xxx - получить заявки по email (legacy)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key, Authorization, X-Authorization',
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

            # Регистрация нового аккаунта участника (без подачи заявки на конкурс)
            if action == 'register':
                full_name = (body_data.get('fullName') or '').strip()
                contact_position = (body_data.get('contactPosition') or '').strip()
                email = (body_data.get('email') or '').strip().lower()
                phone = (body_data.get('phone') or '').strip()
                vk_link = (body_data.get('vkLink') or '').strip()
                city = (body_data.get('city') or '').strip()
                password = body_data.get('password') or ''

                if not full_name or not contact_position or not email or not phone or not vk_link or not city or not password:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Заполните все поля'}), 'isBase64Encoded': False}
                if len(password) < 6:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Пароль должен содержать минимум 6 символов'}), 'isBase64Encoded': False}

                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'SELECT id, password_hash FROM {SCHEMA}.participants WHERE email = %s', (email,))
                    existing = cur.fetchone()
                    if existing and existing.get('password_hash'):
                        return {'statusCode': 409, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Аккаунт с таким email уже существует. Войдите в личный кабинет.'}), 'isBase64Encoded': False}

                    password_hash = hash_password(password)

                    cur.execute(
                        f'''
                        INSERT INTO {SCHEMA}.participants (full_name, contact_position, email, phone, vk_link, city, password_hash)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        ON CONFLICT (email)
                        DO UPDATE SET full_name = EXCLUDED.full_name, contact_position = EXCLUDED.contact_position, phone = EXCLUDED.phone, vk_link = EXCLUDED.vk_link, city = EXCLUDED.city, password_hash = EXCLUDED.password_hash
                        RETURNING id, full_name, contact_position, email, phone, vk_link, city
                        ''',
                        (full_name, contact_position, email, phone, vk_link, city, password_hash)
                    )
                    participant = dict(cur.fetchone())

                token = create_session_token(conn, participant['id'])
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'participant': participant, 'applications': [], 'token': token}), 'isBase64Encoded': False}

            # Сохранение Expo push-токена участника (мобильное приложение)
            if action == 'save_push_token':
                pid = get_participant_id_by_session(conn, event)
                if not pid:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
                push_token = (body_data.get('pushToken') or '').strip()
                if not push_token:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите pushToken'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(f'UPDATE {SCHEMA}.participants SET push_token = %s WHERE id = %s', (push_token, pid))
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

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
                        p.contact_position,
                        p.email,
                        p.phone,
                        p.vk_link,
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
                        a.nomination_id,
                        a.experience,
                        a.achievements,
                        a.additional_info,
                        a.custom_fields,
                        a.status,
                        a.submitted_at,
                        a.editing_locked,
                        a.admin_comment,
                        c.title as contest_title,
                        c.start_date,
                        c.end_date,
                        c.status as contest_status,
                        c.applications_locked,
                        c.location,
                        c.event_date
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
                    app['is_editable'] = not app.get('editing_locked') and not app.get('applications_locked')
                
                participant_data = dict(participant)
                del participant_data['password_hash']

                token = create_session_token(conn, participant['id'])
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'participant': participant_data,
                        'applications': applications,
                        'token': token
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            params = event.get('queryStringParameters') or {}
            action = params.get('action')
            if action == 'delete':
                if not check_admin_key(event):
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется X-Api-Key'}), 'isBase64Encoded': False}
                pid = params.get('id')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите id'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(
                        f'''UPDATE {SCHEMA}.participants
                            SET email = %s, phone = '', password_hash = NULL, full_name = '[удалён]'
                            WHERE id = %s''',
                        (f'deleted_{pid}@deleted.local', pid)
                    )
                    if cur.rowcount == 0:
                        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Участник не найден'}), 'isBase64Encoded': False}
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
            elif action == 'mark_notification_read':
                pid = get_participant_id_by_session(conn, event)
                if not pid:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
                notification_id = params.get('id')
                if not notification_id:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите id'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(
                        f'INSERT INTO {SCHEMA}.notification_reads (notification_id, participant_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
                        (notification_id, pid)
                    )
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}
            return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неизвестное действие'}), 'isBase64Encoded': False}

        elif method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action')

            # Список участников для администратора
            if action == 'list':
                if not check_admin_key(event):
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется X-Api-Key'}), 'isBase64Encoded': False}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'''
                        SELECT p.id, p.full_name, p.contact_position, p.email, p.phone, p.vk_link, p.city, p.created_at,
                               COUNT(DISTINCT a.id) AS applications_count,
                               COUNT(DISTINCT cm.id) FILTER (WHERE cm.sender = 'user' AND cm.is_read = FALSE) AS unread_count
                        FROM {SCHEMA}.participants p
                        LEFT JOIN {SCHEMA}.applications a ON a.participant_id = p.id
                        LEFT JOIN {SCHEMA}.chat_messages cm ON cm.participant_id = p.id
                        WHERE p.full_name != '[удалён]'
                        GROUP BY p.id ORDER BY p.created_at DESC
                    ''')
                    rows = cur.fetchall()
                    for r in rows:
                        if r.get('created_at'): r['created_at'] = r['created_at'].isoformat()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'participants': [dict(r) for r in rows]}), 'isBase64Encoded': False}

            # Список всех push-токенов для рассылки уведомлений (требует X-Api-Key)
            elif action == 'list_push_tokens':
                if not check_admin_key(event):
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется X-Api-Key'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(f"SELECT push_token FROM {SCHEMA}.participants WHERE push_token IS NOT NULL AND push_token != ''")
                    tokens = [r[0] for r in cur.fetchall()]
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'tokens': tokens}), 'isBase64Encoded': False}

            # История push-уведомлений участника (общая рассылка + персональные по его заявкам)
            elif action == 'notifications':
                pid = get_participant_id_by_session(conn, event)
                if not pid:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'''
                        SELECT n.id, n.title, n.body, n.contest_id, n.created_at,
                               (nr.participant_id IS NOT NULL) AS is_read
                        FROM {SCHEMA}.notifications n
                        LEFT JOIN {SCHEMA}.notification_reads nr ON nr.notification_id = n.id AND nr.participant_id = %s
                        WHERE n.participant_id IS NULL OR n.participant_id = %s
                        ORDER BY n.created_at DESC
                        LIMIT 50
                    ''', (pid, pid))
                    rows = cur.fetchall()
                    for r in rows:
                        if r.get('created_at'): r['created_at'] = r['created_at'].isoformat()
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'notifications': [dict(r) for r in rows]}), 'isBase64Encoded': False}

            # Количество непрочитанных сообщений от организаторов для участника
            elif action == 'unread':
                pid = params.get('participant_id')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите participant_id'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.chat_messages WHERE participant_id = %s AND sender = 'admin' AND is_read = FALSE", (pid,))
                    count = cur.fetchone()[0]
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'unread_count': count}), 'isBase64Encoded': False}

            # Актуальный список заявок участника (обновление статусов блокировки редактирования)
            elif action == 'applications':
                pid = params.get('participant_id')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите participant_id'}), 'isBase64Encoded': False}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(f'''
                        SELECT
                            a.id,
                            a.contest_id,
                            a.category,
                            a.performance_title,
                            a.participation_format,
                            a.nomination,
                            a.nomination_id,
                            a.experience,
                            a.achievements,
                            a.additional_info,
                            a.custom_fields,
                            a.status,
                            a.submitted_at,
                            a.editing_locked,
                            a.admin_comment,
                            c.title as contest_title,
                            c.start_date,
                            c.end_date,
                            c.status as contest_status,
                            c.applications_locked,
                            c.location,
                            c.event_date
                        FROM {SCHEMA}.applications a
                        JOIN {SCHEMA}.contests c ON a.contest_id = c.id
                        WHERE a.participant_id = %s
                        ORDER BY a.submitted_at DESC
                    ''', (pid,))
                    applications = cur.fetchall()
                    for app in applications:
                        if app.get('submitted_at'): app['submitted_at'] = app['submitted_at'].isoformat()
                        if app.get('start_date'): app['start_date'] = app['start_date'].isoformat()
                        if app.get('end_date'): app['end_date'] = app['end_date'].isoformat()
                        app['is_editable'] = not app.get('editing_locked') and not app.get('applications_locked')
                    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'applications': [dict(a) for a in applications]}), 'isBase64Encoded': False}

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
                        a.nomination_id,
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