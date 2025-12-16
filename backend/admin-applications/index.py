import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получение всех заявок для админ-панели жюри
    GET / - получить все заявки с фильтрацией
    PUT / - обновить статус заявки
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Подключение к БД  
    dsn = os.environ.get('DATABASE_URL_RW')
    if not dsn:
        dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    try:
        if method == 'GET':
            # Получение всех заявок
            params = event.get('queryStringParameters') or {}
            contest_filter = params.get('contest_id')
            status_filter = params.get('status')
            search_query = params.get('search', '').lower()
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Простой запрос без JOIN для тестирования
                query = 'SELECT id, participant_id, contest_id, status, submitted_at FROM applications WHERE 1=1'
                
                if contest_filter:
                    query += f" AND contest_id = {int(contest_filter)}"
                
                if status_filter:
                    query += f" AND status = '{status_filter}'"
                
                query += ' ORDER BY submitted_at DESC'
                
                cur.execute(query)
                applications = cur.fetchall()
                
                # Конвертация datetime в строки
                for app in applications:
                    if app.get('submitted_at'):
                        app['submitted_at'] = app['submitted_at'].isoformat()
                
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
        
        elif method == 'PUT':
            # Обновление статуса заявки
            body = json.loads(event.get('body', '{}'))
            app_id = body.get('application_id')
            new_status = body.get('status')
            
            if not app_id or not new_status:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'application_id и status обязательны'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute(
                    "UPDATE applications SET status = %s WHERE id = %s",
                    (new_status, app_id)
                )
                
                if cur.rowcount == 0:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Статус обновлён'}),
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