import json
import os
import random
import string
import smtplib
import hashlib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p73771717_multi_page_site_proj')


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def generate_code() -> str:
    return ''.join(random.choices(string.digits, k=6))


def send_email(to_email: str, code: str, full_name: str):
    smtp_host = os.environ['SMTP_HOST']
    smtp_port = int(os.environ['SMTP_PORT'])
    smtp_user = os.environ['SMTP_USER']
    smtp_password = os.environ['SMTP_PASSWORD']

    msg = MIMEMultipart('alternative')
    from email.header import Header
    msg['Subject'] = Header('Восстановление пароля — ИНДИГО', 'utf-8')
    msg['From'] = smtp_user
    msg['To'] = to_email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #6d28d9;">Восстановление пароля</h2>
      <p>Здравствуйте, {full_name}!</p>
      <p>Вы запросили сброс пароля в личном кабинете ИНДИГО.</p>
      <p>Ваш код подтверждения:</p>
      <div style="background: #f3f4f6; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #6d28d9;">{code}</span>
      </div>
      <p style="color: #6b7280; font-size: 14px;">Код действителен 15 минут. Если вы не запрашивали сброс пароля — проигнорируйте это письмо.</p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

    print(f'[SMTP] Connecting to {smtp_host}:{smtp_port}')
    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    else:
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_user, to_email, msg.as_string())
    print(f'[SMTP] Email sent to {to_email}')


def handler(event: dict, context) -> dict:
    """
    Восстановление пароля участника.
    POST {"action": "request", "email": "..."} — отправить код на email
    POST {"action": "confirm", "email": "...", "code": "...", "new_password": "..."} — сменить пароль
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    body = json.loads(event.get('body') or '{}')
    action = body.get('action')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    conn.autocommit = True

    with conn.cursor(cursor_factory=RealDictCursor) as cur:

        if action == 'request':
            email = (body.get('email') or '').strip().lower()
            if not email:
                return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Укажите email'})}

            cur.execute(f'SELECT id, full_name, email FROM {SCHEMA}.participants WHERE LOWER(email) = %s', (email,))
            participant = cur.fetchone()

            if not participant:
                return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'success': True, 'message': 'Если email найден, код отправлен'})}

            code = generate_code()
            expires_at = datetime.utcnow() + timedelta(minutes=15)

            cur.execute(
                f'UPDATE {SCHEMA}.participants SET reset_code = %s, reset_code_expires_at = %s WHERE id = %s',
                (code, expires_at, participant['id'])
            )

            try:
                send_email(participant['email'], code, participant['full_name'])
            except Exception as smtp_err:
                print(f'[SMTP ERROR] {smtp_err}')
                return {
                    'statusCode': 500,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Ошибка отправки письма: {smtp_err}'})
                }

            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'message': 'Код отправлен на email'})
            }

        elif action == 'confirm':
            email = (body.get('email') or '').strip().lower()
            code = (body.get('code') or '').strip()
            new_password = body.get('new_password', '')

            if not email or not code or not new_password:
                return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Укажите email, код и новый пароль'})}

            if len(new_password) < 6:
                return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Пароль должен содержать минимум 6 символов'})}

            cur.execute(
                f'SELECT id, reset_code, reset_code_expires_at FROM {SCHEMA}.participants WHERE LOWER(email) = %s',
                (email,)
            )
            participant = cur.fetchone()

            if not participant or participant['reset_code'] != code:
                return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Неверный код подтверждения'})}

            if not participant['reset_code_expires_at'] or datetime.utcnow() > participant['reset_code_expires_at']:
                return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Код истёк. Запросите новый.'})}

            new_hash = hash_password(new_password)
            cur.execute(
                f'UPDATE {SCHEMA}.participants SET password_hash = %s, reset_code = NULL, reset_code_expires_at = NULL WHERE id = %s',
                (new_hash, participant['id'])
            )

            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'message': 'Пароль успешно изменён'})
            }

        else:
            return {'statusCode': 400, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Неизвестное действие'})}