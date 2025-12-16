import json
import os
import psycopg2
import hashlib
import secrets
from typing import Dict, Any
from datetime import datetime, timedelta

def verify_jury_token(token: str, conn) -> int:
    '''Проверка токена жюри и возврат ID члена жюри'''
    cur = conn.cursor()
    cur.execute(
        '''SELECT jury_member_id FROM jury_sessions 
           WHERE session_token = %s AND expires_at > NOW()''',
        (token,)
    )
    result = cur.fetchone()
    cur.close()
    
    if not result:
        raise ValueError('Недействительный или истекший токен')
    
    return result[0]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для авторизации жюри и выставления оценок конкурсантам
    POST /login - авторизация (login, password)
    GET /verify - проверка токена (X-Jury-Token)
    GET /scores?contest_id=N - список участников с оценками
    POST /scores - сохранение оценки (participant_id, contest_id, score, comment)
    '''
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Jury-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    
    try:
        # LOGIN endpoint - не требует токена
        if action == 'login' and method == 'POST':
            body = json.loads(event.get('body', '{}'))
            login = body.get('login', '').strip()
            password = body.get('password', '').strip()
            
            if not login or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Логин и пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hashlib.sha256(password.encode()).hexdigest()
            
            cur = conn.cursor()
            cur.execute(
                "SELECT id, name FROM jury_members WHERE login = %s AND password_hash = %s",
                (login, password_hash)
            )
            jury = cur.fetchone()
            
            if not jury:
                cur.close()
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный логин или пароль'}),
                    'isBase64Encoded': False
                }
            
            jury_id, jury_name = jury
            
            session_token = secrets.token_urlsafe(32)
            expires_at = datetime.now() + timedelta(days=7)
            
            cur.execute(
                "INSERT INTO jury_sessions (jury_member_id, session_token, expires_at) VALUES (%s, %s, %s)",
                (jury_id, session_token, expires_at)
            )
            conn.commit()
            cur.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'token': session_token,
                    'jury_id': jury_id,
                    'name': jury_name,
                    'expires_at': expires_at.isoformat()
                }),
                'isBase64Encoded': False
            }
        
        # VERIFY endpoint - проверка токена
        if action == 'verify' and method == 'GET':
            token = event.get('headers', {}).get('X-Jury-Token') or event.get('headers', {}).get('x-jury-token')
            
            if not token:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен не предоставлен'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor()
            cur.execute(
                '''SELECT js.jury_member_id, jm.name, js.expires_at 
                   FROM jury_sessions js
                   JOIN jury_members jm ON js.jury_member_id = jm.id
                   WHERE js.session_token = %s AND js.expires_at > NOW()''',
                (token,)
            )
            session = cur.fetchone()
            cur.close()
            
            if not session:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недействительный или истекший токен'}),
                    'isBase64Encoded': False
                }
            
            jury_id, jury_name, expires_at = session
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'jury_id': jury_id,
                    'name': jury_name,
                    'expires_at': expires_at.isoformat()
                }),
                'isBase64Encoded': False
            }
        
        # SCORES endpoint - получение списка участников
        if method == 'GET' and action == 'scores':
            # Проверка токена - опционально для админа
            token = event.get('headers', {}).get('X-Jury-Token') or event.get('headers', {}).get('x-jury-token')
            jury_id = None
            
            if token:
                try:
                    jury_id = verify_jury_token(token, conn)
                except ValueError:
                    pass
            contest_id = params.get('contest_id')
            
            if not contest_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется contest_id'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor()
            
            # Если есть токен - это запрос жюри (свои оценки)
            if token:
                cur.execute(
                    '''SELECT p.id, p.full_name, p.age, p.category, p.performance_title,
                              p.participation_format, p.nomination,
                              ps.score, ps.comment, ps.id as score_id
                       FROM participants p
                       LEFT JOIN participant_scores ps ON p.id = ps.participant_id AND ps.jury_member_id = %s
                       WHERE p.contest_id = %s AND p.status = 'approved'
                       ORDER BY p.id''',
                    (jury_id, contest_id)
                )
                
                participants = []
                for row in cur.fetchall():
                    participants.append({
                        'id': row[0],
                        'full_name': row[1],
                        'age': row[2],
                        'category': row[3],
                        'performance_title': row[4],
                        'participation_format': row[5],
                        'nomination': row[6],
                        'score': float(row[7]) if row[7] else None,
                        'comment': row[8],
                        'score_id': row[9]
                    })
                
                cur.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'participants': participants}),
                    'isBase64Encoded': False
                }
            
            # Если токена нет - это запрос админа (все оценки с агрегацией)
            cur.execute(
                '''SELECT p.id, p.full_name, p.age, p.category
                   FROM participants p
                   WHERE p.contest_id = %s AND p.status = 'approved'
                   ORDER BY p.id''',
                (contest_id,)
            )
            
            participants = []
            for row in cur.fetchall():
                participant_id = row[0]
                
                # Получаем все оценки для этого участника
                cur.execute(
                    '''SELECT jm.name, ps.score, ps.comment
                       FROM participant_scores ps
                       JOIN jury_members jm ON ps.jury_member_id = jm.id
                       WHERE ps.participant_id = %s
                       ORDER BY jm.name''',
                    (participant_id,)
                )
                
                jury_scores = []
                total_score = 0
                count = 0
                
                for score_row in cur.fetchall():
                    score_val = float(score_row[1])
                    jury_scores.append({
                        'jury_name': score_row[0],
                        'score': score_val,
                        'comment': score_row[2]
                    })
                    total_score += score_val
                    count += 1
                
                avg_score = total_score / count if count > 0 else None
                
                participants.append({
                    'id': participant_id,
                    'name': row[1],
                    'age': row[2],
                    'nomination': row[3],
                    'avg_score': avg_score,
                    'scores_count': count,
                    'jury_scores': jury_scores
                })
            
            cur.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'participants': participants}),
                'isBase64Encoded': False
            }
        
        # Для POST/PUT требуется токен
        token = event.get('headers', {}).get('X-Jury-Token') or event.get('headers', {}).get('x-jury-token')
        
        if not token:
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        jury_id = verify_jury_token(token, conn)
        
        # SCORES endpoint - сохранение оценки
        if (method == 'POST' or method == 'PUT') and action != 'login':
            body = json.loads(event.get('body', '{}'))
            participant_id = body.get('participant_id')
            contest_id = body.get('contest_id')
            score = body.get('score')
            comment = body.get('comment', '').strip()
            
            if not participant_id or not contest_id or score is None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуются: participant_id, contest_id, score'}),
                    'isBase64Encoded': False
                }
            
            try:
                score = float(score)
                if score < 0 or score > 10:
                    raise ValueError('Оценка должна быть от 0 до 10')
            except ValueError as e:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': str(e)}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor()
            
            cur.execute(
                '''INSERT INTO participant_scores (participant_id, jury_member_id, contest_id, score, comment, updated_at)
                   VALUES (%s, %s, %s, %s, %s, NOW())
                   ON CONFLICT (participant_id, jury_member_id)
                   DO UPDATE SET score = EXCLUDED.score, comment = EXCLUDED.comment, updated_at = NOW()
                   RETURNING id''',
                (participant_id, jury_id, contest_id, score, comment)
            )
            
            score_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'score_id': score_id,
                    'message': 'Оценка сохранена'
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except ValueError as e:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        conn.close()