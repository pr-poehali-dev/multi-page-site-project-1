import json
import os
import re
import time
import psycopg2
import requests
from psycopg2.extras import RealDictCursor
from typing import Dict, Any, List, Optional

SCHEMA = 't_p73771717_multi_page_site_proj'
VK_API_URL = 'https://api.vk.com/method'
VK_VERSION = '5.199'
CHUNK_SIZE = 12  # 2 API-вызова на участника (resolve + likes.isLiked) => 24 <= 25 лимит execute


def check_api_key(event: Dict[str, Any]) -> bool:
    '''Проверка ключа доступа для админских операций (X-Api-Key)'''
    expected = os.environ.get('ADMIN_API_KEY')
    if not expected:
        return True
    headers = event.get('headers') or {}
    token = headers.get('X-Api-Key') or headers.get('x-api-key')
    return token == expected


def parse_post_url(url: str) -> Optional[Dict[str, int]]:
    '''Извлекает owner_id и post_id из ссылки на пост ВК'''
    match = re.search(r'wall(-?\d+)_(\d+)', url)
    if not match:
        return None
    return {'owner_id': int(match.group(1)), 'post_id': int(match.group(2))}


def extract_screen_name(vk_link: str) -> Optional[str]:
    '''Извлекает screen_name из ссылки на профиль ВК'''
    if not vk_link:
        return None
    vk_link = vk_link.strip()
    match = re.search(r'(?:vk\.com|vkontakte\.ru)/([a-zA-Z0-9_.]+)', vk_link)
    if match:
        name = match.group(1)
    else:
        name = vk_link.lstrip('@').strip('/')
    name = name.split('?')[0].split('&')[0]
    if not name:
        return None
    return name


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


def build_check_code(screen_names: List[str], owner_id: int, post_id: int) -> str:
    '''Формирует VKScript для резолва профилей и проверки лайка/репоста'''
    names_json = json.dumps(screen_names)
    return f'''
    var ids = {names_json};
    var owner_id = {owner_id};
    var item_id = {post_id};
    var result = [];
    var i = 0;
    while (i < ids.length) {{
      var sn = ids[i];
      var resolved = API.utils.resolveScreenName({{"screen_name": sn}});
      var uid = 0;
      if (resolved.type == "user") {{ uid = resolved.object_id; }}
      var liked = 0;
      var copied = 0;
      if (uid > 0) {{
        var lk = API.likes.isLiked({{"type":"post","owner_id":owner_id,"item_id":item_id,"user_id":uid}});
        liked = lk.liked;
        copied = lk.copied;
      }}
      result.push({{"screen_name": sn, "user_id": uid, "liked": liked, "copied": copied}});
      i = i + 1;
    }}
    return result;
    '''


