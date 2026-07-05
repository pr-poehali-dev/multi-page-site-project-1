import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление конкурсами
    GET / - получить все конкурсы
    POST / - создать новый конкурс
    PUT / - обновить конкурс
    DELETE / - удалить конкурс
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
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
    
    params = event.get('queryStringParameters') or {}
    action = params.get('action')

    try:
        if action == 'templates' and method == 'GET':
            return list_templates(conn)
        elif action == 'template_fields' and method == 'GET':
            return list_template_fields(conn, params.get('template_id'))
        elif action == 'template_create' and method == 'POST':
            return create_template(conn, event)
        elif action == 'template_delete' and method == 'DELETE':
            return delete_template(conn, params.get('id'))
        elif action == 'fields_save' and method == 'POST':
            return save_template_fields(conn, event)
        elif action == 'assign_template' and method == 'PUT':
            return assign_template(conn, event)
        elif action == 'contest_form' and method == 'GET':
            return get_contest_form(conn, params.get('contest_id'))

        elif method == 'GET':
            return get_contests(conn)
        elif method == 'POST':
            return create_contest(conn, event)
        elif method == 'PUT':
            return update_contest(conn, event)
        elif method == 'DELETE':
            return delete_contest(conn, event)
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


def get_contests(conn) -> Dict[str, Any]:
    '''Получение всех конкурсов'''
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT 
                id,
                title,
                description,
                start_date,
                end_date,
                status,
                pdf_url,
                rules,
                prizes,
                categories,
                poster_url,
                ticket_link,
                details_link,
                location,
                event_date,
                application_form_url,
                logo_url,
                form_template_id
            FROM contests
            WHERE status IS NOT NULL
            ORDER BY start_date
        ''')
        
        contests = cur.fetchall()
        
        # Конвертация дат в строки
        for contest in contests:
            if contest.get('start_date'):
                contest['start_date'] = contest['start_date'].isoformat()
            if contest.get('end_date'):
                contest['end_date'] = contest['end_date'].isoformat()
            if contest.get('event_date') and not isinstance(contest['event_date'], str):
                contest['event_date'] = contest['event_date'].isoformat()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'contests': contests,
                'total': len(contests)
            }),
            'isBase64Encoded': False
        }


def create_contest(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Создание нового конкурса'''
    body = json.loads(event.get('body', '{}'))
    
    title = body.get('title')
    description = body.get('description', '')
    start_date = body.get('start_date')
    end_date = body.get('end_date')
    status = body.get('status', 'upcoming')
    pdf_url = body.get('pdf_url')
    rules = body.get('rules')
    prizes = body.get('prizes')
    categories = body.get('categories')
    poster_url = body.get('poster_url')
    ticket_link = body.get('ticket_link')
    details_link = body.get('details_link')
    location = body.get('location')
    event_date = body.get('event_date')
    application_form_url = body.get('application_form_url')
    logo_url = body.get('logo_url')
    
    if not title or not start_date or not end_date:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Заполните обязательные поля: title, start_date, end_date'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Генерируем contest_key из title (транслитерация + timestamp для уникальности)
        import hashlib
        import time
        contest_key = hashlib.md5(f"{title}{time.time()}".encode()).hexdigest()[:16]
        
        cur.execute('''
            INSERT INTO contests (contest_key, title, description, start_date, end_date, status, pdf_url, rules, prizes, categories, poster_url, ticket_link, details_link, location, event_date, application_form_url, logo_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (contest_key, title, description, start_date, end_date, status, pdf_url, rules, prizes, categories, poster_url, ticket_link, details_link, location, event_date, application_form_url, logo_url))
        
        result = cur.fetchone()
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'id': result['id']}),
            'isBase64Encoded': False
        }


def update_contest(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Обновление конкурса'''
    body = json.loads(event.get('body', '{}'))
    
    contest_id = body.get('id')
    if not contest_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'ID конкурса обязателен'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor() as cur:
        updates = []
        values = []
        
        if 'title' in body:
            updates.append('title = %s')
            values.append(body['title'])
        if 'description' in body:
            updates.append('description = %s')
            values.append(body['description'])
        if 'start_date' in body:
            updates.append('start_date = %s')
            values.append(body['start_date'])
        if 'end_date' in body:
            updates.append('end_date = %s')
            values.append(body['end_date'])
        if 'status' in body:
            updates.append('status = %s')
            values.append(body['status'])
        if 'pdf_url' in body:
            updates.append('pdf_url = %s')
            values.append(body['pdf_url'])
        if 'rules' in body:
            updates.append('rules = %s')
            values.append(body['rules'])
        if 'prizes' in body:
            updates.append('prizes = %s')
            values.append(body['prizes'])
        if 'categories' in body:
            updates.append('categories = %s')
            values.append(body['categories'])
        if 'poster_url' in body:
            updates.append('poster_url = %s')
            values.append(body['poster_url'])
        if 'ticket_link' in body:
            updates.append('ticket_link = %s')
            values.append(body['ticket_link'])
        if 'details_link' in body:
            updates.append('details_link = %s')
            values.append(body['details_link'])
        if 'location' in body:
            updates.append('location = %s')
            values.append(body['location'])
        if 'event_date' in body:
            updates.append('event_date = %s')
            values.append(body['event_date'])
        if 'application_form_url' in body:
            updates.append('application_form_url = %s')
            values.append(body['application_form_url'])
        if 'logo_url' in body:
            updates.append('logo_url = %s')
            values.append(body['logo_url'])
        
        if not updates:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Нет данных для обновления'}),
                'isBase64Encoded': False
            }
        
        values.append(contest_id)
        query = f"UPDATE contests SET {', '.join(updates)} WHERE id = %s"
        
        cur.execute(query, values)
        
        if cur.rowcount == 0:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Конкурс не найден'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }


