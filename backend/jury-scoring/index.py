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
    DELETE /delete_participant?participant_id=N - удаление участника и всех его оценок
    '''
    method: str = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
            
            print(f'[DEBUG] contest_id: {contest_id}, token present: {bool(token)}')
            
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
                '''SELECT p.id, p.full_name, p.age, p.category, p.nomination
                   FROM participants p
                   WHERE p.contest_id = %s AND p.status = 'approved'
                   ORDER BY p.id''',
                (contest_id,)
            )
            
            rows = cur.fetchall()
            print(f'[DEBUG] Found {len(rows)} approved participants for contest {contest_id}')
            
            participants = []
            for row in rows:
                participant_id = row[0]
                print(f'[DEBUG] Processing participant: {row[1]}, id={participant_id}')
                
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
                    'nomination': row[4] or row[3],
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
        
        # GET jury_access - получение доступа жюри к конкурсу (admin)
        if method == 'GET' and action == 'jury_access':
            contest_id = params.get('contest_id')
            if not contest_id:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется contest_id'}), 'isBase64Encoded': False}

            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            cur.execute(f'''
                SELECT jm.id, jm.name, jm.role, jm.image_url, jm.specialty,
                       (cja.jury_member_id IS NOT NULL) AS has_access
                FROM {schema}.jury_members jm
                LEFT JOIN {schema}.contest_jury_access cja
                  ON cja.jury_member_id = jm.id AND cja.contest_id = %s
                ORDER BY jm.name
            ''', (contest_id,))
            rows = [{'id': r[0], 'name': r[1], 'role': r[2], 'image_url': r[3], 'specialty': r[4], 'has_access': r[5]} for r in cur.fetchall()]
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'jury': rows}), 'isBase64Encoded': False}

        # POST jury_access - установка/снятие доступа жюри к конкурсу (admin)
        if method == 'POST' and action == 'jury_access':
            body = json.loads(event.get('body', '{}'))
            contest_id = body.get('contest_id')
            jury_member_id = body.get('jury_member_id')
            has_access = body.get('has_access', True)

            if not contest_id or not jury_member_id:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'contest_id и jury_member_id обязательны'}), 'isBase64Encoded': False}

            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            if has_access:
                cur.execute(f'''
                    INSERT INTO {schema}.contest_jury_access (contest_id, jury_member_id)
                    VALUES (%s, %s)
                    ON CONFLICT (contest_id, jury_member_id) DO NOTHING
                ''', (contest_id, jury_member_id))
            else:
                cur.execute(f'''
                    DELETE FROM {schema}.contest_jury_access
                    WHERE contest_id = %s AND jury_member_id = %s
                ''', (contest_id, jury_member_id))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        # GET program_scores - данные из contest_program для вкладки оценивания (admin)
        if method == 'GET' and action == 'program_scores':
            contest_id = params.get('contest_id')
            if not contest_id:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется contest_id'}), 'isBase64Encoded': False}

            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            cur.execute(f'''
                SELECT cp.id, cp.order_number, cp.region, cp.directing_party,
                       cp.participant_name, cp.age, cp.nomination, cp.piece_title, cp.duration
                FROM {schema}.contest_program cp
                WHERE cp.contest_id = %s
                ORDER BY cp.order_number
            ''', (contest_id,))
            rows = []
            for r in cur.fetchall():
                rows.append({
                    'id': r[0], 'order_number': r[1], 'region': r[2],
                    'directing_party': r[3], 'participant_name': r[4],
                    'age': r[5], 'nomination': r[6], 'piece_title': r[7], 'duration': r[8]
                })
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'rows': rows}), 'isBase64Encoded': False}

        # GET results_table - таблица результатов с оценками судей, итогом и званием (admin)
        if method == 'GET' and action == 'results_table':
            contest_id = params.get('contest_id')
            if not contest_id:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется contest_id'}), 'isBase64Encoded': False}

            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()

            # Получаем всех участников программы
            cur.execute(f'''
                SELECT cp.id, cp.order_number, cp.participant_name, cp.age, cp.nomination, cp.piece_title, cp.region, cp.directing_party, cp.director_name, cp.diploma_number
                FROM {schema}.contest_program cp
                WHERE cp.contest_id = %s
                ORDER BY cp.order_number
            ''', (contest_id,))
            program_rows = cur.fetchall()

            # Получаем всех назначенных судей для каждого участника (в порядке назначения)
            cur.execute(f'''
                SELECT pja.program_row_id, pja.jury_member_id, jm.name,
                       ROW_NUMBER() OVER (PARTITION BY pja.program_row_id ORDER BY pja.id) AS jury_order
                FROM {schema}.program_jury_assignments pja
                JOIN {schema}.jury_members jm ON jm.id = pja.jury_member_id
                WHERE pja.contest_id = %s
                ORDER BY pja.program_row_id, pja.id
            ''', (contest_id,))
            assignments_raw = cur.fetchall()

            # Получаем все оценки
            cur.execute(f'''
                SELECT ps.program_row_id, ps.jury_member_id, ps.score
                FROM {schema}.program_scores ps
                WHERE ps.contest_id = %s
            ''', (contest_id,))
            scores_raw = cur.fetchall()

            # Получаем систему оценивания
            cur.execute(f'''
                SELECT jury_count_1_grand_prix_min, jury_count_1_laureate_1_min, jury_count_1_laureate_2_min, jury_count_1_laureate_3_min,
                       jury_count_1_diplom_1_min, jury_count_1_diplom_2_min, jury_count_1_diplom_3_min,
                       jury_count_2_grand_prix_min, jury_count_2_laureate_1_min, jury_count_2_laureate_2_min, jury_count_2_laureate_3_min,
                       jury_count_2_diplom_1_min, jury_count_2_diplom_2_min, jury_count_2_diplom_3_min,
                       jury_count_3_grand_prix_min, jury_count_3_laureate_1_min, jury_count_3_laureate_2_min, jury_count_3_laureate_3_min,
                       jury_count_3_diplom_1_min, jury_count_3_diplom_2_min, jury_count_3_diplom_3_min,
                       jury_count_4_grand_prix_min, jury_count_4_laureate_1_min, jury_count_4_laureate_2_min, jury_count_4_laureate_3_min,
                       jury_count_4_diplom_1_min, jury_count_4_diplom_2_min, jury_count_4_diplom_3_min,
                       jury_count_5_grand_prix_min, jury_count_5_laureate_1_min, jury_count_5_laureate_2_min, jury_count_5_laureate_3_min,
                       jury_count_5_diplom_1_min, jury_count_5_diplom_2_min, jury_count_5_diplom_3_min
                FROM {schema}.contest_scoring_rules
                WHERE contest_id = %s
            ''', (contest_id,))
            scoring_row = cur.fetchone()
            cur.close()

            # Дефолтные пороги
            default_thresholds = {n: {'grand_prix': n*95, 'laureate_1': n*85, 'laureate_2': n*75, 'laureate_3': n*65, 'diplom_1': n*55, 'diplom_2': n*45, 'diplom_3': n*35} for n in range(1, 6)}
            if scoring_row:
                thresholds = {}
                cols = ['grand_prix', 'laureate_1', 'laureate_2', 'laureate_3', 'diplom_1', 'diplom_2', 'diplom_3']
                for i, n in enumerate(range(1, 6)):
                    thresholds[n] = {cols[j]: scoring_row[i*7 + j] for j in range(7)}
            else:
                thresholds = default_thresholds

            # Индексируем назначения и оценки
            assignments_by_row = {}
            for row_id, jury_id, jury_name, order in assignments_raw:
                if row_id not in assignments_by_row:
                    assignments_by_row[row_id] = []
                assignments_by_row[row_id].append({'jury_member_id': jury_id, 'jury_name': jury_name, 'order': order})

            scores_index = {(r[0], r[1]): float(r[2]) for r in scores_raw}

            def get_award(total, jury_count):
                if jury_count < 1 or jury_count > 5:
                    return ''
                t = thresholds.get(jury_count, default_thresholds.get(jury_count, {}))
                if total >= t.get('grand_prix', 9999):
                    return 'ОБЛАДАТЕЛЯ ГРАН-ПРИ'
                elif total >= t.get('laureate_1', 9999):
                    return 'ЛАУРЕАТА I СТЕПЕНИ'
                elif total >= t.get('laureate_2', 9999):
                    return 'ЛАУРЕАТА II СТЕПЕНИ'
                elif total >= t.get('laureate_3', 9999):
                    return 'ЛАУРЕАТА III СТЕПЕНИ'
                elif total >= t.get('diplom_1', 9999):
                    return 'ДИПЛОМАНТА I СТЕПЕНИ'
                elif total >= t.get('diplom_2', 9999):
                    return 'ДИПЛОМАНТА II СТЕПЕНИ'
                elif total >= t.get('diplom_3', 9999):
                    return 'ДИПЛОМАНТА III СТЕПЕНИ'
                return 'УЧАСТНИКА'

            result = []
            for row in program_rows:
                row_id = row[0]
                jury_list = assignments_by_row.get(row_id, [])
                jury_scores = []
                total = 0.0
                all_scored = len(jury_list) > 0
                for j in jury_list:
                    score = scores_index.get((row_id, j['jury_member_id']))
                    jury_scores.append({'order': j['order'], 'score': score})
                    if score is not None:
                        total += score
                    else:
                        all_scored = False

                jury_count = len(jury_list)
                award = get_award(total, jury_count) if all_scored and jury_count > 0 else ''

                result.append({
                    'id': row_id,
                    'order_number': row[1],
                    'participant_name': row[2],
                    'age': row[3],
                    'nomination': row[4],
                    'piece_title': row[5],
                    'region': row[6],
                    'directing_party': row[7],
                    'director_name': row[8] if len(row) > 8 else '',
                    'diploma_number': row[9] if len(row) > 9 else '',
                    'jury_scores': jury_scores,
                    'jury_count': jury_count,
                    'total': round(total, 2) if all_scored and jury_count > 0 else None,
                    'award': award,
                    'all_scored': all_scored and jury_count > 0,
                })

            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'rows': result, 'thresholds': {str(k): v for k, v in thresholds.items()}}), 'isBase64Encoded': False}

        # GET jury_contests - конкурсы, к которым у жюри есть доступ (для панели жюри)
        if method == 'GET' and action == 'jury_contests':
            token = event.get('headers', {}).get('X-Jury-Token') or event.get('headers', {}).get('x-jury-token')
            if not token:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            jury_id = verify_jury_token(token, conn)
            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            cur.execute(f'''
                SELECT c.id, c.title, c.start_date, c.end_date
                FROM {schema}.contests c
                JOIN {schema}.contest_jury_access cja ON cja.contest_id = c.id AND cja.jury_member_id = %s
                ORDER BY c.start_date
            ''', (jury_id,))
            contests = []
            for r in cur.fetchall():
                contests.append({'id': r[0], 'title': r[1], 'start_date': r[2].isoformat() if r[2] else None, 'end_date': r[3].isoformat() if r[3] else None})
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'contests': contests}), 'isBase64Encoded': False}

        # GET jury_program - все участники конкурса для жюри, assigned=True если назначен
        if method == 'GET' and action == 'jury_program':
            token = event.get('headers', {}).get('X-Jury-Token') or event.get('headers', {}).get('x-jury-token')
            if not token:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            jury_id = verify_jury_token(token, conn)
            contest_id = params.get('contest_id')
            if not contest_id:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется contest_id'}), 'isBase64Encoded': False}
            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            cur.execute(f'''
                SELECT cp.id, cp.order_number, cp.participant_name, cp.age,
                       cp.nomination, cp.piece_title, cp.duration, cp.region, cp.directing_party,
                       (pja.jury_member_id IS NOT NULL) AS assigned,
                       ps.score, ps.comment, ps.id AS score_id
                FROM {schema}.contest_program cp
                LEFT JOIN {schema}.program_jury_assignments pja
                  ON pja.program_row_id = cp.id AND pja.jury_member_id = %s
                LEFT JOIN {schema}.program_scores ps
                  ON ps.program_row_id = cp.id AND ps.jury_member_id = %s
                WHERE cp.contest_id = %s
                ORDER BY cp.order_number
            ''', (jury_id, jury_id, contest_id))
            rows = []
            for r in cur.fetchall():
                rows.append({
                    'id': r[0], 'order_number': r[1], 'participant_name': r[2],
                    'age': r[3], 'nomination': r[4], 'piece_title': r[5],
                    'duration': r[6], 'region': r[7], 'directing_party': r[8],
                    'assigned': bool(r[9]),
                    'score': float(r[10]) if r[10] is not None else None,
                    'comment': r[11], 'score_id': r[12]
                })
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'rows': rows}), 'isBase64Encoded': False}

        # GET program_assignments - назначения жюри для участников программы (admin)
        if method == 'GET' and action == 'program_assignments':
            contest_id = params.get('contest_id')
            if not contest_id:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется contest_id'}), 'isBase64Encoded': False}
            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            cur.execute(f'''
                SELECT pja.program_row_id, pja.jury_member_id, jm.name
                FROM {schema}.program_jury_assignments pja
                JOIN {schema}.jury_members jm ON jm.id = pja.jury_member_id
                WHERE pja.contest_id = %s
            ''', (contest_id,))
            assignments = [{'program_row_id': r[0], 'jury_member_id': r[1], 'jury_name': r[2]} for r in cur.fetchall()]
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'assignments': assignments}), 'isBase64Encoded': False}

        # POST program_assignment - назначить/снять жюри для участника программы (admin)
        if method == 'POST' and action == 'program_assignment':
            body = json.loads(event.get('body', '{}'))
            program_row_id = body.get('program_row_id')
            jury_member_id = body.get('jury_member_id')
            contest_id = body.get('contest_id')
            assigned = body.get('assigned', True)
            if not program_row_id or not jury_member_id or not contest_id:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'program_row_id, jury_member_id, contest_id обязательны'}), 'isBase64Encoded': False}
            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            if assigned:
                cur.execute(f'''
                    INSERT INTO {schema}.program_jury_assignments (program_row_id, contest_id, jury_member_id)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (program_row_id, jury_member_id) DO NOTHING
                ''', (program_row_id, contest_id, jury_member_id))
            else:
                cur.execute(f'''
                    DELETE FROM {schema}.program_jury_assignments
                    WHERE program_row_id = %s AND jury_member_id = %s
                ''', (program_row_id, jury_member_id))
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True}), 'isBase64Encoded': False}

        # POST program_score - сохранение оценки участника программы жюри
        if method == 'POST' and action == 'program_score':
            token = event.get('headers', {}).get('X-Jury-Token') or event.get('headers', {}).get('x-jury-token')
            if not token:
                return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Требуется авторизация'}), 'isBase64Encoded': False}
            jury_id = verify_jury_token(token, conn)
            body = json.loads(event.get('body', '{}'))
            program_row_id = body.get('program_row_id')
            contest_id = body.get('contest_id')
            score = body.get('score')
            comment = body.get('comment', '')
            if not program_row_id or not contest_id or score is None:
                return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'program_row_id, contest_id, score обязательны'}), 'isBase64Encoded': False}
            schema = 't_p73771717_multi_page_site_proj'
            cur = conn.cursor()
            cur.execute(f'''
                INSERT INTO {schema}.program_scores (program_row_id, jury_member_id, contest_id, score, comment)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (program_row_id, jury_member_id) DO UPDATE
                SET score = EXCLUDED.score, comment = EXCLUDED.comment, updated_at = NOW()
                RETURNING id
            ''', (program_row_id, jury_id, contest_id, float(score), comment))
            score_id = cur.fetchone()[0]
            conn.commit()
            cur.close()
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'success': True, 'score_id': score_id}), 'isBase64Encoded': False}

        # DELETE participant - удаление участника (админская функция, не требует токена)
        if method == 'DELETE' and action == 'delete_participant':
            participant_id = params.get('participant_id')
            
            if not participant_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется participant_id'}),
                    'isBase64Encoded': False
                }
            
            cur = conn.cursor()
            
            # Удаляем все оценки участника
            cur.execute('DELETE FROM participant_scores WHERE participant_id = %s', (participant_id,))
            
            # Удаляем самого участника
            cur.execute('DELETE FROM participants WHERE id = %s', (participant_id,))
            
            conn.commit()
            cur.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Участник удалён'}),
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