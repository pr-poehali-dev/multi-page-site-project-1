import json
import os
import random
import re
import string
import time
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List, Optional
import base64
import uuid
import boto3
import requests

SCHEMA = 't_p73771717_multi_page_site_proj'
CABINET_URL = 'https://индиго-арт.рф/participant-cabinet'
SUPPORT_EMAIL = 'indigo_fest@mail.ru'
EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
VK_API_URL = 'https://api.vk.com/method'
VK_VERSION = '5.199'
VK_CHUNK_SIZE = 12

STATUS_LABELS = {
    'approved': 'одобрена',
    'rejected': 'отклонена',
    'pending': 'возвращена на доработку',
}


def send_push_notification(push_token: str, title: str, body: str, data: dict = None) -> None:
    '''Отправляет push-уведомление через Expo Push Service одному пользователю'''
    if not push_token:
        return
    message = {'to': push_token, 'title': title, 'body': body}
    if data:
        message['data'] = data
    try:
        resp = requests.post(
            EXPO_PUSH_URL,
            headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
            json=message,
            timeout=10,
        )
        result = resp.json()
        ticket = result.get('data', {})
        if isinstance(ticket, dict) and ticket.get('status') == 'error':
            print(f"[PUSH ERROR] token={push_token} error={ticket.get('message')} details={ticket.get('details')}")
        else:
            print(f"[PUSH OK] token={push_token} response={result}")
    except Exception as e:
        print(f"[PUSH EXCEPTION] token={push_token} error={e}")


def send_status_update_email(to_email: str, full_name: str, contest_title: str, new_status: str, admin_comment: str = '') -> None:
    '''Отправляет участнику письмо об изменении статуса его заявки'''
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = os.environ.get('SMTP_PORT')
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not all([smtp_host, smtp_port, smtp_user, smtp_password, to_email]):
        return

    status_label = STATUS_LABELS.get(new_status, new_status)
    status_color = '#16a34a' if new_status == 'approved' else ('#dc2626' if new_status in ('rejected', 'pending') else '#6d28d9')

    comment_html = ''
    if admin_comment and new_status in ('rejected', 'pending'):
        comment_html = f"""
      <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 16px 0; border-radius: 4px;">
        <p style="margin: 0 0 4px 0; font-weight: bold; color: #991b1b;">Комментарий организатора:</p>
        <p style="margin: 0; white-space: pre-wrap;">{admin_comment}</p>
      </div>
        """

    msg = MIMEMultipart('alternative')
    msg['Subject'] = Header(f'Статус заявки на конкурс «{contest_title}» изменён — ИНДИГО', 'utf-8')
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #6d28d9;">Статус заявки обновлён</h2>
      <p>Здравствуйте, {full_name}!</p>
      <p>Статус вашей заявки на участие в конкурсе «<b>{contest_title}</b>» изменён:</p>
      <p style="font-size: 20px; font-weight: bold; color: {status_color};">Заявка {status_label}</p>
      {comment_html}
      <p>Подробности можно посмотреть в <a href="{CABINET_URL}" style="color:#6d28d9;">личном кабинете участника</a>.</p>
      <p style="color:#6b7280; font-size: 14px; margin-top: 24px;">
        Если у вас есть вопросы, напишите нам в чат поддержки личного кабинета
        или на почту <a href="mailto:{SUPPORT_EMAIL}" style="color:#6d28d9;">{SUPPORT_EMAIL}</a>.
      </p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    if int(smtp_port) == 465:
        with smtplib.SMTP_SSL(smtp_host, int(smtp_port)) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())


def generate_diploma_number(conn) -> str:
    '''Генерация уникального номера диплома: 2 случайные буквы + 6 цифр (сквозная нумерация)'''
    series = ''.join(random.choices(string.ascii_uppercase, k=2))
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(f'''
            SELECT COALESCE(MAX(CAST(SUBSTRING(diploma_number FROM 3) AS INTEGER)), 0) + 1 AS next_num
            FROM {SCHEMA}.contest_program
            WHERE diploma_number ~ '^[A-Z]{{2}}[0-9]{{6}}$'
        ''')
        next_num = cur.fetchone()['next_num']
    return f'{series}{str(next_num).zfill(6)}'


