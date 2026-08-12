import json
import os
import re
from typing import Dict, Any, List, Optional
import requests

VK_API_URL = 'https://api.vk.com/method'
VK_VERSION = '5.199'

EMAIL_RE = re.compile(r'[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}')


def check_api_key(event: Dict[str, Any]) -> bool:
    '''Проверка ключа доступа для админских операций (X-Api-Key)'''
    expected = os.environ.get('ADMIN_API_KEY')
    if not expected:
        return True
    headers = event.get('headers') or {}
    token = headers.get('X-Api-Key') or headers.get('x-api-key')
    return token == expected


def vk_call(method: str, params: Dict[str, Any], token: str) -> Dict[str, Any]:
    '''Вызов метода VK API'''
    payload = {**params, 'access_token': token, 'v': VK_VERSION}
    resp = requests.get(f'{VK_API_URL}/{method}', params=payload, timeout=10)
    return resp.json()


def extract_emails(text: Optional[str]) -> List[str]:
    '''Находит все email-адреса в тексте'''
    if not text:
        return []
    found = EMAIL_RE.findall(text)
    seen = []
    for e in found:
        e_clean = e.strip('.,;:()')
        if e_clean.lower() not in [s.lower() for s in seen]:
            seen.append(e_clean)
    return seen


def get_group_emails(group: Dict[str, Any], token: str) -> List[str]:
    '''
    Ищет email сообщества: сначала в описании (description),
    затем в контактах сообщества (contacts -> у контактных лиц может быть указан email в поле email или description контакта)
    '''
    emails: List[str] = []

    description = group.get('description') or ''
    emails.extend(extract_emails(description))

    contacts = group.get('contacts') or []
    for contact in contacts:
        contact_email = contact.get('email')
        if contact_email:
            for e in extract_emails(contact_email):
                if e.lower() not in [x.lower() for x in emails]:
                    emails.append(e)
        contact_desc = contact.get('desc') or ''
        for e in extract_emails(contact_desc):
            if e.lower() not in [x.lower() for x in emails]:
                emails.append(e)

    return emails


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Парсер сообществ ВКонтакте: поиск групп по ключевым словам и региону/городу,
    сбор email из описания и контактов сообщества, список городов для подсказки.
    Методы:
      GET ?action=cities&q=... - подсказка городов VK по названию
      POST {action: 'search', query, city_id, count, offset} - поиск сообществ
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

    cors_headers = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    if not check_api_key(event):
        return {
            'statusCode': 403,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Доступ запрещён'}),
            'isBase64Encoded': False
        }

    token = os.environ.get('VK_SERVICE_TOKEN') or os.environ.get('VK_APP_SERVICE_TOKEN') or os.environ.get('VK_USER_TOKEN')
    if not token:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': 'VK токен не настроен'}),
            'isBase64Encoded': False
        }

    query_params = event.get('queryStringParameters') or {}
    action = query_params.get('action')

    try:
        if method == 'GET' and action == 'cities':
            q = query_params.get('q', '').strip()
            if not q:
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({'cities': []}),
                    'isBase64Encoded': False
                }
            resp = vk_call('database.getCities', {
                'country_id': 1,
                'q': q,
                'count': 20,
                'need_all': 0,
            }, token)
            if 'error' in resp:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': resp['error'].get('error_msg', 'Ошибка VK API')}),
                    'isBase64Encoded': False
                }
            items = (resp.get('response') or {}).get('items', [])
            cities = [{'id': c['id'], 'title': c['title'], 'region': c.get('region', ''), 'area': c.get('area', '')} for c in items]
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'cities': cities}),
                'isBase64Encoded': False
            }

        if method == 'POST' and action == 'search':
            body_data = json.loads(event.get('body') or '{}')
            search_query = (body_data.get('query') or '').strip()
            city_id = body_data.get('city_id')
            count = min(int(body_data.get('count') or 40), 1000)
            offset = int(body_data.get('offset') or 0)

            if not search_query:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Укажите ключевые слова для поиска'}),
                    'isBase64Encoded': False
                }

            search_params = {
                'q': search_query,
                'type': 'group',
                'count': min(count, 1000),
                'offset': offset,
                'sort': 0,
            }
            if city_id:
                search_params['city_id'] = int(city_id)

            resp = vk_call('groups.search', search_params, token)
            if 'error' in resp:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': resp['error'].get('error_msg', 'Ошибка VK API')}),
                    'isBase64Encoded': False
                }

            response = resp.get('response') or {}
            groups = response.get('items', [])
            total_count = response.get('count', 0)

            group_ids = [str(g['id']) for g in groups]
            emails_by_group: Dict[int, List[str]] = {}

            if group_ids:
                detail_resp = vk_call('groups.getById', {
                    'group_ids': ','.join(group_ids),
                    'fields': 'description,contacts,city,members_count,activity,site',
                }, token)
                detail_groups = detail_resp.get('response', {})
                if isinstance(detail_groups, dict):
                    detail_groups = detail_groups.get('groups', [])
                for g in detail_groups:
                    emails_by_group[g['id']] = get_group_emails(g, token)

            results = []
            for g in groups:
                gid = g['id']
                emails = emails_by_group.get(gid, [])
                results.append({
                    'id': gid,
                    'name': g.get('name', ''),
                    'screen_name': g.get('screen_name', ''),
                    'url': f"https://vk.com/{g.get('screen_name') or ('club' + str(gid))}",
                    'photo': g.get('photo_100', ''),
                    'members_count': g.get('members_count', 0),
                    'city': (g.get('city') or {}).get('title', ''),
                    'description': g.get('description', ''),
                    'emails': emails,
                    'is_closed': g.get('is_closed', 0),
                })

            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'groups': results,
                    'total_count': total_count,
                    'offset': offset,
                    'count': len(results),
                }),
                'isBase64Encoded': False
            }

        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Неизвестное действие'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        print(f'[VK PARSER ERROR] {e}')
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Внутренняя ошибка: {e}'}),
            'isBase64Encoded': False
        }
