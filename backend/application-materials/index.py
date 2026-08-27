import json
import os
import base64
import boto3
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p73771717_multi_page_site_proj'


def get_db_connection():
    '''Создаёт подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)


def check_api_key(event: Dict[str, Any]) -> bool:
    '''Проверка ключа доступа для админских операций (X-Api-Key)'''
    expected = os.environ.get('ADMIN_API_KEY')
    if not expected:
        return True
    headers = event.get('headers') or {}
    token = headers.get('X-Api-Key') or headers.get('x-api-key')
    return token == expected


def cors_headers() -> Dict[str, str]:
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Api-Key',
        'Access-Control-Max-Age': '86400',
    }


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление медиаматериалами (фото/видео) с выступлений участников.
    Организатор загружает файлы по заявке, участник видит их в личном кабинете.
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': cors_headers(), 'body': '', 'isBase64Encoded': False}

    if not check_api_key(event):
        return {'statusCode': 401, 'headers': cors_headers(), 'body': json.dumps({'error': 'Требуется X-Api-Key'}), 'isBase64Encoded': False}

    params = event.get('queryStringParameters') or {}
    action = params.get('action')

    conn = get_db_connection()
    try:
        if method == 'GET' and action == 'applications':
            # Список заявок для выбора, куда прикрепить материалы (с фильтром по конкурсу/поиском по имени)
            contest_id = params.get('contest_id')
            search = (params.get('search') or '').strip()
            with conn.cursor() as cur:
                query = f'''
                    SELECT a.id, a.performance_title, a.status, c.id as contest_id, c.title as contest_title,
                           p.full_name,
                           (SELECT COUNT(*) FROM {SCHEMA}.application_files f WHERE f.application_id = a.id AND f.category = 'material') as materials_count
                    FROM {SCHEMA}.applications a
                    JOIN {SCHEMA}.contests c ON a.contest_id = c.id
                    JOIN {SCHEMA}.participants p ON a.participant_id = p.id
                    WHERE 1=1
                '''
                args = []
                if contest_id:
                    query += ' AND a.contest_id = %s'
                    args.append(contest_id)
                if search:
                    query += ' AND p.full_name ILIKE %s'
                    args.append(f'%{search}%')
                query += ' ORDER BY a.submitted_at DESC LIMIT 200'
                cur.execute(query, tuple(args))
                rows = [dict(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'applications': rows}), 'isBase64Encoded': False}

        if method == 'GET' and action == 'materials':
            application_id = params.get('application_id')
            if not application_id:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите application_id'}), 'isBase64Encoded': False}
            with conn.cursor() as cur:
                cur.execute(
                    f'''SELECT id, application_id, file_name, file_type, file_size, file_url, uploaded_at
                        FROM {SCHEMA}.application_files
                        WHERE application_id = %s AND category = 'material'
                        ORDER BY uploaded_at DESC''',
                    (application_id,)
                )
                rows = cur.fetchall()
                for r in rows:
                    if r.get('uploaded_at'): r['uploaded_at'] = r['uploaded_at'].isoformat()
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'materials': [dict(r) for r in rows]}), 'isBase64Encoded': False}

        if method == 'POST' and action == 'upload':
            body = json.loads(event.get('body') or '{}')
            application_id = body.get('applicationId')
            files = body.get('files') or []
            if not application_id:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите applicationId'}), 'isBase64Encoded': False}
            if not files:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Нет файлов для загрузки'}), 'isBase64Encoded': False}

            with conn.cursor() as cur:
                cur.execute(f'SELECT id FROM {SCHEMA}.applications WHERE id = %s', (application_id,))
                if not cur.fetchone():
                    return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Заявка не найдена'}), 'isBase64Encoded': False}

            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
            )

            uploaded = []
            with conn.cursor() as cur:
                for f in files:
                    file_name = f.get('fileName')
                    file_type = f.get('fileType') or 'application/octet-stream'
                    file_size = f.get('fileSize') or 0
                    file_data_b64 = f.get('fileData')
                    if not file_name or not file_data_b64:
                        continue
                    file_bytes = base64.b64decode(file_data_b64)
                    safe_name = file_name.replace(' ', '_')
                    s3_key = f'materials/{application_id}/{safe_name}'
                    s3.put_object(Bucket='files', Key=s3_key, Body=file_bytes, ContentType=file_type)
                    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
                    cur.execute(
                        f'''INSERT INTO {SCHEMA}.application_files (application_id, file_name, file_type, file_size, file_url, category)
                            VALUES (%s, %s, %s, %s, %s, 'material')
                            RETURNING id, application_id, file_name, file_type, file_size, file_url, uploaded_at''',
                        (application_id, file_name, file_type, file_size, cdn_url)
                    )
                    row = dict(cur.fetchone())
                    if row.get('uploaded_at'): row['uploaded_at'] = row['uploaded_at'].isoformat()
                    uploaded.append(row)
            conn.commit()
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'success': True, 'materials': uploaded}), 'isBase64Encoded': False}

        if method == 'DELETE':
            material_id = params.get('id')
            if not material_id:
                return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Укажите id'}), 'isBase64Encoded': False}
            with conn.cursor() as cur:
                cur.execute(f"DELETE FROM {SCHEMA}.application_files WHERE id = %s AND category = 'material'", (material_id,))
                deleted = cur.rowcount
            conn.commit()
            if not deleted:
                return {'statusCode': 404, 'headers': cors_headers(), 'body': json.dumps({'error': 'Материал не найден'}), 'isBase64Encoded': False}
            return {'statusCode': 200, 'headers': cors_headers(), 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        return {'statusCode': 400, 'headers': cors_headers(), 'body': json.dumps({'error': 'Неизвестное действие'}), 'isBase64Encoded': False}
    finally:
        conn.close()
