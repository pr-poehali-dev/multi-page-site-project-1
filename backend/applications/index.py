import json
import os
import re
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import Header
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import hashlib
import requests

CABINET_URL = 'https://индиго-арт.рф/participant-cabinet'
SUPPORT_EMAIL = 'indigo_fest@mail.ru'
EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send'
VK_API_URL = 'https://api.vk.com/method'
VK_VERSION = '5.199'


def hash_password(password: str) -> str:
    '''Хеширование пароля SHA-256'''
    return hashlib.sha256(password.encode()).hexdigest()


def vk_parse_post_url(url: str) -> Optional[Dict[str, int]]:
    '''Извлекает owner_id и post_id из ссылки на пост ВК'''
    match = re.search(r'wall(-?\d+)_(\d+)', url or '')
    if not match:
        return None
    return {'owner_id': int(match.group(1)), 'post_id': int(match.group(2))}


def vk_extract_screen_name(vk_link: str) -> Optional[str]:
    '''Извлекает screen_name из ссылки на профиль ВК'''
    if not vk_link:
        return None
    vk_link = vk_link.strip()
    match = re.search(r'(?:vk\.com|vk\.ru|vkontakte\.ru)/([a-zA-Z0-9_.]+)', vk_link)
    name = match.group(1) if match else vk_link.lstrip('@').strip('/')
    name = name.split('?')[0].split('&')[0]
    return name or None


def vk_call(method: str, params: Dict[str, Any], token: str) -> Dict[str, Any]:
    '''Вызов метода VK API'''
    payload = {**params, 'access_token': token, 'v': VK_VERSION}
    resp = requests.get(f'{VK_API_URL}/{method}', params=payload, timeout=8)
    return resp.json()


def check_vk_activity(vk_link: str, owner_id: int, post_id: int, group_id: int, token: str) -> Dict[str, Any]:
    '''Проверяет лайк, репост и подписку на сообщество для одного участника по ссылке ВК'''
    result = {'vk_resolved': False, 'vk_user_id': None, 'liked': False, 'reposted': False, 'subscribed': False}
    screen_name = vk_extract_screen_name(vk_link)
    if not screen_name:
        return result
    resolved = vk_call('utils.resolveScreenName', {'screen_name': screen_name}, token)
    resp = resolved.get('response') or {}
    if resp.get('type') != 'user':
        return result
    uid = resp.get('object_id')
    if not uid:
        return result
    result['vk_resolved'] = True
    result['vk_user_id'] = uid

    like_check = vk_call('likes.isLiked', {'type': 'post', 'owner_id': owner_id, 'item_id': post_id, 'user_id': uid}, token)
    like_resp = like_check.get('response') or {}
    result['liked'] = bool(like_resp.get('liked'))
    result['reposted'] = bool(like_resp.get('copied'))

    member_check = vk_call('groups.isMember', {'group_id': group_id, 'user_id': uid}, token)
    result['subscribed'] = bool(member_check.get('response'))

    return result


def send_push_notification(push_token: str, title: str, body: str, data: dict = None) -> None:
    '''Отправляет push-уведомление через Expo Push Service одному пользователю'''
    if not push_token:
        return
    message = {'to': push_token, 'title': title, 'body': body}
    if data:
        message['data'] = data
    try:
        resp = requests.post(
            EXPO_PUSH_URL,
            headers={'Content-Type': 'application/json', 'Accept': 'application/json'},
            json=message,
            timeout=10,
        )
        result = resp.json()
        ticket = result.get('data', {})
        if isinstance(ticket, dict) and ticket.get('status') == 'error':
            print(f"[PUSH ERROR] token={push_token} error={ticket.get('message')} details={ticket.get('details')}")
    except Exception as e:
        print(f"[PUSH EXCEPTION] token={push_token} error={e}")

def get_db_connection():
    '''Создает подключение к базе данных'''
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn, cursor_factory=RealDictCursor)


