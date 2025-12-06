"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Save, MessageCircle, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Integrations() {
    const { t } = useLanguage();
    const [config, setConfig] = useState({
        telegram_token: "",
        telegram_enabled: false,
        gmail_email: "",
        gmail_password: "",
        gmail_enabled: false,
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<string | null>(null);

    useEffect(() => {
        axios.get("http://localhost:8000/api/v1/admin/settings")
            .then(res => {
                const { telegram_token, telegram_enabled, gmail_email, gmail_password, gmail_enabled } = res.data;
                setConfig({ telegram_token, telegram_enabled, gmail_email, gmail_password, gmail_enabled });
            })
            .catch(err => console.error("Failed to load settings", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setConfig(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        setStatus(null);
        try {
            const currentSettings = await axios.get("http://localhost:8000/api/v1/admin/settings");
            const newConfig = { ...currentSettings.data, ...config };

            await axios.post("http://localhost:8000/api/v1/admin/settings", newConfig);
            setStatus("success");
            setTimeout(() => setStatus(null), 3000);
        } catch (err) {
            console.error(err);
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">{t.integrations}</h1>
            <p className="text-gray-400">{t.connectChannels}</p>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <MessageCircle className="h-6 w-6 text-blue-400" />
                            {t.telegramBot}
                        </h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="telegram_enabled"
                                checked={config.telegram_enabled}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>
                    <p className="text-sm text-gray-400">
                        {t.enterBotToken}
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.botToken}</label>
                        <input
                            type="text"
                            name="telegram_token"
                            value={config.telegram_token || ""}
                            onChange={handleChange}
                            placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz..."
                            className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600"
                        />
                    </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                            <Mail className="h-6 w-6 text-red-400" />
                            {t.gmail}
                        </h2>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                name="gmail_enabled"
                                checked={config.gmail_enabled}
                                onChange={handleChange}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                        </label>
                    </div>
                    <p className="text-sm text-gray-400">
                        {t.connectGmail}
                    </p>
                    <div className="space-y-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.emailAddress}</label>
                            <input
                                type="email"
                                name="gmail_email"
                                value={config.gmail_email || ""}
                                onChange={handleChange}
                                placeholder="support@company.com"
                                className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-red-600"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.appPassword}</label>
                            <input
                                type="password"
                                name="gmail_password"
                                value={config.gmail_password || ""}
                                onChange={handleChange}
                                placeholder="xxxx xxxx xxxx xxxx"
                                className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-red-600"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end sticky bottom-6 bg-transparent">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-900/20"
                >
                    {loading ? t.saving : t.saveIntegrations}
                    {!loading && <Save className="h-5 w-5" />}
                </button>
            </div>

            {status === "success" && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-900/90 text-green-100 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-fade-in-up">
                    <CheckCircle className="h-5 w-5" />
                    {t.settingsSaved}
                </div>
            )}
            {status === "error" && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-red-900/90 text-red-100 px-6 py-3 rounded-full shadow-xl flex items-center gap-3 animate-fade-in-up">
                    <AlertCircle className="h-5 w-5" />
                    {t.saveFailed}
                </div>
            )}
        </div>
    );
}
