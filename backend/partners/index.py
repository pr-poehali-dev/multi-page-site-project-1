import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any
from datetime import datetime, date
from pydantic import BaseModel, Field

class Partner(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    logo_url: str = Field(..., min_length=1)
    website_url: str = Field(default='')
    display_order: int = Field(default=0)
    is_active: bool = Field(default=True)

SCHEMA = 't_p73771717_multi_page_site_proj'


def json_serial(obj):
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError(f'Object of type {type(obj)} is not JSON serializable')


def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)


def handle_reviews(event: Dict[str, Any], conn) -> Dict[str, Any]:
    """
    Отзывы участников конкурсов.
    GET  /?entity=reviews&action=public           — список опубликованных отзывов (для сайта)
    GET  /?entity=reviews&action=all               — список всех отзывов (для админки)
    POST /?entity=reviews                          — создать отзыв (на модерации) { full_name, team_name, text }
    PUT  /?entity=reviews&id=X&action=publish      — опубликовать отзыв
    PUT  /?entity=reviews&id=X&action=unpublish    — снять с публикации
    DELETE /?entity=reviews&id=X                   — удалить отзыв
    """
    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    CORS = {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}

    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if method == 'GET' and action == 'public':
            cur.execute(f'''
                SELECT id, full_name, team_name, text, created_at
                FROM {SCHEMA}.reviews
                WHERE is_published = TRUE
                ORDER BY created_at DESC
            ''')
            rows = [dict(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'reviews': rows}, default=json_serial)}

        if method == 'GET':
            cur.execute(f'SELECT * FROM {SCHEMA}.reviews ORDER BY created_at DESC')
            rows = [dict(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'reviews': rows}, default=json_serial)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            full_name = (body.get('full_name') or '').strip()
            team_name = (body.get('team_name') or '').strip()
            text = (body.get('text') or '').strip()

            if not full_name or not text:
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': 'full_name и text обязательны'})}

            cur.execute(f'''
                INSERT INTO {SCHEMA}.reviews (full_name, team_name, text, is_published)
                VALUES (%s, %s, %s, FALSE) RETURNING *
            ''', (full_name[:255], team_name[:255], text[:3000]))
            review = dict(cur.fetchone())
            conn.commit()
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'review': review}, default=json_serial)}

        if method == 'PUT':
            review_id = params.get('id')
            if not review_id:
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': 'id required'})}
            is_published = action == 'publish'
            cur.execute(f'''
                UPDATE {SCHEMA}.reviews SET is_published = %s
                WHERE id = %s RETURNING *
            ''', (is_published, review_id))
            review = cur.fetchone()
            conn.commit()
            if not review:
                return {'statusCode': 404, 'headers': CORS,
                        'body': json.dumps({'error': 'not found'})}
            return {'statusCode': 200, 'headers': CORS,
                    'body': json.dumps({'review': dict(review)}, default=json_serial)}

        if method == 'DELETE':
            review_id = params.get('id')
            if not review_id:
                return {'statusCode': 400, 'headers': CORS,
                        'body': json.dumps({'error': 'id required'})}
            cur.execute(f'DELETE FROM {SCHEMA}.reviews WHERE id = %s', (review_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Unknown action'})}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление партнёрами/спонсорами и отзывами - CRUD операции
    GET: получить список партнёров (или отзывов при entity=reviews)
    POST: создать партнёра (или отзыв при entity=reviews)
    PUT: обновить партнёра (или отзыв при entity=reviews)
    DELETE: удалить партнёра (или отзыв при entity=reviews)
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

    query_params_pre = event.get('queryStringParameters') or {}
    if query_params_pre.get('entity') == 'reviews':
        try:
            return handle_reviews(event, conn)
        finally:
            conn.close()
    
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