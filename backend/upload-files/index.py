import json
import os
import base64
import boto3
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
    applicationId: int = Field(..., gt=0)
    files: List[FileUpload] = Field(..., min_items=1, max_items=10)

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

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
    
    # Initialize S3 client
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    conn = get_db_connection()
    uploaded_files = []
    
    try:
        # Verify application exists
        with conn.cursor() as cur:
            cur.execute('SELECT id FROM applications WHERE id = %s', (upload_req.applicationId,))
            if not cur.fetchone():
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Application not found'}),
                    'isBase64Encoded': False
                }
        
        # Upload each file
        for file_upload in upload_req.files:
            # Decode base64 file data
            file_data = base64.b64decode(file_upload.fileData)
            
            # Generate S3 key
            safe_filename = file_upload.fileName.replace(' ', '_')
            s3_key = f'applications/{upload_req.applicationId}/{safe_filename}'
            
            # Upload to S3
            s3.put_object(
                Bucket='files',
                Key=s3_key,
                Body=file_data,
                ContentType=file_upload.fileType
            )
            
            # Generate CDN URL
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"
            
            # Save to database
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
            
            uploaded_files.append({
                'id': file_id,
                'fileName': file_upload.fileName,
                'fileUrl': cdn_url
            })
        
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'success': True, 'files': uploaded_files}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Upload failed: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
