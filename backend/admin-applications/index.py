import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import base64
import uuid
import boto3


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Админ API для заявок и галереи
    GET /applications - получить все заявки с фильтрацией
    PUT /applications - обновить статус заявки
    GET /gallery - получить элементы галереи
    POST /gallery - создать элемент галереи (загрузка файла)
    PUT /gallery/{id} - обновить элемент галереи
    DELETE /gallery/{id} - удалить элемент галереи
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
    dsn = os.environ.get('DATABASE_URL_RW')
    if not dsn:
        dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    conn.autocommit = True
    
    # Определение эндпоинта
    path = event.get('path', '')
    path_params = event.get('pathParams') or {}
    
    try:
        # === GALLERY ENDPOINTS ===
        if 'gallery' in path:
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
                item_id = path_params.get('id')
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
                item_id = path_params.get('id')
                
                if not item_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'ID обязателен'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor() as cur:
                    cur.execute('UPDATE gallery_items SET updated_at = CURRENT_TIMESTAMP WHERE id = %s', (item_id,))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'message': 'Элемент удален'}),
                    'isBase64Encoded': False
                }
        
        # === APPLICATIONS ENDPOINTS ===
        if 'gallery' not in path and method == 'GET':
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
        
        elif 'gallery' not in path and method == 'PUT':
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