def run_vk_check_and_maybe_reject(cur, conn, contest_id: int, application_id: int, participant_id: int,
                                   email: str, full_name: str, contest_title: str) -> Optional[str]:
    '''
    Если для конкурса задан пост ВК — проверяет лайк/репост/подписку участника.
    Если условия не выполнены — переводит заявку в статус rejected, пишет комментарий,
    отправляет email, сообщение в чат ЛК и push-уведомление.
    Возвращает итоговый статус заявки ('rejected' или None если проверка не проводилась/прошла).
    '''
    try:
        cur.execute('SELECT owner_id, post_id FROM vk_check_posts WHERE contest_id = %s', (contest_id,))
        vk_post = cur.fetchone()
        vk_token = os.environ.get('VK_USER_TOKEN')
        if not vk_post or not vk_token:
            return None

        cur.execute('SELECT vk_link, push_token FROM participants WHERE id = %s', (participant_id,))
        participant_row = cur.fetchone() or {}
        vk_link = participant_row.get('vk_link') or ''
        push_token = participant_row.get('push_token')

        check = check_vk_activity(vk_link, vk_post['owner_id'], vk_post['post_id'], abs(vk_post['owner_id']), vk_token)

        cur.execute(
            '''
            INSERT INTO vk_check_results (contest_id, application_id, vk_user_id, vk_resolved, liked, reposted, commented, subscribed, checked_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (contest_id, application_id) DO UPDATE SET
                vk_user_id = EXCLUDED.vk_user_id, vk_resolved = EXCLUDED.vk_resolved,
                liked = EXCLUDED.liked, reposted = EXCLUDED.reposted,
                subscribed = EXCLUDED.subscribed, checked_at = CURRENT_TIMESTAMP
            ''',
            (contest_id, application_id, check['vk_user_id'], check['vk_resolved'], check['liked'], check['reposted'], False, check['subscribed'])
        )
        conn.commit()

        if check['vk_resolved'] and check['liked'] and check['reposted'] and check['subscribed']:
            return None

        reasons = []
        if not check['vk_resolved']:
            reasons.append('не удалось найти профиль ВК по указанной ссылке')
        else:
            if not check['liked']:
                reasons.append('не поставлен лайк на пост')
            if not check['reposted']:
                reasons.append('не сделан репост поста')
            if not check['subscribed']:
                reasons.append('нет подписки на сообщество')
        reason_text = '; '.join(reasons)
        comment = f'Автоматический отказ по итогам проверки ВК: {reason_text}.'

        cur.execute(
            "UPDATE applications SET status = 'rejected', admin_comment = %s WHERE id = %s",
            (comment, application_id)
        )
        conn.commit()

        chat_text = f'Заявка на «{contest_title}» автоматически отклонена: {reason_text}. Пожалуйста, выполните условия и подайте заявку повторно.'
        try:
            cur.execute(
                "INSERT INTO chat_messages (participant_id, sender, message) VALUES (%s, 'admin', %s)",
                (participant_id, chat_text)
            )
            conn.commit()
        except Exception as chat_err:
            print(f'[VK CHECK CHAT ERROR] {chat_err}')

        try:
            send_vk_reject_email(email, full_name, contest_title, reason_text)
        except Exception as reject_email_err:
            print(f'[VK CHECK EMAIL ERROR] {reject_email_err}')

        try:
            send_push_notification(
                push_token,
                'Заявка отклонена',
                f'Заявка на «{contest_title}» отклонена по итогам проверки ВК',
                {'screen': 'MyApplications', 'applicationId': application_id, 'contestId': contest_id}
            )
        except Exception as push_err:
            print(f'[VK CHECK PUSH ERROR] {push_err}')

        return 'rejected'
    except Exception as vk_check_err:
        print(f'[VK CHECK ERROR] {vk_check_err}')
        return None

def send_application_received_email(to_email: str, full_name: str, contest_title: str) -> None:
    '''Отправляет участнику письмо о том, что заявка принята к рассмотрению'''
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = os.environ.get('SMTP_PORT')
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not all([smtp_host, smtp_port, smtp_user, smtp_password, to_email]):
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = Header(f'Заявка на конкурс «{contest_title}» принята к рассмотрению — ИНДИГО', 'utf-8')
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #6d28d9;">Заявка получена!</h2>
      <p>Здравствуйте, {full_name}!</p>
      <p>Ваша заявка на участие в конкурсе «<b>{contest_title}</b>» успешно отправлена и находится на рассмотрении организаторов.</p>
      <p>Как только заявка будет одобрена, мы пришлём вам уведомление на эту электронную почту.</p>
      <p>Статус заявки в любой момент можно проверить в <a href="{CABINET_URL}" style="color:#6d28d9;">личном кабинете участника</a>.</p>
      <p style="color:#6b7280; font-size: 14px; margin-top: 24px;">
        Если статус заявки не обновится в течение 24 часов, пожалуйста, напишите нам в чат поддержки личного кабинета
        или на почту <a href="mailto:{SUPPORT_EMAIL}" style="color:#6d28d9;">{SUPPORT_EMAIL}</a>.
      </p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    if int(smtp_port) == 465:
        with smtplib.SMTP_SSL(smtp_host, int(smtp_port)) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())


