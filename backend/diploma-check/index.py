import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from typing import Dict, Any

SCHEMA = 't_p73771717_multi_page_site_proj'

JURY_COUNTS = [1, 2, 3, 4, 5]
LEVELS = ['grand_prix_min', 'laureate_1_min', 'laureate_2_min', 'laureate_3_min', 'diplom_1_min', 'diplom_2_min', 'diplom_3_min']
DEFAULT_THRESHOLDS = {n: {'grand_prix': n*95, 'laureate_1': n*85, 'laureate_2': n*75, 'laureate_3': n*65, 'diplom_1': n*55, 'diplom_2': n*45, 'diplom_3': n*35} for n in range(1, 6)}


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Проверка диплома по серии и номеру
    GET /?diploma_number=XX000001 - получить данные диплома
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    params = event.get('queryStringParameters') or {}
    diploma_number = (params.get('diploma_number') or '').strip().upper()
    participant_name = (params.get('participant_name') or '').strip()

    if not diploma_number and not participant_name:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Укажите номер диплома'})
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True

    # Поиск всех дипломов по имени участника
    if participant_name and not diploma_number:
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(f'''
                    SELECT cp.diploma_number, cp.participant_name, cp.director_name,
                           cp.piece_title, cp.nomination, cp.directing_party,
                           c.title as contest_title, c.location as contest_location,
                           c.event_date as contest_event_date
                    FROM {SCHEMA}.contest_program cp
                    JOIN {SCHEMA}.contests c ON c.id = cp.contest_id
                    WHERE cp.diploma_number != ''
                      AND LOWER(cp.participant_name) LIKE LOWER(%s)
                    ORDER BY c.event_date DESC
                ''', (f'%{participant_name}%',))
                rows = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'diplomas': [dict(r) for r in rows]})
                }
        finally:
            conn.close()

    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Получаем строку программы
            cur.execute(f'''
                SELECT cp.id, cp.contest_id, cp.participant_name, cp.director_name,
                       cp.piece_title, cp.nomination, cp.age, cp.region, cp.directing_party
                FROM {SCHEMA}.contest_program cp
                WHERE UPPER(cp.diploma_number) = %s
            ''', (diploma_number,))
            row = cur.fetchone()

            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Диплом с таким номером не найден'})
                }

            row = dict(row)
            contest_id = row['contest_id']
            row_id = row['id']

            # Получаем данные конкурса
            cur.execute(f'''
                SELECT title, location, event_date
                FROM {SCHEMA}.contests
                WHERE id = %s
            ''', (contest_id,))
            contest = cur.fetchone()

            # Получаем оценки и считаем звание
            cur.execute(f'''
                SELECT pja.jury_member_id,
                       ROW_NUMBER() OVER (ORDER BY pja.id) AS jury_order
                FROM {SCHEMA}.program_jury_assignments pja
                WHERE pja.program_row_id = %s AND pja.contest_id = %s
                ORDER BY pja.id
            ''', (row_id, contest_id))
            assignments = cur.fetchall()
            jury_count = len(assignments)

            cur.execute(f'''
                SELECT ps.jury_member_id, ps.score
                FROM {SCHEMA}.program_scores ps
                WHERE ps.program_row_id = %s AND ps.contest_id = %s
            ''', (row_id, contest_id))
            scores_raw = {r['jury_member_id']: float(r['score']) for r in cur.fetchall()}

            # Система оценивания
            cur.execute(f'''
                SELECT {', '.join([f'jury_count_{n}_{lvl}' for n in JURY_COUNTS for lvl in LEVELS])}
                FROM {SCHEMA}.contest_scoring_rules
                WHERE contest_id = %s
            ''', (contest_id,))
            scoring_row = cur.fetchone()

            if scoring_row:
                cols = ['grand_prix', 'laureate_1', 'laureate_2', 'laureate_3', 'diplom_1', 'diplom_2', 'diplom_3']
                keys = [f'jury_count_{n}_{lvl}' for n in JURY_COUNTS for lvl in LEVELS]
                thresholds = {}
                for i, n in enumerate(range(1, 6)):
                    thresholds[n] = {cols[j]: scoring_row[keys[i*7+j]] for j in range(7)}
            else:
                thresholds = DEFAULT_THRESHOLDS

            total = 0.0
            all_scored = jury_count > 0
            for a in assignments:
                score = scores_raw.get(a['jury_member_id'])
                if score is not None:
                    total += score
                else:
                    all_scored = False

            award = ''
            if all_scored and jury_count > 0:
                t = thresholds.get(jury_count, DEFAULT_THRESHOLDS.get(jury_count, {}))
                if total >= t.get('grand_prix', 9999): award = 'ОБЛАДАТЕЛЬ ГРАН-ПРИ'
                elif total >= t.get('laureate_1', 9999): award = 'ЛАУРЕАТ I СТЕПЕНИ'
                elif total >= t.get('laureate_2', 9999): award = 'ЛАУРЕАТ II СТЕПЕНИ'
                elif total >= t.get('laureate_3', 9999): award = 'ЛАУРЕАТ III СТЕПЕНИ'
                elif total >= t.get('diplom_1', 9999): award = 'ДИПЛОМАНТ I СТЕПЕНИ'
                elif total >= t.get('diplom_2', 9999): award = 'ДИПЛОМАНТ II СТЕПЕНИ'
                elif total >= t.get('diplom_3', 9999): award = 'ДИПЛОМАНТ III СТЕПЕНИ'
                else: award = 'УЧАСТНИК'

            # Фото жюри
            cur.execute(f'''
                SELECT DISTINCT jm.name, jm.image_url AS photo_url, jm.role AS title
                FROM {SCHEMA}.program_jury_assignments pja
                JOIN {SCHEMA}.jury_members jm ON jm.id = pja.jury_member_id
                WHERE pja.contest_id = %s
                ORDER BY jm.name
            ''', (contest_id,))
            jury_members = [dict(j) for j in cur.fetchall()]

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'diploma_number': diploma_number,
                'participant_name': row['participant_name'],
                'director_name': row['director_name'],
                'directing_party': row['directing_party'],
                'piece_title': row['piece_title'],
                'nomination': row['nomination'],
                'award': award,
                'contest_title': contest['title'] if contest else '',
                'contest_location': contest['location'] if contest else '',
                'contest_event_date': contest['event_date'] if contest else '',
                'jury_members': jury_members,
            })
        }
    finally:
        conn.close()