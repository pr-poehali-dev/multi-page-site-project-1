import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для работы с заявками участников конкурсов
    Методы: POST - создание заявки, GET - получение заявки по email
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        if method == 'POST':
            # Создание новой заявки
            body_data = json.loads(event.get('body', '{}'))
            
            # Извлекаем данные
            full_name = body_data.get('fullName')
            email = body_data.get('email')
            phone = body_data.get('phone')
            birth_date = body_data.get('birthDate')
            city = body_data.get('city')
            contest_input = body_data.get('contestId')
            category = body_data.get('category')
            experience = body_data.get('experience', '')
            achievements = body_data.get('achievements', '')
            additional_info = body_data.get('additionalInfo', '')
            files_count = body_data.get('filesCount', 0)
            
            with conn.cursor() as cur:
                # Проверяем/создаем участника
                cur.execute(
                    '''
                    INSERT INTO participants (full_name, email, phone, birth_date, city)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (email) 
                    DO UPDATE SET 
                        full_name = EXCLUDED.full_name,
                        phone = EXCLUDED.phone,
                        birth_date = EXCLUDED.birth_date,
                        city = EXCLUDED.city
                    RETURNING id
                    ''',
                    (full_name, email, phone, birth_date, city)
                )
                participant_id = cur.fetchone()['id']
                
                # Получаем ID конкурса (поддержка и числового ID, и строкового ключа)
                contest_id = None
                
                # Пробуем как числовой ID
                try:
                    contest_id = int(contest_input)
                    cur.execute('SELECT id FROM contests WHERE id = %s', (contest_id,))
                    if not cur.fetchone():
                        contest_id = None
                except (ValueError, TypeError):
                    pass
                
                # Если не числовой, пробуем как ключ
                if contest_id is None:
                    cur.execute('SELECT id FROM contests WHERE contest_key = %s', (contest_input,))
                    contest_row = cur.fetchone()
                    if contest_row:
                        contest_id = contest_row['id']
                
                if contest_id is None:
                    conn.rollback()
                    return {
                        'statusCode': 404,
                        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Contest not found'}),
                        'isBase64Encoded': False
                    }
                
                # Создаем заявку
                cur.execute(
                    '''
                    INSERT INTO applications 
                    (participant_id, contest_id, category, experience, achievements, additional_info, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                    ON CONFLICT (participant_id, contest_id)
                    DO UPDATE SET
                        category = EXCLUDED.category,
                        experience = EXCLUDED.experience,
                        achievements = EXCLUDED.achievements,
                        additional_info = EXCLUDED.additional_info,
                        submitted_at = CURRENT_TIMESTAMP
                    RETURNING id, submitted_at, status
                    ''',
                    (participant_id, contest_id, category, experience, achievements, additional_info)
                )
                application = cur.fetchone()
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': True,
                        'applicationId': application['id'],
                        'status': application['status'],
                        'submittedAt': application['submitted_at'].isoformat(),
                        'message': 'Заявка успешно отправлена!'
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'GET':
            # Получение данных заявки по email
            params = event.get('queryStringParameters', {})
            email = params.get('email')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Email parameter required'}),
                    'isBase64Encoded': False
                }
            
            with conn.cursor() as cur:
                cur.execute(
                    '''
                    SELECT 
                        p.full_name, p.email, p.phone, p.birth_date, p.city,
                        a.id as application_id, a.category, a.experience, 
                        a.achievements, a.additional_info, a.status, a.submitted_at,
                        c.contest_key, c.title as contest_title
                    FROM participants p
                    JOIN applications a ON p.id = a.participant_id
                    JOIN contests c ON a.contest_id = c.id
                    WHERE p.email = %s
                    ORDER BY a.submitted_at DESC
                    LIMIT 1
                    ''',
                    (email,)
                )
                result = cur.fetchone()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Application not found'}),
                        'isBase64Encoded': False
                    }
                
                # Получаем файлы
                cur.execute(
                    'SELECT file_name, file_type, file_size FROM application_files WHERE application_id = %s',
                    (result['application_id'],)
                )
                files = cur.fetchall()
                
                response_data = {
                    'fullName': result['full_name'],
                    'email': result['email'],
                    'phone': result['phone'],
                    'birthDate': result['birth_date'].isoformat() if result['birth_date'] else None,
                    'city': result['city'],
                    'contestId': result['contest_key'],
                    'contestTitle': result['contest_title'],
                    'category': result['category'],
                    'experience': result['experience'] or '',
                    'achievements': result['achievements'] or '',
                    'additionalInfo': result['additional_info'] or '',
                    'status': result['status'],
                    'submittedAt': result['submitted_at'].isoformat(),
                    'files': [{'name': f['file_name'], 'type': f['file_type'], 'size': f['file_size']} for f in files]
                }
                
                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps(response_data),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()