def delete_contest(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    '''Удаление конкурса'''
    params = event.get('queryStringParameters') or {}
    contest_id = params.get('id')
    
    if not contest_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'ID конкурса обязателен'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor() as cur:
        cur.execute('DELETE FROM contests WHERE id = %s', (contest_id,))
        
        if cur.rowcount == 0:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Конкурс не найден'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True}),
            'isBase64Encoded': False
        }


def _resp(status, body):
    return {'statusCode': status, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps(body), 'isBase64Encoded': False}


def list_templates(conn) -> Dict[str, Any]:
    '''Список всех шаблонов форм заявок с количеством полей'''
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT t.id, t.name, t.created_at, COUNT(f.id) AS fields_count
            FROM application_form_templates t
            LEFT JOIN application_form_fields f ON f.template_id = t.id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        ''')
        rows = cur.fetchall()
        for r in rows:
            if r.get('created_at'):
                r['created_at'] = r['created_at'].isoformat()
        return _resp(200, {'templates': rows})


def list_template_fields(conn, template_id) -> Dict[str, Any]:
    '''Список полей конкретного шаблона'''
    if not template_id:
        return _resp(400, {'error': 'Укажите template_id'})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('''
            SELECT id, field_name, field_label, field_type, options, is_required, sort_order
            FROM application_form_fields
            WHERE template_id = %s
            ORDER BY sort_order ASC, id ASC
        ''', (template_id,))
        return _resp(200, {'fields': cur.fetchall()})


def create_template(conn, event) -> Dict[str, Any]:
    '''Создание нового шаблона формы заявки'''
    body = json.loads(event.get('body', '{}'))
    name = (body.get('name') or '').strip()
    if not name:
        return _resp(400, {'error': 'Укажите название шаблона'})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('INSERT INTO application_form_templates (name) VALUES (%s) RETURNING id', (name,))
        template_id = cur.fetchone()['id']
        return _resp(201, {'id': template_id})


def delete_template(conn, template_id) -> Dict[str, Any]:
    '''Удаление шаблона формы (и его полей)'''
    if not template_id:
        return _resp(400, {'error': 'Укажите id'})
    with conn.cursor() as cur:
        cur.execute('DELETE FROM application_form_fields WHERE template_id = %s', (template_id,))
        cur.execute('UPDATE contests SET form_template_id = NULL WHERE form_template_id = %s', (template_id,))
        cur.execute('DELETE FROM application_form_templates WHERE id = %s', (template_id,))
        return _resp(200, {'success': True})


def save_template_fields(conn, event) -> Dict[str, Any]:
    '''Полная замена полей шаблона (удаление старых + вставка новых)'''
    body = json.loads(event.get('body', '{}'))
    template_id = body.get('template_id')
    fields = body.get('fields', [])
    if not template_id:
        return _resp(400, {'error': 'Укажите template_id'})
    with conn.cursor() as cur:
        cur.execute('DELETE FROM application_form_fields WHERE template_id = %s', (template_id,))
        for i, f in enumerate(fields):
            cur.execute('''
                INSERT INTO application_form_fields
                (template_id, field_name, field_label, field_type, options, is_required, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            ''', (
                template_id,
                f.get('field_name') or f"field_{i}",
                f.get('field_label', ''),
                f.get('field_type', 'text'),
                f.get('options', ''),
                bool(f.get('is_required', False)),
                f.get('sort_order', i),
            ))
        return _resp(200, {'success': True})


def assign_template(conn, event) -> Dict[str, Any]:
    '''Назначить шаблон формы конкурсу (или снять, если template_id is null)'''
    body = json.loads(event.get('body', '{}'))
    contest_id = body.get('contest_id')
    template_id = body.get('template_id')
    if not contest_id:
        return _resp(400, {'error': 'Укажите contest_id'})
    with conn.cursor() as cur:
        cur.execute('UPDATE contests SET form_template_id = %s WHERE id = %s', (template_id, contest_id))
        return _resp(200, {'success': True})


def get_contest_form(conn, contest_id) -> Dict[str, Any]:
    '''Получить поля формы, назначенной конкурсу (для рендера на фронте)'''
    if not contest_id:
        return _resp(400, {'error': 'Укажите contest_id'})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute('SELECT form_template_id FROM contests WHERE id = %s', (contest_id,))
        row = cur.fetchone()
        if not row or not row['form_template_id']:
            return _resp(200, {'fields': []})
        cur.execute('''
            SELECT id, field_name, field_label, field_type, options, is_required, sort_order
            FROM application_form_fields
            WHERE template_id = %s
            ORDER BY sort_order ASC, id ASC
        ''', (row['form_template_id'],))
        return _resp(200, {'fields': cur.fetchall()})