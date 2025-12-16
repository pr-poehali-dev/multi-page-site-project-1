import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Авторизация участников и получение их заявок
    GET ?email=xxx - получить заявки участника по email
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
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
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            email = params.get('email')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    '''
                    SELECT 
                        p.id,
                        p.full_name,
                        p.email,
                        p.phone,
                        p.birth_date,
                        p.city
                    FROM participants p
                    WHERE p.email = %s
                    ''',
                    (email,)
                )
                participant = cur.fetchone()
                
                if not participant:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Участник не найден'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    '''
                    SELECT 
                        a.id,
                        a.contest_id,
                        a.category,
                        a.performance_title,
                        a.participation_format,
                        a.nomination,
                        a.experience,
                        a.achievements,
                        a.additional_info,
                        a.status,
                        a.submitted_at,
                        c.title as contest_title,
                        c.start_date,
                        c.end_date,
                        c.status as contest_status
                    FROM applications a
                    JOIN contests c ON a.contest_id = c.id
                    WHERE a.participant_id = %s
                    ORDER BY a.submitted_at DESC
                    ''',
                    (participant['id'],)
                )
                applications = cur.fetchall()
                
                for app in applications:
                    if app.get('submitted_at'):
                        app['submitted_at'] = app['submitted_at'].isoformat()
                    if app.get('start_date'):
                        app['start_date'] = app['start_date'].isoformat()
                    if app.get('end_date'):
                        app['end_date'] = app['end_date'].isoformat()
                
                if participant.get('birth_date'):
                    participant['birth_date'] = participant['birth_date'].isoformat()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'participant': participant,
                        'applications': applications
                    }),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Метод не поддерживается'}),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()
