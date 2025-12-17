import json
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
from pydantic import BaseModel, EmailStr, Field

class ContactRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    subject: str = Field(..., min_length=1, max_length=200)
    message: str = Field(..., min_length=1, max_length=2000)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Отправляет письма с контактной формы на email indigo_fest@mail.ru
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Parse and validate request
    body_data = json.loads(event.get('body', '{}'))
    contact_req = ContactRequest(**body_data)
    
    # Get SMTP credentials
    smtp_host = os.environ.get('SMTP_HOST')
    smtp_port = int(os.environ.get('SMTP_PORT', '465'))
    smtp_user = os.environ.get('SMTP_USER')
    smtp_password = os.environ.get('SMTP_PASSWORD')
    
    # Create email message
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"Новое сообщение с сайта: {contact_req.subject}"
    msg['From'] = smtp_user
    msg['To'] = 'indigo_fest@mail.ru'
    msg['Reply-To'] = contact_req.email
    
    # Create HTML body
    message_html = contact_req.message.replace('\n', '<br>')
    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #6366f1;">Новое сообщение с контактной формы</h2>
        <p><strong>От:</strong> {contact_req.name}</p>
        <p><strong>Email:</strong> {contact_req.email}</p>
        <p><strong>Тема:</strong> {contact_req.subject}</p>
        <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
        <p><strong>Сообщение:</strong></p>
        <p style="background-color: #f9fafb; padding: 15px; border-radius: 5px;">
          {message_html}
        </p>
      </body>
    </html>
    """
    
    # Attach HTML part
    html_part = MIMEText(html_body, 'html', 'utf-8')
    msg.attach(html_part)
    
    # Send email via SMTP
    with smtplib.SMTP_SSL(smtp_host, smtp_port) as server:
        server.login(smtp_user, smtp_password)
        server.send_message(msg)
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'success': True, 'message': 'Письмо отправлено'}),
        'isBase64Encoded': False
    }