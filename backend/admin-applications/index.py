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
                # Полный запрос с JOIN для получения всех данных
                query = '''
                    SELECT 
                        a.id, 
                        a.participant_id,
                        a.contest_id,
                        a.category,
                        a.experience,
                        a.achievements,
                        a.additional_info,
                        a.status,
                        a.submitted_at,
                        p.full_name,
                        p.email,
                        p.phone,
                        p.birth_date,
                        p.city,
                        c.title as contest_title
                    FROM applications a
                    JOIN participants p ON a.participant_id = p.id
                    JOIN contests c ON a.contest_id = c.id
                    WHERE 1=1
                '''
                
                if contest_filter:
                    query += f" AND a.contest_id = {int(contest_filter)}"
                
                if status_filter:
                    query += f" AND a.status = '{status_filter}'"
                
                query += ' ORDER BY a.submitted_at DESC'
                
                cur.execute(query)
                applications = cur.fetchall()
                
                # Конвертация datetime в строки
                for app in applications:
                    if app.get('submitted_at'):
                        app['submitted_at'] = app['submitted_at'].isoformat()
                    if app.get('birth_date'):
                        app['birth_date'] = app['birth_date'].isoformat()
                
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
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Получаем данные заявки
                cur.execute(
                    '''SELECT a.*, p.full_name, p.email, p.phone, p.birth_date, p.city
                       FROM applications a
                       JOIN participants p ON a.participant_id = p.id
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
                
                # Обновляем статус заявки
                cur.execute(
                    "UPDATE applications SET status = %s WHERE id = %s",
                    (new_status, app_id)
                )
                
                # Если заявка одобрена - обновляем участника для системы оценивания
                if new_status == 'approved':
                    from datetime import datetime
                    birth_date = application['birth_date']
                    age = datetime.now().year - birth_date.year
                    if datetime.now().month < birth_date.month or \
                       (datetime.now().month == birth_date.month and datetime.now().day < birth_date.day):
                        age -= 1
                    
                    # Обновляем участника: добавляем contest_id, age, category, performance_title, participation_format, nomination, status
                    cur.execute(
                        '''UPDATE participants 
                           SET contest_id = %s, age = %s, category = %s, performance_title = %s, 
                               participation_format = %s, nomination = %s, status = 'approved'
                           WHERE id = %s''',
                        (application['contest_id'], age, application['category'], 
                         application.get('performance_title', 'Не указано'),
                         application.get('participation_format', ''),
                         application.get('nomination', ''),
                         application['participant_id'])
                    )
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': True, 
                    'message': 'Статус обновлён' + (' и участник добавлен в систему оценивания' if new_status == 'approved' else '')
                }),
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