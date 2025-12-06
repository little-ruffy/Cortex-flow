import asyncio
import imaplib
import smtplib
import email
from email.mime.text import MIMEText
from app.services.ai_engine import ai_engine
import time

class EmailBotService:
    def __init__(self):
        self.is_running = False

    async def start_loop(self):
        print("Email Service: Background loop init...")
        while True:
            try:
                if ai_engine.config.gmail_enabled and ai_engine.config.gmail_email and ai_engine.config.gmail_password:
                     await self.check_emails()
                else:
                    pass
            except Exception as e:
                print(f"Email Service Error: {e}")
            
            await asyncio.sleep(60)

    async def check_emails(self):
        try:
            mail = imaplib.IMAP4_SSL("imap.gmail.com")
            mail.login(ai_engine.config.gmail_email, ai_engine.config.gmail_password)
            mail.select("inbox")

            status, messages = mail.search(None, '(UNSEEN)')
            if status != "OK":
                return

            msg_ids = messages[0].split()
            for msg_id in msg_ids:
                status, msg_data = mail.fetch(msg_id, "(RFC822)")
                for response_part in msg_data:
                    if isinstance(response_part, tuple):
                        msg = email.message_from_bytes(response_part[1])
                        subject = email.header.decode_header(msg["Subject"])[0][0]
                        if isinstance(subject, bytes):
                            subject = subject.decode()
                        
                        sender = msg.get("From")
                        
                        body = ""
                        if msg.is_multipart():
                            for part in msg.walk():
                                if part.get_content_type() == "text/plain":
                                    body = part.get_payload(decode=True).decode()
                                    break
                        else:
                            body = msg.get_payload(decode=True).decode()

                        print(f"Email received from {sender}: {subject}")
                        
                        full_text = f"Subject: {subject}\n\n{body}"
                        
                        result = await ai_engine.process_incoming_request(full_text, "email")
                        action = result.get("action")
                        response_text = result.get("response", "")
                        
                        if action == "escalate" or "[ESCALATE]" in response_text:
                             from deep_translator import GoogleTranslator
                             text_content = full_text[:500]
                             try:
                                 tr_en = GoogleTranslator(source='auto', target='en').translate(text_content)
                                 tr_ru = GoogleTranslator(source='auto', target='ru').translate(text_content)
                                 tr_kk = GoogleTranslator(source='auto', target='kk').translate(text_content)
                             except:
                                 tr_en, tr_ru, tr_kk = text_content, text_content, text_content

                             from app.api.endpoints.ingest import LogEntry, ingest_log
                             await ingest_log(LogEntry(
                                 text=f"Subject: {subject}",
                                 source="email",
                                 status="pending",
                                 contact_info={"email": sender},
                                 translations={"en": tr_en, "ru": tr_ru, "kk": tr_kk},
                                 result={"action": "escalate", "response": "Ticket created"}
                             ))
                             self.send_reply(sender, subject, "Your request has been forwarded to a specialist.")
                             
                        elif action == "auto_reply":
                            from app.api.endpoints.ingest import LogEntry, ingest_log
                            await ingest_log(LogEntry(
                                 text=f"Subject: {subject}",
                                 source="email",
                                 result={"action": "auto_reply", "response": response_text}
                            ))

                            self.send_reply(sender, subject, response_text)

                        elif action == "ignore":
                            print(f"Email: Ignored spam from {sender}")
            
            mail.close()
            mail.logout()
        except Exception as e:
            print(f"IMAP Error: {e}")

    def send_reply(self, to_email, subject, body):
        try:
            msg = MIMEText(body)
            msg['Subject'] = f"Re: {subject}"
            msg['From'] = ai_engine.config.gmail_email
            msg['To'] = to_email

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(ai_engine.config.gmail_email, ai_engine.config.gmail_password)
                server.send_message(msg)
                print(f"Reply sent to {to_email}")
        except Exception as e:
            print(f"SMTP Error: {e}")

email_service = EmailBotService()
