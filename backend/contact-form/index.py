import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def handler(event: dict, context) -> dict:
    """
    Форма обратной связи — отправляет письмо на почту организации.
    POST {"name": "...", "email": "...", "subject": "...", "message": "..."}
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
    name = body.get('name', '').strip()
    email = body.get('email', '').strip()
    subject = body.get('subject', '').strip()
    message = body.get('message', '').strip()

    if not name or not email or not message:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Заполните все обязательные поля'})
        }

    smtp_host = os.environ['SMTP_HOST']
    smtp_port = int(os.environ['SMTP_PORT'])
    smtp_user = os.environ['SMTP_USER']
    smtp_password = os.environ['SMTP_PASSWORD']
    to_email = os.environ.get('SMTP_USER')

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Обратная связь: {subject or "Без темы"}'
    msg['From'] = smtp_user
    msg['To'] = to_email
    msg['Reply-To'] = email

    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px;">
      <h2 style="color: #6d28d9;">Новое сообщение с сайта ИНДИГО</h2>
      <p><b>Имя:</b> {name}</p>
      <p><b>Email:</b> {email}</p>
      <p><b>Тема:</b> {subject or '—'}</p>
      <hr/>
      <p><b>Сообщение:</b></p>
      <p style="white-space: pre-wrap;">{message}</p>
    </div>
    """
    msg.attach(MIMEText(html, 'html'))

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

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'success': True})
    }