def send_vk_reject_email(to_email: str, full_name: str, contest_title: str, reason_text: str) -> None:
    '''Отправляет участнику письмо об автоматическом отклонении заявки по итогам проверки ВК'''
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = os.environ.get('SMTP_PORT')
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    if not all([smtp_host, smtp_port, smtp_user, smtp_password, to_email]):
        return

    msg = MIMEMultipart('alternative')
    msg['Subject'] = Header(f'Заявка на конкурс «{contest_title}» отклонена — ИНДИГО', 'utf-8')
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
      <h2 style="color: #dc2626;">Заявка отклонена</h2>
      <p>Здравствуйте, {full_name}!</p>
      <p>Ваша заявка на участие в конкурсе «<b>{contest_title}</b>» была автоматически отклонена: {reason_text}.</p>
      <p>Пожалуйста, выполните условия участия и подайте заявку заново из <a href="{CABINET_URL}" style="color:#6d28d9;">личного кабинета участника</a>.</p>
      <p style="color:#6b7280; font-size: 14px; margin-top: 24px;">
        Если у вас есть вопросы, напишите нам в чат поддержки личного кабинета
        или на почту <a href="mailto:{SUPPORT_EMAIL}" style="color:#6d28d9;">{SUPPORT_EMAIL}</a>.
      </p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    if int(smtp_port) == 465:
        with smtplib.SMTP_SSL(smtp_host, int(smtp_port)) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, int(smtp_port)) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    API для работы с заявками участников конкурсов
    Методы: POST - создание заявки, GET - получение заявки по email/applicationId, PUT - редактирование своей заявки участником
    '''
    method: str = event.get('httpMethod', 'GET')
    print(f'[DEBUG] Method: {method}')
    print(f'[DEBUG] Event: {json.dumps(event, default=str)}')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    
    try:
        if method == 'PUT':
            # Редактирование существующей заявки участником (если не заморожено)
            body_data = json.loads(event.get('body', '{}'))
            application_id = body_data.get('applicationId')

            if not application_id:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'applicationId обязателен'}),
                    'isBase64Encoded': False
                }

            with conn.cursor() as cur:
                cur.execute(
                    '''
                    SELECT a.id, a.editing_locked, a.status, a.admin_comment, a.participant_id AS pid,
                           c.applications_locked, c.title AS contest_title, p.email, p.full_name
                    FROM applications a
                    JOIN contests c ON a.contest_id = c.id
                    JOIN participants p ON p.id = a.participant_id
                    WHERE a.id = %s
                    ''',
                    (application_id,)
                )
                existing = cur.fetchone()

                if not existing:
                    return {
                        'statusCode': 404,
                        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }

                if existing['editing_locked'] or existing['applications_locked']:
                    return {
                        'statusCode': 403,
                        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Редактирование заявки закрыто организатором'}),
                        'isBase64Encoded': False
                    }

                # Если заявка была отклонена, либо возвращена на доработку (pending с комментарием организатора) —
                # при сохранении изменений участником отправляем её повторно на рассмотрение
                resubmit = existing['status'] == 'rejected' or (existing['status'] == 'pending' and existing.get('admin_comment'))

                custom_fields = body_data.get('customFields', {})
                nomination_id = body_data.get('nominationId')

                if resubmit:
                    cur.execute(
                        '''
                        UPDATE applications
                        SET category = %s, performance_title = %s, participation_format = %s,
                            nomination = %s, nomination_id = %s, experience = %s, achievements = %s,
                            additional_info = %s, custom_fields = %s, status = 'pending', admin_comment = NULL
                        WHERE id = %s
                        RETURNING id, status, submitted_at, contest_id, participant_id
                        ''',
                        (
                            body_data.get('category') or '',
                            body_data.get('performanceTitle', ''),
                            body_data.get('participationFormat', ''),
                            body_data.get('nomination', ''),
                            nomination_id,
                            body_data.get('experience', ''),
                            body_data.get('achievements', ''),
                            body_data.get('additionalInfo', ''),
                            json.dumps(custom_fields),
                            application_id
                        )
                    )
                else:
                    cur.execute(
                        '''
                        UPDATE applications
                        SET category = %s, performance_title = %s, participation_format = %s,
                            nomination = %s, nomination_id = %s, experience = %s, achievements = %s,
                            additional_info = %s, custom_fields = %s
                        WHERE id = %s
                        RETURNING id, status, submitted_at, contest_id, participant_id
                        ''',
                        (
                            body_data.get('category') or '',
                            body_data.get('performanceTitle', ''),
                            body_data.get('participationFormat', ''),
                            body_data.get('nomination', ''),
                            nomination_id,
                            body_data.get('experience', ''),
                            body_data.get('achievements', ''),
                            body_data.get('additionalInfo', ''),
                            json.dumps(custom_fields),
                            application_id
                        )
                    )
                updated = cur.fetchone()

                # Если заявка уже занесена в программу конкурса - синхронизируем данные программы
                cur.execute('SELECT id FROM contest_program WHERE application_id = %s', (application_id,))
                program_row = cur.fetchone()

                if program_row:
                    cur.execute(
                        '''SELECT p.full_name, p.contact_position, p.city
                           FROM participants p WHERE p.id = %s''',
                        (updated['participant_id'],)
                    )
                    participant_info = cur.fetchone() or {}

                    system_values = {}
                    cur.execute('''
                        SELECT f.system_key, f.field_name
                        FROM application_form_fields f
                        JOIN contests c ON c.form_template_id = f.template_id
                        WHERE c.id = %s AND f.system_key IS NOT NULL
                    ''', (updated['contest_id'],))
                    for row in cur.fetchall():
                        value = custom_fields.get(row['field_name'], '')
                        if value:
                            system_values[row['system_key']] = value

                    participant_name = system_values.get('participant_name') or participant_info.get('full_name', '')
                    nomination = system_values.get('nomination') or body_data.get('nomination', '')
                    piece_title = system_values.get('piece_title') or body_data.get('performanceTitle', '')
                    participation_format = system_values.get('participation_format') or body_data.get('participationFormat', '')
                    region = system_values.get('region') or participant_info.get('city', '')
                    directing_party = system_values.get('directing_party', '')
                    duration = system_values.get('duration', '')
                    director_name = system_values.get('director_name') or participant_info.get('contact_position', '')
                    age_category = system_values.get('age_category', '')

                    cur.execute(
                        '''
                        UPDATE contest_program
                        SET region = %s, directing_party = %s, participant_name = %s, age = %s,
                            nomination = %s, nomination_id = %s, piece_title = %s, duration = %s, director_name = %s,
                            participation_format = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE application_id = %s
                        ''',
                        (region, directing_party, participant_name, age_category, nomination, nomination_id,
                         piece_title, duration, director_name,
                         participation_format, application_id)
                    )

                conn.commit()

                final_status = updated['status']

                if resubmit:
                    try:
                        cur.execute('SELECT push_token FROM participants WHERE id = %s', (updated['participant_id'],))
                        push_row = cur.fetchone() or {}
                        push_token = push_row.get('push_token')

                        cur.execute(
                            "INSERT INTO chat_messages (participant_id, sender, message) VALUES (%s, 'admin', %s)",
                            (updated['participant_id'], f"Заявка на «{existing['contest_title']}» отправлена повторно на рассмотрение.")
                        )
                        conn.commit()

                        send_push_notification(
                            push_token,
                            'Заявка отправлена повторно',
                            f"Заявка на «{existing['contest_title']}» снова на рассмотрении",
                            {'screen': 'MyApplications', 'applicationId': updated['id'], 'contestId': updated['contest_id']}
                        )

                        send_application_received_email(existing['email'], existing['full_name'], existing['contest_title'])
                    except Exception as resubmit_notify_err:
                        print(f'[RESUBMIT NOTIFY ERROR] {resubmit_notify_err}')

                    vk_result_status = run_vk_check_and_maybe_reject(
                        cur, conn, updated['contest_id'], updated['id'], updated['participant_id'],
                        existing['email'], existing['full_name'], existing['contest_title']
                    )
                    if vk_result_status:
                        final_status = vk_result_status

                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': True,
                        'applicationId': updated['id'],
                        'status': final_status,
                        'message': 'Заявка отправлена повторно на рассмотрение' if resubmit else 'Заявка обновлена'
                    }),
                    'isBase64Encoded': False
                }

        if method == 'POST':
            # Создание новой заявки
            body_data = json.loads(event.get('body', '{}'))
            
            # Извлекаем данные
            full_name = body_data.get('fullName')
            email = body_data.get('email')
            phone = body_data.get('phone')
            city = body_data.get('city')
            password = body_data.get('password', '')
            contest_input = body_data.get('contestId')
            category = body_data.get('category') or ''
            performance_title = body_data.get('performanceTitle', '')
            participation_format = body_data.get('participationFormat', '')
            nomination = body_data.get('nomination', '')
            nomination_id = body_data.get('nominationId')
            experience = body_data.get('experience', '')
            achievements = body_data.get('achievements', '')
            additional_info = body_data.get('additionalInfo', '')
            files_count = body_data.get('filesCount', 0)
            custom_fields = body_data.get('customFields', {})
            
            password_hash = hash_password(password) if password else None
            
            with conn.cursor() as cur:
                # Проверяем/создаем участника
                if password_hash:
                    cur.execute(
                        '''
                        INSERT INTO participants (full_name, email, phone, city, password_hash)
                        VALUES (%s, %s, %s, %s, %s)
                        ON CONFLICT (email) 
                        DO UPDATE SET 
                            full_name = EXCLUDED.full_name,
                            phone = EXCLUDED.phone,
                            city = EXCLUDED.city,
                            password_hash = EXCLUDED.password_hash
                        RETURNING id
                        ''',
                        (full_name, email, phone, city, password_hash)
                    )
                else:
                    cur.execute(
                        '''
                        INSERT INTO participants (full_name, email, phone, city)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT (email) 
                        DO UPDATE SET 
                            full_name = EXCLUDED.full_name,
                            phone = EXCLUDED.phone,
                            city = EXCLUDED.city
                        RETURNING id
                        ''',
                        (full_name, email, phone, city)
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
                
                cur.execute('SELECT title FROM contests WHERE id = %s', (contest_id,))
                contest_title = cur.fetchone()['title']
                
                # Создаем новую заявку (каждая подача - отдельная запись, включая повторные)
                cur.execute(
                    '''
                    INSERT INTO applications 
                    (participant_id, contest_id, category, performance_title, participation_format, nomination, nomination_id, experience, achievements, additional_info, custom_fields, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'pending')
                    RETURNING id, submitted_at, status
                    ''',
                    (participant_id, contest_id, category, performance_title, participation_format, nomination, nomination_id, experience, achievements, additional_info, json.dumps(custom_fields))
                )
                application = cur.fetchone()

                conn.commit()

                try:
                    send_application_received_email(email, full_name, contest_title)
                except Exception as email_err:
                    print(f'[EMAIL ERROR] {email_err}')

                final_status = application['status']

                # Если для конкурса задан пост ВК — сразу проверяем лайк/репост/подписку
                vk_result_status = run_vk_check_and_maybe_reject(
                    cur, conn, contest_id, application['id'], participant_id, email, full_name, contest_title
                )
                if vk_result_status:
                    final_status = vk_result_status

                return {
                    'statusCode': 200,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'success': True,
                        'applicationId': application['id'],
                        'status': final_status,
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
                        p.full_name, p.contact_position, p.email, p.phone, p.vk_link, p.city,
                        a.id as application_id, a.category, a.performance_title, a.participation_format, 
                        a.nomination, a.nomination_id, a.experience, a.achievements, a.additional_info, a.custom_fields, a.status, a.submitted_at,
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
                    'SELECT file_name, file_type, file_size, file_url FROM application_files WHERE application_id = %s',
                    (result['application_id'],)
                )
                files = cur.fetchall()
                
                response_data = {
                    'fullName': result['full_name'],
                    'contactPosition': result.get('contact_position') or '',
                    'email': result['email'],
                    'phone': result['phone'],
                    'vkLink': result.get('vk_link') or '',
                    'city': result['city'],
                    'contestId': result['contest_key'],
                    'contestTitle': result['contest_title'],
                    'category': result['category'],
                    'performanceTitle': result['performance_title'] or '',
                    'participationFormat': result['participation_format'] or '',
                    'nomination': result['nomination'] or '',
                    'nominationId': result.get('nomination_id'),
                    'experience': result['experience'] or '',
                    'achievements': result['achievements'] or '',
                    'additionalInfo': result['additional_info'] or '',
                    'customFields': result['custom_fields'] or {},
                    'status': result['status'],
                    'submittedAt': result['submitted_at'].isoformat(),
                    'files': [{'name': f['file_name'], 'type': f['file_type'], 'size': f['file_size'], 'url': f['file_url']} for f in files]
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