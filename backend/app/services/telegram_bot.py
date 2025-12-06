import asyncio
from telegram import Update
from telegram.ext import ApplicationBuilder, ContextTypes, CommandHandler, MessageHandler, filters
from app.services.ai_engine import ai_engine
import logging

logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)

class TelegramBotService:
    def __init__(self):
        self.application = None
        self.is_running = False
        self._task = None

    async def start(self):
        token = ai_engine.config.telegram_token
        if not token or not ai_engine.config.telegram_enabled:
            print("Telegram Service: Disabled or No Token")
            return

        print("Telegram Service: Starting...")
        self.application = ApplicationBuilder().token(token).build()
        
        start_handler = CommandHandler('start', self.start_command)
        message_handler = MessageHandler(filters.TEXT & (~filters.COMMAND), self.handle_message)
        
        self.application.add_handler(start_handler)
        self.application.add_handler(message_handler)

        self.is_running = True
        
        await self.application.initialize()
        await self.application.start()
        
        await self.application.updater.start_polling()
        print("Telegram Service: Polling started")

    async def stop(self):
        if self.application and self.is_running:
            await self.application.updater.stop()
            await self.application.stop()
            await self.application.shutdown()
            self.is_running = False
            print("Telegram Service: Stopped")

    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        await context.bot.send_message(chat_id=update.effective_chat.id, text="Hello! I am your AI Assistant. How can I help you today?")

    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        user_text = update.message.text
        chat_id = update.effective_chat.id
        
        print(f"Telegram received: {user_text}")
        
        try:
             result = await ai_engine.process_incoming_request(user_text, "telegram")
             
             action = result.get("action")
             response_text = result.get("response", "")
             
             if action == "escalate" or "[ESCALATE]" in response_text:
                 from deep_translator import GoogleTranslator
                 
                 try:
                     tr_en = GoogleTranslator(source='auto', target='en').translate(user_text)
                     tr_ru = GoogleTranslator(source='auto', target='ru').translate(user_text)
                     tr_kk = GoogleTranslator(source='auto', target='kk').translate(user_text)
                 except:
                     tr_en, tr_ru, tr_kk = user_text, user_text, user_text
                 
                 from app.api.endpoints.ingest import LogEntry, ingest_log
                 await ingest_log(LogEntry(
                     text=user_text,
                     source="telegram",
                     status="pending",
                     contact_info={"chat_id": chat_id},
                     translations={"en": tr_en, "ru": tr_ru, "kk": tr_kk},
                     result={"action": "escalate", "response": "Ticket created"}
                 ))
                 
                 await context.bot.send_message(chat_id=chat_id, text="I am forwarding your request to a human operator. Please wait.")
             
             elif action == "auto_reply":
                 from app.api.endpoints.ingest import LogEntry, ingest_log
                 await ingest_log(LogEntry(
                     text=user_text,
                     source="telegram",
                     result={"action": "auto_reply", "response": response_text}
                 ))
                 await context.bot.send_message(chat_id=chat_id, text=response_text)
                 
             elif action == "ignore":
                 print(f"Telegram: Ignored spam from {chat_id}")

        except Exception as e:
            await context.bot.send_message(chat_id=chat_id, text="Sorry, I encountered an error.")
            print(f"Telegram Error: {e}")

telegram_service = TelegramBotService()
