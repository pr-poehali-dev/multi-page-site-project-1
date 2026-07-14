import json
import os
import random
import string
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
import base64
import uuid
import boto3

SCHEMA = 't_p73771717_multi_page_site_proj'
CABINET_URL = 'https://индиго-арт.рф/participant-cabinet'
SUPPORT_EMAIL = 'indigo_fest@mail.ru'

STATUS_LABELS = {
    'approved': 'одобрена',
    'rejected': 'отклонена',
    'pending': 'снова на рассмотрении',
}


def send_status_update_email(to_email: str, full_name: str, contest_title: str, new_status: str) -> None:
    '''Отправляет участнику письмо об изменении статуса его заявки'''
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = os.environ.get('SMTP_PORT')
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not all([smtp_host, smtp_port, smtp_user, smtp_password, to_email]):
        return

    status_label = STATUS_LABELS.get(new_status, new_status)
    status_color = '#16a34a' if new_status == 'approved' else ('#dc2626' if new_status == 'rejected' else '#6d28d9')

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
    
    # Определение эндпоинта
    query_string_params = event.get('queryStringParameters') or {}
    endpoint = query_string_params.get('endpoint', '')
    path_params = event.get('pathParams') or {}
    
    try:
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
                        a.participation_format,
                        a.experience,
                        a.achievements,
                        a.additional_info,
                        a.custom_fields,
                        a.status,
                        a.submitted_at,
                        a.editing_locked,
                        p.full_name,
                        p.contact_position,
                        p.email,
                        p.phone,
                        p.vk_link,
                        p.city,
                        c.title as contest_title,
                        c.applications_locked
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
        
        elif endpoint != 'gallery' and method == 'PUT':
            # Обновление статуса заявки или заморозка/разморозка редактирования
            body = json.loads(event.get('body', '{}'))
            app_id = body.get('application_id')
            new_status = body.get('status')
            editing_locked = body.get('editing_locked')

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
                    '''SELECT a.*, p.full_name, p.contact_position, p.email, p.phone, p.vk_link, p.city, c.title as contest_title
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
                
                # Обновляем статус заявки
                cur.execute(
                    "UPDATE applications SET status = %s WHERE id = %s",
                    (new_status, app_id)
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
                              (contest_id, order_number, region, directing_party, participant_name, age, nomination, piece_title, duration, diploma_number, director_name, application_id, participation_format)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        ''', (
                            application['contest_id'],
                            next_num,
                            region,
                            directing_party,
                            participant_name,
                            age_category,
                            nomination,
                            piece_title,
                            duration,
                            diploma_number,
                            director_name,
                            app_id,
                            participation_format
                        ))
            
            try:
                send_status_update_email(application['email'], application['full_name'], application['contest_title'], new_status)
            except Exception as email_err:
                print(f'[EMAIL ERROR] {email_err}')
            
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