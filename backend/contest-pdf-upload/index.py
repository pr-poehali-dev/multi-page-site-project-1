import json
import os
import boto3
from botocore.config import Config
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Генерация presigned URL для прямой загрузки PDF в S3 из браузера
    POST / — принимает file_name, contest_id, возвращает upload_url и pdf_url
    '''
    method: str = event.get('httpMethod', 'POST')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }

    body = json.loads(event.get('body', '{}') or '{}')
    file_name = body.get('file_name')
    contest_id = body.get('contest_id')

    if not file_name or not contest_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'file_name и contest_id обязательны'}),
            'isBase64Encoded': False
        }

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3')
    )

    s3_key = f'contests/pdf/{contest_id}_{file_name}'

    upload_url = s3.generate_presigned_url(
        'put_object',
        Params={'Bucket': 'files', 'Key': s3_key},
        ExpiresIn=600
    )

    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{s3_key}"

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'upload_url': upload_url, 'pdf_url': cdn_url}),
        'isBase64Encoded': False
    }