def check_api_key(event: Dict[str, Any]) -> bool:
    '''Проверка ключа доступа для админских операций (X-Api-Key)'''
    expected = os.environ.get('ADMIN_API_KEY')
    if not expected:
        return True
    headers = event.get('headers') or {}
    token = headers.get('X-Api-Key') or headers.get('x-api-key')
    return token == expected


def vk_parse_post_url(url: str) -> Optional[Dict[str, int]]:
    '''Извлекает owner_id и post_id из ссылки на пост ВК'''
    match = re.search(r'wall(-?\d+)_(\d+)', url)
    if not match:
        return None
    return {'owner_id': int(match.group(1)), 'post_id': int(match.group(2))}


def vk_extract_screen_name(vk_link: str) -> Optional[str]:
    '''Извлекает screen_name из ссылки на профиль ВК'''
    if not vk_link:
        return None
    vk_link = vk_link.strip()
    match = re.search(r'(?:vk\.com|vkontakte\.ru)/([a-zA-Z0-9_.]+)', vk_link)
    name = match.group(1) if match else vk_link.lstrip('@').strip('/')
    name = name.split('?')[0].split('&')[0]
    return name or None


def vk_call(method: str, params: Dict[str, Any], token: str) -> Dict[str, Any]:
    '''Вызов метода VK API'''
    payload = {**params, 'access_token': token, 'v': VK_VERSION}
    resp = requests.get(f'{VK_API_URL}/{method}', params=payload, timeout=8)
    return resp.json()


def vk_execute(code: str, token: str) -> Dict[str, Any]:
    '''Вызов VK API execute с VKScript-кодом'''
    resp = requests.post(
        f'{VK_API_URL}/execute',
        data={'code': code, 'access_token': token, 'v': VK_VERSION},
        timeout=8,
    )
    return resp.json()


def vk_build_check_code(screen_names: List[str], owner_id: int, post_id: int, group_id: int) -> str:
    '''Формирует VKScript для резолва профилей и проверки лайка/репоста/подписки на группу'''
    names_json = json.dumps(screen_names)
    return f'''
    var ids = {names_json};
    var owner_id = {owner_id};
    var item_id = {post_id};
    var group_id = {group_id};
    var result = [];
    var i = 0;
    while (i < ids.length) {{
      var sn = ids[i];
      var resolved = API.utils.resolveScreenName({{"screen_name": sn}});
      var uid = 0;
      if (resolved.type == "user") {{ uid = resolved.object_id; }}
      var liked = 0;
      var copied = 0;
      var member = 0;
      if (uid > 0) {{
        var lk = API.likes.isLiked({{"type":"post","owner_id":owner_id,"item_id":item_id,"user_id":uid}});
        liked = lk.liked;
        copied = lk.copied;
        member = API.groups.isMember({{"group_id":group_id,"user_id":uid}});
      }}
      result.push({{"screen_name": sn, "user_id": uid, "liked": liked, "copied": copied, "member": member}});
      i = i + 1;
    }}
    return result;
    '''


def vk_fetch_all_commenters(owner_id: int, post_id: int, token: str) -> set:
    '''Собирает id всех, кто оставил комментарий под постом (до 1000 комментариев)'''
    commenter_ids = set()
    offset = 0
    count = 100
    for _ in range(10):
        data = vk_call('wall.getComments', {
            'owner_id': owner_id, 'post_id': post_id, 'count': count, 'offset': offset, 'need_likes': 0,
        }, token)
        response = data.get('response')
        if not response:
            break
        items = response.get('items', [])
        for item in items:
            from_id = item.get('from_id')
            if from_id and from_id > 0:
                commenter_ids.add(from_id)
        total = response.get('count', 0)
        offset += count
        if offset >= total or not items:
            break
        time.sleep(0.34)
    return commenter_ids


