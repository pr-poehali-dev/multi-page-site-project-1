import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class ContestResult(BaseModel):
    contest_id: int = Field(..., gt=0)
    title: str = Field(..., min_length=1, max_length=500)
    description: str = Field(default='')
    pdf_url: str = Field(default='')
    published_date: str = Field(default='')

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление итогами конкурсов - CRUD операции
    GET: получить список итогов
    POST: создать итог
    PUT: обновить итог
    DELETE: удалить итог
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        if method == 'GET':
            # Получить список итогов (можно фильтровать по contest_id)
            query_params = event.get('queryStringParameters', {}) or {}
            contest_id = query_params.get('contest_id')
            
            if contest_id:
                with conn.cursor() as cur:
                    cur.execute('''
                        SELECT cr.*, c.title as contest_title, c.start_date, c.end_date
                        FROM contest_results cr
                        JOIN contests c ON cr.contest_id = c.id
                        WHERE cr.contest_id = %s
                        ORDER BY cr.published_date DESC
                    ''', (contest_id,))
                    results = cur.fetchall()
            else:
                with conn.cursor() as cur:
                    cur.execute('''
                        SELECT cr.*, c.title as contest_title, c.start_date, c.end_date
                        FROM contest_results cr
                        JOIN contests c ON cr.contest_id = c.id
                        ORDER BY cr.published_date DESC
                    ''')
                    results = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'results': [dict(r) for r in results]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            # Создать итог
            body_data = json.loads(event.get('body', '{}'))
            result_data = ContestResult(**body_data)
            
            published_date = result_data.published_date or datetime.now().isoformat()
            
            with conn.cursor() as cur:
                cur.execute('''
                    INSERT INTO contest_results (contest_id, title, description, pdf_url, published_date)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    result_data.contest_id,
                    result_data.title,
                    result_data.description,
                    result_data.pdf_url,
                    published_date
                ))
                result_id = cur.fetchone()['id']
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': result_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            # Обновить итог
            body_data = json.loads(event.get('body', '{}'))
            result_id = body_data.get('id')
            
            if not result_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Result ID is required'}),
                    'isBase64Encoded': False
                }
            
            result_data = ContestResult(**body_data)
            
            with conn.cursor() as cur:
                cur.execute('''
                    UPDATE contest_results
                    SET contest_id = %s, title = %s, description = %s, pdf_url = %s, 
                        published_date = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (
                    result_data.contest_id,
                    result_data.title,
                    result_data.description,
                    result_data.pdf_url,
                    result_data.published_date or datetime.now().isoformat(),
                    result_id
                ))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            # Удалить итог
            query_params = event.get('queryStringParameters', {}) or {}
            result_id = query_params.get('id')
            
            if not result_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Result ID is required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute('DELETE FROM contest_results WHERE id = %s', (result_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        conn.close()
