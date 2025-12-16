import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление составом жюри: получение, создание, обновление и удаление
    GET - получить всех членов жюри
    POST - создать нового члена жюри
    PUT - обновить данные члена жюри
    DELETE - удалить члена жюри
    '''
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
    
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            cur.execute('''
                SELECT id, name, role, specialty, bio, image_url, sort_order
                FROM jury_members
                ORDER BY sort_order ASC, id ASC
            ''')
            rows = cur.fetchall()
            jury_members = []
            for row in rows:
                jury_members.append({
                    'id': row[0],
                    'name': row[1],
                    'role': row[2],
                    'specialty': row[3],
                    'bio': row[4],
                    'image_url': row[5],
                    'sort_order': row[6]
                })
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'jury_members': jury_members}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            cur.execute('''
                INSERT INTO jury_members (name, role, specialty, bio, image_url, sort_order)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING id
            ''', (
                body['name'],
                body['role'],
                body['specialty'],
                body['bio'],
                body.get('image_url'),
                body.get('sort_order', 0)
            ))
            new_id = cur.fetchone()[0]
            conn.commit()
            
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'id': new_id, 'message': 'Член жюри создан'}),
                'isBase64Encoded': False
            }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            cur.execute('''
                UPDATE jury_members
                SET name = %s, role = %s, specialty = %s, bio = %s, 
                    image_url = %s, sort_order = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
            ''', (
                body['name'],
                body['role'],
                body['specialty'],
                body['bio'],
                body.get('image_url'),
                body.get('sort_order', 0),
                body['id']
            ))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Член жюри обновлен'}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            jury_id = params.get('id')
            
            cur.execute('DELETE FROM jury_members WHERE id = %s', (jury_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'message': 'Член жюри удален'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
