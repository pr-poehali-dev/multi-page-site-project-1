import json
import os
import re
import secrets
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, Optional
import hashlib
import requests

VK_LINK_REGEX = re.compile(r'^https?://(www\.)?(vk\.com|vk\.ru|vkontakte\.ru)/[a-zA-Z0-9_.]{2,}$')
VK_API_URL = 'https://api.vk.com/method'
VK_VERSION = '5.199'


def is_valid_vk_link(value: str) -> bool:
    '''Проверяет корректность формата ссылки на профиль ВК'''
    return bool(value) and bool(VK_LINK_REGEX.match(value.strip()))


def extract_vk_screen_name(vk_link: str) -> Optional[str]:
    '''Извлекает screen_name из ссылки на профиль ВК'''
    match = re.search(r'(?:vk\.com|vk\.ru|vkontakte\.ru)/([a-zA-Z0-9_.]+)', vk_link or '')
    if not match:
        return None
    return match.group(1).split('?')[0].split('&')[0]


def check_vk_link_is_user(vk_link: str) -> Optional[str]:
    '''
    Проверяет через VK API, что ссылка ведёт на личный профиль пользователя, а не на группу/сообщество.
    Возвращает None если всё ок, иначе — текст ошибки для пользователя.
    Если токен не настроен или VK API недоступен — проверка пропускается (не блокирует регистрацию).
    '''
    token = os.environ.get('VK_USER_TOKEN')
    if not token:
        return None
    screen_name = extract_vk_screen_name(vk_link)
    if not screen_name:
        return None
    try:
        resp = requests.get(
            f'{VK_API_URL}/utils.resolveScreenName',
            params={'screen_name': screen_name, 'access_token': token, 'v': VK_VERSION},
            timeout=6,
        )
        data = resp.json().get('response')
    except Exception:
        return None
    if not data:
        return 'Не удалось найти такую страницу ВК. Проверьте правильность ссылки'
    obj_type = data.get('type')
    if obj_type == 'group':
        return 'Это ссылка на группу/сообщество ВК. Укажите ссылку на вашу личную страницу'
    if obj_type != 'user':
        return 'Ссылка должна вести на личную страницу ВК, а не на другой объект'
    return None


def hash_password(password: str) -> str:
    '''Хеширование пароля SHA-256'''
    return hashlib.sha256(password.encode()).hexdigest()


def vk_oauth_exchange_code(code: str, redirect_uri: str, code_verifier: str, device_id: str) -> Optional[Dict[str, Any]]:
    '''
    Обменивает код авторизации на access_token через актуальный протокол VK ID (OAuth 2.1 + PKCE).
    Старый oauth.vk.com/access_token отключён VK с осени 2025 года, .com-домены VK ID тоже
    больше не отвечают — с 30.09.2025 VK перевёл все домены OAuth/API на зону .ru.
    '''
    app_id = os.environ.get('VK_APP_ID')
    app_secret = os.environ.get('VK_APP_SECRET')
    if not app_id or not code_verifier:
        return None
    try:
        payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'code_verifier': code_verifier,
            'client_id': app_id,
            'redirect_uri': redirect_uri,
            'device_id': device_id,
            'state': '',
        }
        if app_secret:
            payload['client_secret'] = app_secret
        resp = requests.post(
            'https://id.vk.ru/oauth2/auth',
            data=payload,
            timeout=8,
        )
        data = resp.json()
    except Exception:
        return None
    if 'error' in data or 'access_token' not in data:
        return None
    return data


def vk_get_user_info(access_token: str) -> Optional[Dict[str, Any]]:
    '''Получает данные пользователя VK ID по access_token (актуальный эндпоинт id.vk.ru)'''
    app_id = os.environ.get('VK_APP_ID')
    try:
        resp = requests.post(
            'https://id.vk.ru/oauth2/user_info',
            data={'access_token': access_token, 'client_id': app_id},
            timeout=8,
        )
        data = resp.json()
    except Exception:
        return None
    return data.get('user')


def vk_get_screen_name(vk_user_id: int) -> Optional[str]:
    '''
    Получает короткое имя страницы (screen_name) участника по его числовому VK ID через
    открытый метод users.get с сервисным токеном сообщества. Нужно, чтобы сопоставить
    вход через VK с уже сохранённой в анкете ссылкой на профиль (vk_link), даже если VK
    не вернул email при авторизации.
    '''
    token = os.environ.get('VK_USER_TOKEN') or os.environ.get('VK_APP_SERVICE_TOKEN') or os.environ.get('VK_SERVICE_TOKEN')
    if not token or not vk_user_id:
        return None
    try:
        resp = requests.get(
            f'{VK_API_URL}/users.get',
            params={'user_ids': vk_user_id, 'fields': 'screen_name', 'access_token': token, 'v': VK_VERSION},
            timeout=6,
        )
        items = resp.json().get('response')
    except Exception:
        return None
    if not items:
        return None
    return items[0].get('screen_name')


