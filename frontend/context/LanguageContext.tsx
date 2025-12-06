"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'en' | 'ru' | 'kk';

type Translations = {
    [key in Language]: {
        [key: string]: string;
    }
};

const translations: Translations = {
    en: {
        dashboard: "Dashboard",
        integrations: "Integrations",
        operators: "For Operators",
        feedback: "Feedback",
        settings: "Settings",

        // Dashboard
        real: "Real",
        playground: "Playground",
        autoResolutionRate: "Auto-Resolution Rate",
        avgResponseTime: "Avg. Response Time",
        totalTickets: "Total Tickets",
        escalatedToHuman: "Escalated to Human",
        recentActivity: "Recent Activity",
        topIssues: "Top Issues",
        noRecentActivity: "No recent activity",
        noCriticalIssues: "No critical issues",
        userDislike: "User Dislike",
        escalation: "Escalation",

        // Operators
        operatorDashboard: "Operator Dashboard",
        pendingRequests: "Pending Requests",
        allClear: "All clear! No pending tickets.",
        translationContext: "Translation & Context",
        originalMessage: "Original Message",
        reply: "Reply",
        sendReply: "Send Reply",
        typeReply: "Type your professional response here...",
        sending: "Sending...",
        noTicketSelected: "No Ticket Selected",
        selectTicketHint: "Choose a pending request from the list to view details.",
        escalatedRequest: "Escalated Request",
        reviewRequest: "Review the user request and translations below.",

        // RAG Control
        knowledgeBase: "Knowledge Base (RAG)",
        syncToVectorDB: "Sync to Vector DB",
        uploading: "Uploading...",
        dragDrop: "Drag & drop files here",
        supportedFormats: "PDF, DOCX, TXT, CSV supported",
        stagedFiles: "Staged Files",
        noFilesSelected: "No files selected",
        indexedDocuments: "Indexed Documents",
        noDocumentsIndex: "No documents in index",
        deleteConfirm: "Are you sure you want to delete",

        // Settings
        personaSettings: "Persona & Settings",
        modelConfig: "Model Configuration",
        llmModel: "LLM Model",
        embeddingModel: "Embedding Model",
        rerankerModel: "Reranker Model",
        temperature: "Temperature",
        topK: "Top K",
        personaStyle: "Persona & Style",
        systemPrompt: "System Prompt",
        maxAnswerLength: "Max Answer Length",
        styleCopyMethod: "Style Copy Method",
        preferConcise: "Prefer Concise Answers",
        enableCritic: "Enable Critic Loop",
        styleExtraction: "Style Extraction",
        pasteText: "Paste text here to extract style features...",
        analyzeStyle: "Analyze Style",
        analyzing: "Analyzing...",
        analysisResults: "Analysis Results",
        applyToPersona: "Apply to Persona",
        clearFeedback: "Clear Feedback History",
        saveSettings: "Save All Settings",
        saveSuccess: "Settings saved!",
        saveFail: "Failed to save settings.",

        // Playground
        simulatedTraffic: "Simulated Traffic",
        successRate: "Success Rate",
        avgResponse: "Avg Response",
        typeMessage: "Type a message...",
        thinking: "Thinking...",
        welcomeMessage: "Hello! I am the AI Help Desk agent. How can I assist you?",

        // Feedback
        feedbackLabeling: "Feedback & Labeling",
        downloadDataset: "Download Dataset",
        recentInteractions: "Recent Interactions",
        reviewCorrect: "Review & Correct",
        userQuery: "User Query",
        systemAction: "System Action",
        correctAnswer: "Correct Answer (Train AI)",
        writeIdealResponse: "Write the ideal response here to add it to the Few-Shot examples...",
        addToKnowledgeBase: "Add to Knowledge Base",
        selectInteraction: "Select an interaction from the left to review it.",

        // Integrations
        connectChannels: "Connect your AI assistant to external communication channels.",
        telegramBot: "Telegram Bot",
        enterBotToken: "Enter your Bot Token from @BotFather. The bot will reply to messages using the configured AI persona.",
        botToken: "Bot Token",
        gmail: "Gmail",
        connectGmail: "Connect to Gmail to auto-reply to emails. Use an App Password, not your regular password.",
        emailAddress: "Email Address",
        appPassword: "App Password",
        saveIntegrations: "Save Integrations",
        saving: "Saving...",
        settingsSaved: "Settings saved successfully",
        saveFailed: "Failed to save settings",

        // General
        english: "English",
        russian: "Russian",
        kazakh: "Kazakh",
    },
    ru: {
        dashboard: "Дашборд",
        integrations: "Интеграции",
        operators: "Для Операторов",
        feedback: "Обратная связь",
        settings: "Настройки",

        real: "Реальный",
        playground: "Песочница",
        autoResolutionRate: "Уровень авто-решений",
        avgResponseTime: "Среднее время ответа",
        totalTickets: "Всего тикетов",
        escalatedToHuman: "Передано человеку",
        recentActivity: "Недавняя активность",
        topIssues: "Главные проблемы",
        noRecentActivity: "Нет недавней активности",
        noCriticalIssues: "Нет критических проблем",
        userDislike: "Дизлайк пользователя",
        escalation: "Эскалация",

        operatorDashboard: "Панель Оператора",
        pendingRequests: "Ожидающие запросы",
        allClear: "Все чисто! Нет ожидающих тикетов.",
        translationContext: "Перевод и Контекст",
        originalMessage: "Оригинальное сообщение",
        reply: "Ответить",
        sendReply: "Отправить ответ",
        typeReply: "Введите ваш профессиональный ответ здесь...",
        sending: "Отправка...",
        noTicketSelected: "Тикет не выбран",
        selectTicketHint: "Выберите ожидающий запрос из списка для просмотра деталей.",
        escalatedRequest: "Эскалированный запрос",
        reviewRequest: "Ознакомьтесь с запросом пользователя и переводами ниже.",

        // RAG Control
        knowledgeBase: "База Знаний (RAG)",
        syncToVectorDB: "Синхронизация с Vector DB",
        uploading: "Загрузка...",
        dragDrop: "Перетащите файлы сюда",
        supportedFormats: "Поддерживаются PDF, DOCX, TXT, CSV",
        stagedFiles: "Подготовленные файлы",
        noFilesSelected: "Файлы не выбраны",
        indexedDocuments: "Индексированные документы",
        noDocumentsIndex: "Нет документов в индексе",
        deleteConfirm: "Вы уверены, что хотите удалить",

        // Settings
        personaSettings: "Персона и Настройки",
        modelConfig: "Конфигурация Модели",
        llmModel: "LLM Модель",
        embeddingModel: "Embedding Модель",
        rerankerModel: "Reranker Модель",
        temperature: "Температура",
        topK: "Top K",
        personaStyle: "Персона и Стиль",
        systemPrompt: "Системный Промпт",
        maxAnswerLength: "Макс. длина ответа",
        styleCopyMethod: "Метод копирования стиля",
        preferConcise: "Предпочитать краткие ответы",
        enableCritic: "Включить цикл критики",
        styleExtraction: "Извлечение стиля",
        pasteText: "Вставьте текст для анализа стиля...",
        analyzeStyle: "Анализировать стиль",
        analyzing: "Анализ...",
        analysisResults: "Результаты анализа",
        applyToPersona: "Применить к персоне",
        clearFeedback: "Очистить историю отзывов",
        saveSettings: "Сохранить все настройки",
        saveSuccess: "Настройки сохранены!",
        saveFail: "Не удалось сохранить настройки.",

        // Playground
        simulatedTraffic: "Симуляция трафика",
        successRate: "Успешность",
        avgResponse: "Ср. время ответа",
        typeMessage: "Введите сообщение...",
        thinking: "Думаю...",
        welcomeMessage: "Привет! Я ИИ-агент поддержки. Чем могу помочь?",

        // Feedback
        feedbackLabeling: "Отзывы и Разметка",
        downloadDataset: "Скачать датасет",
        recentInteractions: "Недавние диалоги",
        reviewCorrect: "Проверка и Исправление",
        userQuery: "Запрос пользователя",
        systemAction: "Действие системы",
        correctAnswer: "Правильный ответ (Обучение ИИ)",
        writeIdealResponse: "Напишите идеальный ответ здесь, чтобы добавить его в примеры...",
        addToKnowledgeBase: "Добавить в Базу Знаний",
        selectInteraction: "Выберите диалог слева для просмотра.",

        // Integrations
        connectChannels: "Подключите вашего ИИ-ассистента к внешним каналам связи.",
        telegramBot: "Telegram Бот",
        enterBotToken: "Введите токен бота от @BotFather. Бот будет отвечать, используя настроенную персону ИИ.",
        botToken: "Токен Бота",
        gmail: "Gmail",
        connectGmail: "Подключите Gmail для автоответов. Используйте Пароль Приложения, а не обычный пароль.",
        emailAddress: "Email адрес",
        appPassword: "Пароль приложения",
        saveIntegrations: "Сохранить интеграции",
        saving: "Сохранение...",
        settingsSaved: "Настройки успешно сохранены",
        saveFailed: "Ошибка сохранения настроек",

        english: "Английский",
        russian: "Русский",
        kazakh: "Казахский",
    },
    kk: {
        dashboard: "Бақылау тақтасы",
        integrations: "Интеграциялар",
        operators: "Операторлар үшін",
        feedback: "Кері байланыс",
        settings: "Баптаулар",

        real: "Нақты",
        playground: "Ойын алаңы",
        autoResolutionRate: "Авто-шешім деңгейі",
        avgResponseTime: "Орташа жауап уақыты",
        totalTickets: "Барлық билеттер",
        escalatedToHuman: "Адамға жіберілді",
        recentActivity: "Соңғы белсенділік",
        topIssues: "Басты мәселелер",
        noRecentActivity: "Соңғы белсенділік жоқ",
        noCriticalIssues: "Критикалық мәселелер жоқ",
        userDislike: "Пайдаланушы ұнатпады",
        escalation: "Деңгейлету",

        operatorDashboard: "Оператор тақтасы",
        pendingRequests: "Күтудегі сұраулар",
        allClear: "Барлығы таза! Күтудегі билеттер жоқ.",
        translationContext: "Аударма және Мәнмəтін",
        originalMessage: "Түпнұсқа хабарлама",
        reply: "Жауап беру",
        sendReply: "Жауап жіберу",
        typeReply: "Кәсіби жауабыңызды осында жазыңыз...",
        sending: "Жіберілуде...",
        noTicketSelected: "Билет таңдалмады",
        selectTicketHint: "Мәліметтерді көру үшін тізімнен күтудегі сұрауды таңдаңыз.",
        escalatedRequest: "Деңгейлетілген сұрау",
        reviewRequest: "Төмендегі пайдаланушы сұрауы мен аудармаларын қарап шығыңыз.",

        // RAG Control
        knowledgeBase: "Білім базасы (RAG)",
        syncToVectorDB: "Vector DB-мен синхрондау",
        uploading: "Жүктелуде...",
        dragDrop: "Файлдарды осында сүйреңіз",
        supportedFormats: "PDF, DOCX, TXT, CSV қолдау көрсетіледі",
        stagedFiles: "Дайындалған файлдар",
        noFilesSelected: "Файлдар таңдалмады",
        indexedDocuments: "Индекстелген құжаттар",
        noDocumentsIndex: "Индексте құжаттар жоқ",
        deleteConfirm: "Сіз жойғыңыз келетініне сенімдісіз бе",

        // Settings
        personaSettings: "Тұлға және Параметрлер",
        modelConfig: "Модель конфигурациясы",
        llmModel: "LLM Моделі",
        embeddingModel: "Embedding Моделі",
        rerankerModel: "Reranker Моделі",
        temperature: "Температура",
        topK: "Top K",
        personaStyle: "Тұлға және стиль",
        systemPrompt: "Жүйелік нұсқау (Prompt)",
        maxAnswerLength: "Жауаптың макс. ұзындығы",
        styleCopyMethod: "Стильді көшіру әдісі",
        preferConcise: "Қысқа жауаптарды қалау",
        enableCritic: "Сын циклін қосу",
        styleExtraction: "Стильді шығару",
        pasteText: "Стильді талдау үшін мәтінді осында қойыңыз...",
        analyzeStyle: "Стильді талдау",
        analyzing: "Талдау...",
        analysisResults: "Талдау нәтижелері",
        applyToPersona: "Тұлғаға қолдану",
        clearFeedback: "Пікірлер тарихын тазалау",
        saveSettings: "Барлық параметрлерді сақтау",
        saveSuccess: "Параметрлер сақталды!",
        saveFail: "Параметрлерді сақтау сәтсіз аяқталды.",

        // Playground
        simulatedTraffic: "Трафикті модельдеу",
        successRate: "Сәттілік пайызы",
        avgResponse: "Орт. жауап уақыты",
        typeMessage: "Хабарлама жазыңыз...",
        thinking: "Ойлануда...",
        welcomeMessage: "Сәлем! Мен AI қолдау агентімін. Сізге қалай көмектесе аламын?",

        // Feedback
        feedbackLabeling: "Пікірлер және белгілеу",
        downloadDataset: "Деректер жиынтығын жүктеу",
        recentInteractions: "Соңғы әрекеттесулер",
        reviewCorrect: "Тексеру және түзету",
        userQuery: "Пайдаланушы сұрауы",
        systemAction: "Жүйе әрекеті",
        correctAnswer: "Дұрыс жауап (AI оқыту)",
        writeIdealResponse: "Few-Shot мысалдарына қосу үшін идеалды жауапты осында жазыңыз...",
        addToKnowledgeBase: "Білім базасына қосу",
        selectInteraction: "Қарау үшін сол жақтан диалогты таңдаңыз.",

        // Integrations
        connectChannels: "AI көмекшісін сыртқы байланыс арналарына қосыңыз.",
        telegramBot: "Telegram Бот",
        enterBotToken: "@BotFather-дан бот токенін енгізіңіз. Бот конфигурацияланған AI тұлғасын пайдаланып жауап береді.",
        botToken: "Бот Токені",
        gmail: "Gmail",
        connectGmail: "Электрондық хаттарға автоматты түрде жауап беру үшін Gmail-ге қосылыңыз. Қолданба құпия сөзін пайдаланыңыз.",
        emailAddress: "Email мекенжайы",
        appPassword: "Қолданба құпия сөзі",
        saveIntegrations: "Интеграцияларды сақтау",
        saving: "Сақталуда...",
        settingsSaved: "Параметрлер сәтті сақталды",
        saveFailed: "Параметрлерді сақтау сәтсіз",

        english: "Ағылшын",
        russian: "Орыс",
        kazakh: "Қазақ",
    }
};

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: Translations[Language];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguage] = useState<Language>('en');

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
}
