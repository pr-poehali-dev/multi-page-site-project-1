import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получение списка всех конкурсов
    GET / - получить все конкурсы
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
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
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    # Подключение к БД
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('''
                SELECT 
                    id,
                    title,
                    description,
                    start_date,
                    end_date,
                    status
                FROM contests
                WHERE status IS NOT NULL
                ORDER BY start_date
            ''')
            
            contests = cur.fetchall()
            
            # Конвертация дат в строки
            for contest in contests:
                if contest.get('start_date'):
                    contest['start_date'] = contest['start_date'].isoformat()
                if contest.get('end_date'):
                    contest['end_date'] = contest['end_date'].isoformat()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'contests': contests,
                    'total': len(contests)
                }),
                'isBase64Encoded': False
            }
    
    finally:
        conn.close()
