import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from pydantic import BaseModel, Field

class Partner(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    logo_url: str = Field(..., min_length=1)
    website_url: str = Field(default='')
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление партнёрами и спонсорами - CRUD операции
    GET: получить список партнёров
    POST: создать партнёра
    PUT: обновить партнёра
    DELETE: удалить партнёра
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
            # Получить список партнёров
            query_params = event.get('queryStringParameters', {}) or {}
            only_active = query_params.get('active', 'true').lower() == 'true'
            
            if only_active:
                with conn.cursor() as cur:
                    cur.execute('''
                        SELECT * FROM partners
                        WHERE is_active = true
                        ORDER BY display_order ASC, name ASC
                    ''')
                    partners = cur.fetchall()
            else:
                with conn.cursor() as cur:
                    cur.execute('''
                        SELECT * FROM partners
                        ORDER BY display_order ASC, name ASC
                    ''')
                    partners = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'partners': [dict(p) for p in partners]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            # Создать партнёра
            body_data = json.loads(event.get('body', '{}'))
            partner_data = Partner(**body_data)
            
            with conn.cursor() as cur:
                cur.execute('''
                    INSERT INTO partners (name, logo_url, website_url, display_order, is_active)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id
                ''', (
                    partner_data.name,
                    partner_data.logo_url,
                    partner_data.website_url,
                    partner_data.display_order,
                    partner_data.is_active
                ))
                partner_id = cur.fetchone()['id']
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'id': partner_id}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            # Обновить партнёра
            body_data = json.loads(event.get('body', '{}'))
            partner_id = body_data.get('id')
            
            if not partner_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Partner ID is required'}),
                    'isBase64Encoded': False
                }
            
            partner_data = Partner(**body_data)
            
            with conn.cursor() as cur:
                cur.execute('''
                    UPDATE partners
                    SET name = %s, logo_url = %s, website_url = %s, 
                        display_order = %s, is_active = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                ''', (
                    partner_data.name,
                    partner_data.logo_url,
                    partner_data.website_url,
                    partner_data.display_order,
                    partner_data.is_active,
                    partner_id
                ))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            # Удалить партнёра
            query_params = event.get('queryStringParameters', {}) or {}
            partner_id = query_params.get('id')
            
            if not partner_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Partner ID is required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute('DELETE FROM partners WHERE id = %s', (partner_id,))
            
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
