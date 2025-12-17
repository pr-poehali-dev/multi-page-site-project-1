"""
Backend функция для управления концертами
Методы: GET (получить все концерты), POST (создать), PUT (обновить), DELETE (удалить)
"""
import json
import os
import psycopg2
from typing import Dict, Any, Optional
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            return get_concerts(conn)
        elif method == 'POST':
            return create_concert(conn, event)
        elif method == 'PUT':
            return update_concert(conn, event)
        elif method == 'DELETE':
            return delete_concert(conn, event)
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    finally:
        conn.close()

def get_concerts(conn) -> Dict[str, Any]:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT id, title, description, poster_url, ticket_link, details_link, 
                   location, event_date, status, created_at, updated_at
            FROM concerts
            ORDER BY event_date DESC
        """)
        
        concerts = []
        for row in cur.fetchall():
            concert = {
                'id': row[0],
                'title': row[1],
                'description': row[2],
                'poster_url': row[3],
                'ticket_link': row[4],
                'details_link': row[5],
                'location': row[6],
                'event_date': row[7].isoformat() if row[7] else None,
                'status': row[8],
                'created_at': row[9].isoformat() if row[9] else None,
                'updated_at': row[10].isoformat() if row[10] else None
            }
            concerts.append(concert)
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'concerts': concerts}),
            'isBase64Encoded': False
        }

def create_concert(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    body = json.loads(event.get('body', '{}'))
    
    title = body.get('title')
    description = body.get('description', '')
    poster_url = body.get('poster_url')
    ticket_link = body.get('ticket_link')
    details_link = body.get('details_link')
    location = body.get('location')
    event_date = body.get('event_date')
    status = body.get('status', 'upcoming')
    
    if not title:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Title is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor() as cur:
        cur.execute("""
            INSERT INTO concerts (title, description, poster_url, ticket_link, details_link, location, event_date, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (title, description, poster_url, ticket_link, details_link, location, event_date, status))
        
        concert_id = cur.fetchone()[0]
        conn.commit()
        
        return {
            'statusCode': 201,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'id': concert_id, 'message': 'Концерт создан'}),
            'isBase64Encoded': False
        }

def update_concert(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    query_params = event.get('queryStringParameters') or {}
    concert_id = query_params.get('id')
    
    if not concert_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Concert ID is required'}),
            'isBase64Encoded': False
        }
    
    body = json.loads(event.get('body', '{}'))
    
    fields = []
    values = []
    
    if 'title' in body:
        fields.append('title = %s')
        values.append(body['title'])
    if 'description' in body:
        fields.append('description = %s')
        values.append(body['description'])
    if 'poster_url' in body:
        fields.append('poster_url = %s')
        values.append(body['poster_url'])
    if 'ticket_link' in body:
        fields.append('ticket_link = %s')
        values.append(body['ticket_link'])
    if 'details_link' in body:
        fields.append('details_link = %s')
        values.append(body['details_link'])
    if 'location' in body:
        fields.append('location = %s')
        values.append(body['location'])
    if 'event_date' in body:
        fields.append('event_date = %s')
        values.append(body['event_date'])
    if 'status' in body:
        fields.append('status = %s')
        values.append(body['status'])
    
    fields.append('updated_at = CURRENT_TIMESTAMP')
    values.append(concert_id)
    
    with conn.cursor() as cur:
        query = f"UPDATE concerts SET {', '.join(fields)} WHERE id = %s"
        cur.execute(query, values)
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'message': 'Концерт обновлён'}),
            'isBase64Encoded': False
        }

def delete_concert(conn, event: Dict[str, Any]) -> Dict[str, Any]:
    query_params = event.get('queryStringParameters') or {}
    concert_id = query_params.get('id')
    
    if not concert_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Concert ID is required'}),
            'isBase64Encoded': False
        }
    
    with conn.cursor() as cur:
        cur.execute('DELETE FROM concerts WHERE id = %s', (concert_id,))
        conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'message': 'Концерт удалён'}),
            'isBase64Encoded': False
        }