def handle_vk_check(event: Dict[str, Any], conn) -> Dict[str, Any]:
    '''Обработка эндпоинта endpoint=vk_check: настройка поста и проверка лайков/репостов/комментариев'''
    method = event.get('httpMethod', 'GET')
    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action', '')
    cors = {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}

    if method == 'GET':
        contest_id = query_params.get('contest_id')
        if not contest_id:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'contest_id обязателен'}), 'isBase64Encoded': False}
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f'SELECT contest_id, post_url, owner_id, post_id, updated_at FROM {SCHEMA}.vk_check_posts WHERE contest_id = %s', (int(contest_id),))
            post = cur.fetchone()
            if post and post.get('updated_at'):
                post['updated_at'] = post['updated_at'].isoformat()

            cur.execute(f'''
                SELECT a.id AS application_id, p.full_name, p.vk_link, a.status,
                       r.vk_user_id, r.vk_resolved, r.liked, r.reposted, r.commented, r.subscribed, r.checked_at
                FROM {SCHEMA}.applications a
                JOIN {SCHEMA}.participants p ON p.id = a.participant_id
                LEFT JOIN {SCHEMA}.vk_check_results r ON r.application_id = a.id AND r.contest_id = a.contest_id
                WHERE a.contest_id = %s
                ORDER BY p.full_name
            ''', (int(contest_id),))
            rows = cur.fetchall()
            for row in rows:
                if row.get('checked_at'):
                    row['checked_at'] = row['checked_at'].isoformat()
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'post': post, 'applications': rows}, default=str), 'isBase64Encoded': False}

    if method == 'POST' and action == 'set_post':
        body_data = json.loads(event.get('body') or '{}')
        contest_id = body_data.get('contest_id')
        post_url = (body_data.get('post_url') or '').strip()
        if not contest_id or not post_url:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'contest_id и post_url обязательны'}), 'isBase64Encoded': False}
        parsed = vk_parse_post_url(post_url)
        if not parsed:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Не удалось распознать ссылку. Формат: https://vk.com/wall-123456_789'}), 'isBase64Encoded': False}

        token = os.environ.get('VK_SERVICE_TOKEN')
        if not token:
            return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'VK_SERVICE_TOKEN не настроен'}), 'isBase64Encoded': False}

        check = vk_call('wall.getComments', {'owner_id': parsed['owner_id'], 'post_id': parsed['post_id'], 'count': 1}, token)
        if 'error' in check:
            vk_error = check.get('error', {})
            error_msg = vk_error.get('error_msg', 'неизвестная ошибка VK API')
            print(f'[VK ERROR] set_post check={check}')
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': f'VK API: {error_msg}'}), 'isBase64Encoded': False}

        with conn.cursor() as cur:
            cur.execute(f'''
                INSERT INTO {SCHEMA}.vk_check_posts (contest_id, post_url, owner_id, post_id, updated_at)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (contest_id) DO UPDATE SET post_url = EXCLUDED.post_url, owner_id = EXCLUDED.owner_id, post_id = EXCLUDED.post_id, updated_at = CURRENT_TIMESTAMP
            ''', (int(contest_id), post_url, parsed['owner_id'], parsed['post_id']))
        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

    if method == 'POST' and action == 'run_check':
        body_data = json.loads(event.get('body') or '{}')
        contest_id = body_data.get('contest_id')
        if not contest_id:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'contest_id обязателен'}), 'isBase64Encoded': False}

        token = os.environ.get('VK_SERVICE_TOKEN')
        if not token:
            return {'statusCode': 500, 'headers': cors, 'body': json.dumps({'error': 'VK_SERVICE_TOKEN не настроен'}), 'isBase64Encoded': False}

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f'SELECT owner_id, post_id FROM {SCHEMA}.vk_check_posts WHERE contest_id = %s', (int(contest_id),))
            post = cur.fetchone()
        if not post:
            return {'statusCode': 400, 'headers': cors, 'body': json.dumps({'error': 'Сначала укажите ссылку на пост для этого конкурса'}), 'isBase64Encoded': False}
        owner_id = post['owner_id']
        post_id = post['post_id']
        group_id = abs(owner_id)

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(f'''
                SELECT a.id AS application_id, p.vk_link
                FROM {SCHEMA}.applications a
                JOIN {SCHEMA}.participants p ON p.id = a.participant_id
                WHERE a.contest_id = %s AND p.vk_link IS NOT NULL AND p.vk_link != ''
            ''', (int(contest_id),))
            participants = cur.fetchall()

        commenter_ids = vk_fetch_all_commenters(owner_id, post_id, token)

        results = []
        for i in range(0, len(participants), VK_CHUNK_SIZE):
            chunk = participants[i:i + VK_CHUNK_SIZE]
            screen_names = []
            valid_chunk = []
            for p in chunk:
                sn = vk_extract_screen_name(p['vk_link'])
                if sn:
                    screen_names.append(sn)
                    valid_chunk.append(p)
            if not screen_names:
                continue
            code = vk_build_check_code(screen_names, owner_id, post_id, group_id)
            exec_result = vk_execute(code, token)
            response = exec_result.get('response', [])
            for p, r in zip(valid_chunk, response):
                uid = r.get('user_id', 0)
                resolved = uid > 0
                results.append({
                    'application_id': p['application_id'],
                    'vk_user_id': uid if resolved else None,
                    'vk_resolved': resolved,
                    'liked': bool(r.get('liked')),
                    'reposted': bool(r.get('copied')),
                    'commented': resolved and uid in commenter_ids,
                    'subscribed': bool(r.get('member')),
                })
            time.sleep(0.34)

        with conn.cursor() as cur:
            for r in results:
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.vk_check_results (contest_id, application_id, vk_user_id, vk_resolved, liked, reposted, commented, subscribed, checked_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (contest_id, application_id) DO UPDATE SET
                        vk_user_id = EXCLUDED.vk_user_id, vk_resolved = EXCLUDED.vk_resolved,
                        liked = EXCLUDED.liked, reposted = EXCLUDED.reposted, commented = EXCLUDED.commented,
                        subscribed = EXCLUDED.subscribed, checked_at = CURRENT_TIMESTAMP
                ''', (int(contest_id), r['application_id'], r['vk_user_id'], r['vk_resolved'], r['liked'], r['reposted'], r['commented'], r['subscribed']))

        return {'statusCode': 200, 'headers': cors, 'body': json.dumps({'success': True, 'checked': len(results), 'total_with_vk_link': len(participants)}), 'isBase64Encoded': False}

    return {'statusCode': 404, 'headers': cors, 'body': json.dumps({'error': 'Неизвестный эндпоинт'}), 'isBase64Encoded': False}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Админ API для заявок и галереи
    GET /applications - получить все заявки с фильтрацией (требует X-Api-Key)
    PUT /applications - обновить статус заявки (status, admin_comment) или заморозку (editing_locked) (требует X-Api-Key)
    PUT /applications?action=update_fields - редактирование админом полей заявки и контактных данных участника (требует X-Api-Key)
    GET /gallery - получить элементы галереи (публично)
    POST /gallery - создать элемент галереи (загрузка файла) (требует X-Api-Key)
    PUT /gallery/{id} - обновить элемент галереи (требует X-Api-Key)
    DELETE /gallery/{id} - удалить элемент галереи (требует X-Api-Key)
    GET /?endpoint=vk_check&contest_id=X - получить пост и результаты проверки ВК по конкурсу (требует X-Api-Key)
    POST /?endpoint=vk_check&action=set_post - сохранить ссылку на пост ВК для конкурса (требует X-Api-Key)
    POST /?endpoint=vk_check&action=run_check - запустить проверку лайков/репостов/комментариев ВК (требует X-Api-Key)
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    # Определение эндпоинта
    query_string_params = event.get('queryStringParameters') or {}
    endpoint = query_string_params.get('endpoint', '')
    path_params = event.get('pathParams') or {}

    # Публичен только просмотр галереи (для отображения на сайте). Всё остальное — только с ключом.
    is_public_gallery_get = endpoint == 'gallery' and method == 'GET'
    if not is_public_gallery_get and not check_api_key(event):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется X-Api-Key'}),
            'isBase64Encoded': False
        }

    # Подключение к БД  
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
        # === VK CHECK ENDPOINTS ===
        if endpoint == 'vk_check':
            return handle_vk_check(event, conn)

        # === GALLERY ENDPOINTS ===
        if endpoint == 'gallery':
            if method == 'GET':
                query_params = event.get('queryStringParameters') or {}
                contest_id = query_params.get('contest_id')
                media_type = query_params.get('media_type')
                featured_only = query_params.get('featured') == 'true'
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    query = 'SELECT id, title, description, file_url, thumbnail_url, media_type, contest_id, display_order, is_featured, created_at FROM gallery_items WHERE 1=1'
                    sql_params = []
                    
                    if contest_id:
                        query += " AND contest_id = %s"
                        sql_params.append(int(contest_id))
                    if media_type:
                        query += " AND media_type = %s"
                        sql_params.append(media_type)
                    if featured_only:
                        query += " AND is_featured = true"
                    
                    query += ' ORDER BY display_order ASC, created_at DESC'
                    cur.execute(query, sql_params)
                    items = cur.fetchall()
                    
                    for item in items:
                        if item.get('created_at'):
                            item['created_at'] = item['created_at'].isoformat()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'items': items}),
                        'isBase64Encoded': False
                    }
            
            elif method == 'POST':
                body_data = json.loads(event.get('body', '{}'))
                
                title = body_data.get('title')
                description = body_data.get('description', '')
                media_type = body_data.get('media_type')
                contest_id = body_data.get('contest_id')
                display_order = body_data.get('display_order', 0)
                is_featured = body_data.get('is_featured', False)
                file_base64 = body_data.get('file_base64')
                file_name = body_data.get('file_name', 'file')
                
                if not title or not media_type or not file_base64:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'title, media_type и file_base64 обязательны'}),
                        'isBase64Encoded': False
                    }
                
                file_data = base64.b64decode(file_base64)
                file_ext = file_name.split('.')[-1] if '.' in file_name else 'jpg'
                unique_name = f"gallery/{uuid.uuid4()}.{file_ext}"
                
                s3 = boto3.client('s3',
                    endpoint_url='https://bucket.poehali.dev',
                    aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                    aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
                )
                
                content_type = 'image/jpeg'
                if file_ext in ['png']: content_type = 'image/png'
                elif file_ext in ['gif']: content_type = 'image/gif'
                elif file_ext in ['mp4', 'mov']: content_type = 'video/mp4'
                elif file_ext in ['avi']: content_type = 'video/x-msvideo'
                
                s3.put_object(
                    Bucket='files',
                    Key=unique_name,
                    Body=file_data,
                    ContentType=content_type
                )
                
                file_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{unique_name}"
                
                with conn.cursor() as cur:
                    cur.execute('''
                        INSERT INTO gallery_items 
                        (title, description, file_url, media_type, contest_id, display_order, is_featured)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id
                    ''', (title, description, file_url, media_type, contest_id, display_order, is_featured))
                    
                    item_id = cur.fetchone()[0]
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': item_id, 'file_url': file_url, 'message': 'Файл успешно загружен'}),
                    'isBase64Encoded': False
                }
            
            elif method == 'PUT':
                # Получаем ID из query параметров
                item_id = query_string_params.get('id')
                body_data = json.loads(event.get('body', '{}'))
                
                if not item_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID обязателен'}),
                        'isBase64Encoded': False
                    }
                
                updates = []
                values = []
                
                if 'title' in body_data:
                    updates.append('title = %s')
                    values.append(body_data['title'])
                if 'description' in body_data:
                    updates.append('description = %s')
                    values.append(body_data['description'])
                if 'display_order' in body_data:
                    updates.append('display_order = %s')
                    values.append(body_data['display_order'])
                if 'is_featured' in body_data:
                    updates.append('is_featured = %s')
                    values.append(body_data['is_featured'])
                if 'contest_id' in body_data:
                    updates.append('contest_id = %s')
                    values.append(body_data['contest_id'])
                
                if updates:
                    updates.append('updated_at = CURRENT_TIMESTAMP')
                    values.append(item_id)
                    
                    with conn.cursor() as cur:
                        query = f"UPDATE gallery_items SET {', '.join(updates)} WHERE id = %s"
                        cur.execute(query, values)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Элемент обновлен'}),
                    'isBase64Encoded': False
                }
            
            elif method == 'DELETE':
                # Получаем ID из query параметров
                item_id = query_string_params.get('id')
                
                if not item_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID обязателен'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute('DELETE FROM gallery_items WHERE id = %s', (item_id,))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Элемент удален'}),
                    'isBase64Encoded': False
                }
        
        # === APPLICATIONS ENDPOINTS ===
        if endpoint != 'gallery' and method == 'GET':
            # Получение всех заявок
            params = event.get('queryStringParameters') or {}
            contest_filter = params.get('contest_id')
            status_filter = params.get('status')
            search_query = params.get('search', '').lower()
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Полный запрос с JOIN для получения всех данных
                query = '''
                    SELECT 
                        a.id, 
                        a.participant_id,
                        a.contest_id,
                        a.category,
                        a.performance_title,
                        a.nomination,
                        a.nomination_id,
                        a.participation_format,
                        a.experience,
                        a.achievements,
                        a.additional_info,
                        a.custom_fields,
                        a.status,
                        a.submitted_at,
                        a.editing_locked,
                        a.admin_comment,
                        p.full_name,
                        p.contact_position,
                        p.email,
                        p.phone,
                        p.vk_link,
                        p.city,
                        c.title as contest_title,
                        c.applications_locked,
                        n.name as nomination_name
                    FROM applications a
                    JOIN participants p ON a.participant_id = p.id
                    JOIN contests c ON a.contest_id = c.id
                    LEFT JOIN nominations n ON n.id = a.nomination_id
                    WHERE 1=1
                '''
                query_params = []
                
                if contest_filter:
                    query += " AND a.contest_id = %s"
                    query_params.append(int(contest_filter))
                
                if status_filter:
                    query += " AND a.status = %s"
                    query_params.append(status_filter)
                
                query += ' ORDER BY a.submitted_at DESC'
                
                cur.execute(query, query_params)
                applications = cur.fetchall()
                
                # Конвертация datetime в строки
                for app in applications:
                    if app.get('submitted_at'):
                        app['submitted_at'] = app['submitted_at'].isoformat()
                
                # Получаем файлы для каждой заявки отдельным курсором
                for app in applications:
                    with conn.cursor(cursor_factory=RealDictCursor) as files_cur:
                        files_cur.execute(
                            'SELECT file_name, file_type, file_size, file_url FROM application_files WHERE application_id = %s',
                            (app['id'],)
                        )
                        app['files'] = files_cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'applications': applications,
                        'total': len(applications)
                    }),
                    'isBase64Encoded': False
                }
        
        elif endpoint != 'gallery' and method == 'PUT' and query_string_params.get('action') == 'update_fields':
            # Редактирование админом полей заявки и контактных данных участника
            body = json.loads(event.get('body', '{}'))
            app_id = body.get('application_id')

            if not app_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'application_id обязателен'}),
                    'isBase64Encoded': False
                }

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f'SELECT participant_id, contest_id FROM {SCHEMA}.applications WHERE id = %s', (app_id,))
                existing = cur.fetchone()
                if not existing:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }

                custom_fields = body.get('custom_fields')
                nomination_id = body.get('nomination_id')

                cur.execute(f'''
                    UPDATE {SCHEMA}.applications
                    SET category = %s, performance_title = %s, participation_format = %s,
                        nomination = %s, nomination_id = %s, experience = %s, achievements = %s,
                        additional_info = %s, custom_fields = %s
                    WHERE id = %s
                ''', (
                    body.get('category', ''),
                    body.get('performance_title', ''),
                    body.get('participation_format', ''),
                    body.get('nomination', ''),
                    nomination_id,
                    body.get('experience', ''),
                    body.get('achievements', ''),
                    body.get('additional_info', ''),
                    json.dumps(custom_fields) if custom_fields is not None else '{}',
                    app_id
                ))

                cur.execute(f'''
                    UPDATE {SCHEMA}.participants
                    SET full_name = %s, contact_position = %s, email = %s, phone = %s, vk_link = %s, city = %s
                    WHERE id = %s
                ''', (
                    body.get('full_name', ''),
                    body.get('contact_position', ''),
                    body.get('email', ''),
                    body.get('phone', ''),
                    body.get('vk_link', ''),
                    body.get('city', ''),
                    existing['participant_id']
                ))

                # Если заявка уже занесена в программу конкурса - синхронизируем ключевые данные
                cur.execute(f'SELECT id FROM {SCHEMA}.contest_program WHERE application_id = %s', (app_id,))
                program_row = cur.fetchone()
                if program_row:
                    cur.execute(f'''
                        UPDATE {SCHEMA}.contest_program
                        SET participant_name = %s, nomination = %s, nomination_id = %s,
                            piece_title = %s, participation_format = %s, director_name = %s,
                            region = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE application_id = %s
                    ''', (
                        body.get('full_name', ''),
                        body.get('nomination', ''),
                        nomination_id,
                        body.get('performance_title', ''),
                        body.get('participation_format', ''),
                        body.get('contact_position', ''),
                        body.get('city', ''),
                        app_id
                    ))

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Заявка обновлена'}),
                'isBase64Encoded': False
            }

        elif endpoint != 'gallery' and method == 'PUT':
            # Обновление статуса заявки или заморозка/разморозка редактирования
            body = json.loads(event.get('body', '{}'))
            app_id = body.get('application_id')
            new_status = body.get('status')
            editing_locked = body.get('editing_locked')
            admin_comment = body.get('admin_comment', '')

            if not app_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'application_id обязателен'}),
                    'isBase64Encoded': False
                }

            # Заморозка/разморозка редактирования конкретной заявки (без изменения статуса)
            if editing_locked is not None and new_status is None:
                with conn.cursor() as cur:
                    cur.execute(
                        "UPDATE applications SET editing_locked = %s WHERE id = %s",
                        (bool(editing_locked), app_id)
                    )
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'message': 'Редактирование заявки закрыто' if editing_locked else 'Редактирование заявки открыто'
                    }),
                    'isBase64Encoded': False
                }

            if not new_status:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'application_id и status обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Получаем данные заявки
                cur.execute(
                    '''SELECT a.*, p.full_name, p.contact_position, p.email, p.phone, p.vk_link, p.city, p.push_token, c.title as contest_title
                       FROM applications a
                       JOIN participants p ON a.participant_id = p.id
                       JOIN contests c ON a.contest_id = c.id
                       WHERE a.id = %s''',
                    (app_id,)
                )
                application = cur.fetchone()
                
                if not application:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }
                
                # Обновляем статус заявки (комментарий сохраняем только для rejected/pending, при approved — очищаем)
                cur.execute(
                    "UPDATE applications SET status = %s, admin_comment = %s WHERE id = %s",
                    (new_status, admin_comment if new_status in ('rejected', 'pending') else None, app_id)
                )
                
                # Если заявка одобрена - обновляем участника для системы оценивания
                if new_status == 'approved':
                    # Достаём значения системных полей формы заявки (custom_fields -> system_key)
                    custom_fields = application.get('custom_fields') or {}
                    if isinstance(custom_fields, str):
                        custom_fields = json.loads(custom_fields)

                    system_values = {}
                    cur.execute(f'''
                        SELECT f.system_key, f.field_name
                        FROM {SCHEMA}.application_form_fields f
                        JOIN {SCHEMA}.contests c ON c.form_template_id = f.template_id
                        WHERE c.id = %s AND f.system_key IS NOT NULL
                    ''', (application['contest_id'],))
                    for row in cur.fetchall():
                        value = custom_fields.get(row['field_name'], '')
                        if value:
                            system_values[row['system_key']] = value

                    participant_name = system_values.get('participant_name') or application['full_name']
                    nomination = system_values.get('nomination') or application.get('nomination', '')
                    nomination_id = application.get('nomination_id')
                    piece_title = system_values.get('piece_title') or application.get('performance_title', '')
                    participation_format = system_values.get('participation_format') or application.get('participation_format', '')
                    region = system_values.get('region') or application.get('city', '')
                    directing_party = system_values.get('directing_party', '')
                    duration = system_values.get('duration', '')
                    director_name = system_values.get('director_name') or application.get('contact_position', '')
                    age_category = system_values.get('age_category', '')

                    # Обновляем участника: добавляем contest_id, category, performance_title, participation_format, nomination, status
                    cur.execute(
                        '''UPDATE participants 
                           SET contest_id = %s, category = %s, performance_title = %s, 
                               participation_format = %s, nomination = %s, status = 'approved'
                           WHERE id = %s''',
                        (application['contest_id'], application['category'], 
                         piece_title or 'Не указано',
                         participation_format,
                         nomination,
                         application['participant_id'])
                    )

                    # Автоматически заносим заявку в программу конкурса (если ещё не занесена)
                    cur.execute(f'SELECT id FROM {SCHEMA}.contest_program WHERE application_id = %s', (app_id,))
                    already_in_program = cur.fetchone()

                    if not already_in_program:
                        cur.execute(f'''
                            SELECT COALESCE(MAX(order_number), 0) + 1 AS next_num
                            FROM {SCHEMA}.contest_program
                            WHERE contest_id = %s
                        ''', (application['contest_id'],))
                        next_num = cur.fetchone()['next_num']

                        diploma_number = generate_diploma_number(conn)

                        cur.execute(f'''
                            INSERT INTO {SCHEMA}.contest_program
                              (contest_id, order_number, region, directing_party, participant_name, age, nomination, nomination_id, piece_title, duration, diploma_number, director_name, application_id, participation_format)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ''', (
                            application['contest_id'],
                            next_num,
                            region,
                            directing_party,
                            participant_name,
                            age_category,
                            nomination,
                            nomination_id,
                            piece_title,
                            duration,
                            diploma_number,
                            director_name,
                            app_id,
                            participation_format
                        ))
                    else:
                        # Заявка уже в программе (например, была одобрена ранее) — синхронизируем номинацию
                        cur.execute(f'''
                            UPDATE {SCHEMA}.contest_program
                            SET nomination = %s, nomination_id = %s
                            WHERE application_id = %s
                        ''', (nomination, nomination_id, app_id))
            
            try:
                send_status_update_email(application['email'], application['full_name'], application['contest_title'], new_status, admin_comment)
            except Exception as email_err:
                print(f'[EMAIL ERROR] {email_err}')

            try:
                status_label = STATUS_LABELS.get(new_status, new_status)
                push_title = 'Статус заявки изменён'
                push_body = f"Заявка на «{application['contest_title']}» {status_label}"
                send_push_notification(
                    application.get('push_token'),
                    push_title,
                    push_body,
                    {'screen': 'MyApplications', 'applicationId': app_id, 'contestId': application['contest_id']}
                )
                with conn.cursor() as ncur:
                    ncur.execute(
                        f'INSERT INTO {SCHEMA}.notifications (title, body, contest_id, participant_id) VALUES (%s, %s, %s, %s)',
                        (push_title, push_body, application['contest_id'], application.get('participant_id'))
                    )
            except Exception as push_err:
                print(f'[PUSH ERROR] {push_err}')
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True, 
                    'message': 'Статус обновлён' + (' и участник добавлен в систему оценивания и программу конкурса' if new_status == 'approved' else '')
                }),
                'isBase64Encoded': False
            }
        
        elif endpoint != 'gallery' and method == 'DELETE':
            # Удаление заявки
            query_params = event.get('queryStringParameters') or {}
            app_id = query_params.get('id')
            
            if not app_id:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'ID заявки обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                # Сначала удаляем связанные файлы
                cur.execute('DELETE FROM application_files WHERE application_id = %s', (app_id,))
                # Затем удаляем саму заявку
                cur.execute('DELETE FROM applications WHERE id = %s', (app_id,))
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Заявка удалена'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Метод не поддерживается'}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()