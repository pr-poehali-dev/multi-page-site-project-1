import json
import os
import re
import base64
import boto3
import requests
from typing import Dict, Any
from pydantic import BaseModel, Field
from typing import List
import psycopg2
from psycopg2.extras import RealDictCursor

class FileUpload(BaseModel):
    fileName: str = Field(..., min_length=1)
    fileType: str = Field(..., min_length=1)
    fileSize: int = Field(..., gt=0)
    fileData: str = Field(..., min_length=1)

class UploadRequest(BaseModel):
    applicationId: int = Field(default=0, ge=0)
    files: List[FileUpload] = Field(default_factory=list, max_items=10)
    target: str = Field(default='s3')
    contestTitle: str = Field(default='')
    step: str = Field(default='')
    fileName: str = Field(default='')
    path: str = Field(default='')

YANDEX_API = 'https://cloud-api.yandex.net/v1/disk'
YANDEX_ROOT_FOLDER = 'Фонограммы конкурсов'

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def _sanitize_path_part(name: str) -> str:
    '''Убирает недопустимые для пути на Яндекс.Диске символы'''
    name = re.sub(r'[\\/:*?"<>|]', '_', name).strip()
    return name or 'Без названия'

def _yandex_ensure_folder(token: str, path: str) -> None:
    '''Рекурсивно создаёт папку на Яндекс.Диске, если её ещё нет'''
    headers = {'Authorization': f'OAuth {token}'}
    parts = [p for p in path.split('/') if p]
    current = ''
    for part in parts:
        current = f'{current}/{part}' if current else part
        resp = requests.put(f'{YANDEX_API}/resources', headers=headers, params={'path': current}, timeout=15)
        if resp.status_code not in (201, 409):
            raise Exception(f'Не удалось создать папку "{current}" на Яндекс.Диске: {resp.text}')

def yandex_get_upload_url(contest_title: str, file_name: str) -> Dict[str, str]:
    '''Создаёт папку конкурса и возвращает временную ссылку для прямой загрузки файла на Яндекс.Диск'''
    token = os.environ.get('YANDEX_DISK_TOKEN')
    if not token:
        raise Exception('YANDEX_DISK_TOKEN не настроен')

    safe_contest = _sanitize_path_part(contest_title or 'Без названия конкурса')
    safe_file = _sanitize_path_part(file_name)
    folder_path = f'{YANDEX_ROOT_FOLDER}/{safe_contest}'
    file_path = f'{folder_path}/{safe_file}'
    headers = {'Authorization': f'OAuth {token}'}

    _yandex_ensure_folder(token, folder_path)

    upload_url_resp = requests.get(
        f'{YANDEX_API}/resources/upload', headers=headers,
        params={'path': file_path, 'overwrite': 'true'}, timeout=15
    )
    if upload_url_resp.status_code != 200:
        raise Exception(f'Не удалось получить ссылку для загрузки: {upload_url_resp.text}')

    return {'uploadUrl': upload_url_resp.json().get('href'), 'path': file_path}

def yandex_finalize(path: str) -> str:
    '''Публикует загруженный файл на Яндекс.Диске и возвращает публичную ссылку'''
    token = os.environ.get('YANDEX_DISK_TOKEN')
    if not token:
        raise Exception('YANDEX_DISK_TOKEN не настроен')
    headers = {'Authorization': f'OAuth {token}'}

    publish_resp = requests.put(
        f'{YANDEX_API}/resources/publish', headers=headers, params={'path': path}, timeout=15
    )
    if publish_resp.status_code != 200:
        raise Exception(f'Не удалось опубликовать файл: {publish_resp.text}')

    meta_resp = requests.get(
        f'{YANDEX_API}/resources', headers=headers,
        params={'path': path, 'fields': 'public_url'}, timeout=15
    )
    if meta_resp.status_code != 200:
        raise Exception(f'Не удалось получить публичную ссылку: {meta_resp.text}')

    return meta_resp.json().get('public_url')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Загружает файлы работ участников в S3 и сохраняет ссылки в базу
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Parse request
    body_data = json.loads(event.get('body', '{}'))
    upload_req = UploadRequest(**body_data)

    # Загрузка фонограмм на Яндекс.Диск: файл загружается браузером НАПРЯМУЮ по временной ссылке,
    # минуя наш сервер, поэтому размер файла не ограничен нашей функцией.
    if upload_req.target == 'yandex':
        try:
            if upload_req.step == 'finalize':
                if not upload_req.path:
                    raise Exception('path обязателен для finalize')
                public_url = yandex_finalize(upload_req.path)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'fileUrl': public_url}),
                    'isBase64Encoded': False
                }
            else:
                if not upload_req.fileName:
                    raise Exception('fileName обязателен')
                result = yandex_get_upload_url(upload_req.contestTitle, upload_req.fileName)
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'uploadUrl': result['uploadUrl'], 'path': result['path']}),
                    'isBase64Encoded': False
                }
        except Exception as e:
            return {
                'statusCode': 502,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Ошибка загрузки на Яндекс.Диск: {str(e)}'}),
                'isBase64Encoded': False
            }

    # Initialize S3 client
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    uploaded_files = []
    
    try:
        # Verify application exists only if applicationId is provided
        if upload_req.applicationId > 0:
            conn = get_db_connection()
            with conn.cursor() as cur:
                cur.execute('SELECT id FROM applications WHERE id = %s', (upload_req.applicationId,))
                if not cur.fetchone():
                    conn.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Application not found'}),
                        'isBase64Encoded': False
                    }
        else:
            conn = None
        
        # Upload each file
        for file_upload in upload_req.files:
            # Decode base64 file data
            file_data = base64.b64decode(file_upload.fileData)
            
            # Generate S3 key
            safe_filename = file_upload.fileName.replace(' ', '_')
            if upload_req.applicationId > 0:
                s3_key = f'applications/{upload_req.applicationId}/{safe_filename}'
            else:
                s3_key = f'uploads/{safe_filename}'
            
            # Upload to S3
            s3.put_object(
                Bucket='files',
                Key=s3_key,
                Body=file_data,
                ContentType=file_upload.fileType
            )
            
            # Generate CDN URL
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
            
            # Save to database only if applicationId is provided
            if conn and upload_req.applicationId > 0:
                with conn.cursor() as cur:
                    cur.execute(
                        '''
                        INSERT INTO application_files (application_id, file_name, file_type, file_size, file_url)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                        ''',
                        (upload_req.applicationId, file_upload.fileName, file_upload.fileType, file_upload.fileSize, cdn_url)
                    )
                    file_id = cur.fetchone()['id']
            else:
                file_id = 0
            
            uploaded_files.append({
                'id': file_id,
                'fileName': file_upload.fileName,
                'fileUrl': cdn_url
            })
        
        if conn:
            conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'files': uploaded_files}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Upload failed: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()