def fetch_all_commenters(owner_id: int, post_id: int, token: str) -> set:
    '''Собирает id всех, кто оставил комментарий под постом (до 1000 комментариев)'''
    commenter_ids = set()
    offset = 0
    count = 100
    max_pages = 10
    for _ in range(max_pages):
        data = vk_call('wall.getComments', {
            'owner_id': owner_id,
            'post_id': post_id,
            'count': count,
            'offset': offset,
            'need_likes': 0,
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


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Проверка лайков/репостов/комментариев ВК у участников конкурса.
    GET /?contest_id=X - получить настройку поста и результаты проверки по заявкам конкурса (требует X-Api-Key)
    POST /?action=set_post - сохранить ссылку на пост ВК для конкурса, body: {contest_id, post_url} (требует X-Api-Key)
    POST /?action=run_check - запустить проверку лайков/репостов/комментариев, body: {contest_id} (требует X-Api-Key)
    '''
    method: str = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if not check_api_key(event):
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется X-Api-Key'}),
            'isBase64Encoded': False
        }

    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }

    conn = psycopg2.connect(dsn)
    conn.autocommit = True

    try:
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action', '')

        if method == 'GET':
            contest_id = query_params.get('contest_id')
            if not contest_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'contest_id обязателен'}),
                    'isBase64Encoded': False
                }
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f'SELECT contest_id, post_url, owner_id, post_id, updated_at FROM {SCHEMA}.vk_check_posts WHERE contest_id = %s', (int(contest_id),))
                post = cur.fetchone()
                if post and post.get('updated_at'):
                    post['updated_at'] = post['updated_at'].isoformat()

                cur.execute(f'''
                    SELECT a.id AS application_id, p.full_name, p.vk_link, a.status,
                           r.vk_user_id, r.vk_resolved, r.liked, r.reposted, r.commented, r.checked_at
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

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'post': post, 'applications': rows}, default=str),
                'isBase64Encoded': False
            }

        if method == 'POST' and action == 'set_post':
            body_data = json.loads(event.get('body') or '{}')
            contest_id = body_data.get('contest_id')
            post_url = (body_data.get('post_url') or '').strip()
            if not contest_id or not post_url:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'contest_id и post_url обязательны'}),
                    'isBase64Encoded': False
                }
            parsed = parse_post_url(post_url)
            if not parsed:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Не удалось распознать ссылку на пост. Формат: https://vk.com/wall-123456_789'}),
                    'isBase64Encoded': False
                }

            token = os.environ.get('VK_SERVICE_TOKEN')
            if not token:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'VK_SERVICE_TOKEN не настроен'}),
                    'isBase64Encoded': False
                }

            check = vk_call('wall.getById', {'posts': f"{parsed['owner_id']}_{parsed['post_id']}"}, token)
            if 'error' in check or not check.get('response'):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пост не найден или сообщество недоступно. Проверьте ссылку и права токена'}),
                    'isBase64Encoded': False
                }

            with conn.cursor() as cur:
                cur.execute(f'''
                    INSERT INTO {SCHEMA}.vk_check_posts (contest_id, post_url, owner_id, post_id, updated_at)
                    VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                    ON CONFLICT (contest_id) DO UPDATE SET post_url = EXCLUDED.post_url, owner_id = EXCLUDED.owner_id, post_id = EXCLUDED.post_id, updated_at = CURRENT_TIMESTAMP
                ''', (int(contest_id), post_url, parsed['owner_id'], parsed['post_id']))

            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }

        if method == 'POST' and action == 'run_check':
            body_data = json.loads(event.get('body') or '{}')
            contest_id = body_data.get('contest_id')
            if not contest_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'contest_id обязателен'}),
                    'isBase64Encoded': False
                }

            token = os.environ.get('VK_SERVICE_TOKEN')
            if not token:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'VK_SERVICE_TOKEN не настроен'}),
                    'isBase64Encoded': False
                }

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f'SELECT owner_id, post_id FROM {SCHEMA}.vk_check_posts WHERE contest_id = %s', (int(contest_id),))
                post = cur.fetchone()
            if not post:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сначала укажите ссылку на пост для этого конкурса'}),
                    'isBase64Encoded': False
                }
            owner_id = post['owner_id']
            post_id = post['post_id']

            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f'''
                    SELECT a.id AS application_id, p.vk_link
                    FROM {SCHEMA}.applications a
                    JOIN {SCHEMA}.participants p ON p.id = a.participant_id
                    WHERE a.contest_id = %s AND p.vk_link IS NOT NULL AND p.vk_link != ''
                ''', (int(contest_id),))
                participants = cur.fetchall()

            commenter_ids = fetch_all_commenters(owner_id, post_id, token)

            results = []
            for i in range(0, len(participants), CHUNK_SIZE):
                chunk = participants[i:i + CHUNK_SIZE]
                screen_names = []
                valid_chunk = []
                for p in chunk:
                    sn = extract_screen_name(p['vk_link'])
                    if sn:
                        screen_names.append(sn)
                        valid_chunk.append(p)
                if not screen_names:
                    continue
                code = build_check_code(screen_names, owner_id, post_id)
                exec_result = vk_execute(code, token)
                response = exec_result.get('response', [])
                for p, r in zip(valid_chunk, response):
                    uid = r.get('user_id', 0)
                    resolved = uid > 0
                    liked = bool(r.get('liked'))
                    copied = bool(r.get('copied'))
                    commented = resolved and uid in commenter_ids
                    results.append({
                        'application_id': p['application_id'],
                        'vk_user_id': uid if resolved else None,
                        'vk_resolved': resolved,
                        'liked': liked,
                        'reposted': copied,
                        'commented': commented,
                    })
                time.sleep(0.34)

            with conn.cursor() as cur:
                for r in results:
                    cur.execute(f'''
                        INSERT INTO {SCHEMA}.vk_check_results (contest_id, application_id, vk_user_id, vk_resolved, liked, reposted, commented, checked_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                        ON CONFLICT (contest_id, application_id) DO UPDATE SET
                            vk_user_id = EXCLUDED.vk_user_id,
                            vk_resolved = EXCLUDED.vk_resolved,
                            liked = EXCLUDED.liked,
                            reposted = EXCLUDED.reposted,
                            commented = EXCLUDED.commented,
                            checked_at = CURRENT_TIMESTAMP
                    ''', (int(contest_id), r['application_id'], r['vk_user_id'], r['vk_resolved'], r['liked'], r['reposted'], r['commented']))

            checked_count = len(results)
            total_count = len(participants)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'checked': checked_count, 'total_with_vk_link': total_count}),
                'isBase64Encoded': False
            }

        return {
            'statusCode': 404,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Неизвестный эндпоинт'}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