def find_participant_by_vk_link(cur, vk_user_id: int, screen_name: Optional[str]) -> Optional[Dict[str, Any]]:
    '''Ищет участника по совпадению с ранее указанной в анкете ссылкой на VK-профиль (numeric id или screen_name)'''
    patterns = [rf'(vk\.com|vk\.ru|vkontakte\.ru)/id{vk_user_id}($|[/?])']
    if screen_name:
        patterns.append(rf'(vk\.com|vk\.ru|vkontakte\.ru)/{re.escape(screen_name)}($|[/?])')
    cur.execute(
        f'''
        SELECT id FROM {SCHEMA}.participants
        WHERE vk_link ~* %s OR vk_link ~* %s
        LIMIT 1
        ''',
        (patterns[0], patterns[1] if len(patterns) > 1 else 'a^')
    )
    return cur.fetchone()


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
    PUT ?action=update_vk_link&id=X - обновить ссылку ВК участника (body: {vk_link}) (требует X-Api-Key)
    GET ?email=xxx - получить заявки по email (legacy)
    POST ?action=vk_login - вход/регистрация через VK ID OAuth 2.1+PKCE (body: {code, redirect_uri, code_verifier, device_id})
    POST ?action=complete_profile - дозаполнение профиля после VK-входа (требует Authorization: Bearer <session_token>, body: {phone, city, contactPosition})
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
            body_data = json.loads(event.get('body', '{}'))
            action = params.get('action') or body_data.get('action')

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
                if not is_valid_vk_link(vk_link):
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Введите корректную ссылку на профиль ВК, например: https://vk.com/username'}), 'isBase64Encoded': False}
                vk_check_error = check_vk_link_is_user(vk_link)
                if vk_check_error:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': vk_check_error}), 'isBase64Encoded': False}
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

            # Вход/регистрация через VK ID (OAuth 2.1 + PKCE)
            if action == 'vk_login':
                code = (body_data.get('code') or '').strip()
                redirect_uri = (body_data.get('redirect_uri') or '').strip()
                code_verifier = (body_data.get('code_verifier') or '').strip()
                device_id = (body_data.get('device_id') or '').strip()
                if not code or not redirect_uri or not code_verifier:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'code, redirect_uri и code_verifier обязательны'}), 'isBase64Encoded': False}

                token_data = vk_oauth_exchange_code(code, redirect_uri, code_verifier, device_id)
                if not token_data:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Не удалось авторизоваться через ВК. Попробуйте ещё раз.'}), 'isBase64Encoded': False}

                vk_user_id = token_data.get('user_id')
                vk_email = (token_data.get('email') or '').strip().lower()
                access_token = token_data.get('access_token')

                user_info = vk_get_user_info(access_token) or {}
                full_name = f"{user_info.get('first_name', '')} {user_info.get('last_name', '')}".strip() or 'Участник ВК'
                vk_link = f"https://vk.com/id{vk_user_id}"
                screen_name = vk_get_screen_name(vk_user_id)

                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # 1. Ищем по vk_user_id (уже входили через ВК раньше)
                    cur.execute(f'SELECT id FROM {SCHEMA}.participants WHERE vk_user_id = %s', (vk_user_id,))
                    existing = cur.fetchone()

                    if not existing and vk_email:
                        # 2. Ищем по email, который VK мог вернуть (привязываем VK к существующему аккаунту)
                        cur.execute(f'SELECT id FROM {SCHEMA}.participants WHERE email = %s', (vk_email,))
                        existing = cur.fetchone()
                        if existing:
                            cur.execute(f'UPDATE {SCHEMA}.participants SET vk_user_id = %s WHERE id = %s', (vk_user_id, existing['id']))

                    if not existing:
                        # 3. Ищем по ссылке на VK-профиль, ранее указанной в анкете (у большинства
                        # уже заполнена при регистрации) — сопоставляем по numeric id или screen_name
                        existing = find_participant_by_vk_link(cur, vk_user_id, screen_name)
                        if existing:
                            cur.execute(f'UPDATE {SCHEMA}.participants SET vk_user_id = %s WHERE id = %s', (vk_user_id, existing['id']))

                    if existing:
                        participant_id = existing['id']
                    else:
                        # 4. Новый участник — создаём с минимумом данных, profile_complete=false
                        fallback_email = vk_email or f'vk{vk_user_id}@vk.placeholder'
                        cur.execute(
                            f'''
                            INSERT INTO {SCHEMA}.participants (full_name, email, phone, city, vk_link, vk_user_id, profile_complete)
                            VALUES (%s, %s, '', '', %s, %s, FALSE)
                            RETURNING id
                            ''',
                            (full_name, fallback_email, vk_link, vk_user_id)
                        )
                        participant_id = cur.fetchone()['id']

                    cur.execute(
                        f'''
                        SELECT id, full_name, contact_position, email, phone, vk_link, city, profile_complete
                        FROM {SCHEMA}.participants WHERE id = %s
                        ''',
                        (participant_id,)
                    )
                    participant = dict(cur.fetchone())

                    cur.execute(
                        f'''
                        SELECT a.id, a.contest_id, a.category, a.performance_title, a.participation_format,
                               a.nomination, a.status, a.submitted_at,
                               c.title as contest_title, c.start_date, c.end_date
                        FROM {SCHEMA}.applications a
                        JOIN {SCHEMA}.contests c ON a.contest_id = c.id
                        WHERE a.participant_id = %s
                        ORDER BY a.submitted_at DESC
                        ''',
                        (participant_id,)
                    )
                    applications = [dict(r) for r in cur.fetchall()]
                    for app in applications:
                        if app.get('submitted_at'): app['submitted_at'] = app['submitted_at'].isoformat()
                        if app.get('start_date'): app['start_date'] = app['start_date'].isoformat()
                        if app.get('end_date'): app['end_date'] = app['end_date'].isoformat()

                token = create_session_token(conn, participant_id)
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'participant': participant, 'applications': applications, 'token': token}), 'isBase64Encoded': False}

            # Дозаполнение профиля после первого входа через VK
            if action == 'complete_profile':
                pid = get_participant_id_by_session(conn, event)
                if not pid:
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
                phone = (body_data.get('phone') or '').strip()
                city = (body_data.get('city') or '').strip()
                contact_position = (body_data.get('contactPosition') or '').strip()
                if not phone or not city or not contact_position:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Заполните все поля'}), 'isBase64Encoded': False}
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute(
                        f'''
                        UPDATE {SCHEMA}.participants
                        SET phone = %s, city = %s, contact_position = %s, profile_complete = TRUE
                        WHERE id = %s
                        RETURNING id, full_name, contact_position, email, phone, vk_link, city, profile_complete
                        ''',
                        (phone, city, contact_position, pid)
                    )
                    participant = dict(cur.fetchone())
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'participant': participant}), 'isBase64Encoded': False}

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
                    # Полное удаление аккаунта: стираем все личные данные и доступ к нему без возможности
                    # восстановления (email, пароль, телефон, город, ВК-профиль, вход через ВК), а также
                    # удаляем личные данные, не относящиеся к истории конкурса (сессии входа, переписку в чате).
                    # Заявки на конкурс и результаты жюри НЕ удаляются — они должны сохраняться в истории конкурса.
                    cur.execute(f'DELETE FROM {SCHEMA}.participant_sessions WHERE participant_id = %s', (pid,))
                    cur.execute(f'DELETE FROM {SCHEMA}.chat_messages WHERE participant_id = %s', (pid,))
                    cur.execute(
                        f'''UPDATE {SCHEMA}.participants
                            SET email = %s, phone = '', password_hash = NULL, full_name = '[удалён]',
                                vk_user_id = NULL, vk_link = NULL, city = '', contact_position = '',
                                push_token = NULL, reset_code = NULL, reset_code_expires_at = NULL
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
            elif action == 'update_vk_link':
                if not check_admin_key(event):
                    return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется X-Api-Key'}), 'isBase64Encoded': False}
                pid = params.get('id')
                if not pid:
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Укажите id'}), 'isBase64Encoded': False}
                body_data = json.loads(event.get('body') or '{}')
                vk_link = (body_data.get('vk_link') or '').strip()
                if vk_link and not is_valid_vk_link(vk_link):
                    return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Введите корректную ссылку на профиль ВК, например: https://vk.com/username'}), 'isBase64Encoded': False}
                with conn.cursor() as cur:
                    cur.execute(f'UPDATE {SCHEMA}.participants SET vk_link = %s WHERE id = %s', (vk_link, pid))
                    if cur.rowcount == 0:
                        return {'statusCode': 404, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Участник не найден'}), 'isBase64Encoded': False}
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'vk_link': vk_link}), 'isBase64Encoded': False}
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

            # Публичная выдача VK App ID для кнопки "Войти через ВК" на фронте
            if action == 'vk_config':
                app_id = os.environ.get('VK_APP_ID', '')
                return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'vk_app_id': app_id}), 'isBase64Encoded': False}

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