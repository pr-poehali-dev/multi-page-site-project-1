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
    
    try:
        if method == 'GET':
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
                categories
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
        cur.execute('''
            INSERT INTO contests (title, description, start_date, end_date, status, pdf_url, rules, prizes, categories)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (title, description, start_date, end_date, status, pdf_url, rules, prizes, categories))
        
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