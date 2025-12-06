"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Send, CheckCircle, RefreshCcw, MessageCircle, Mail, Clock, AlertTriangle } from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

interface Ticket {
    id: string;
    timestamp: number;
    text: string;
    source: string;
    translations?: {
        en: string;
        ru: string;
        kk: string;
    };
    contact_info: any;
}

export default function OperatorsPage() {
    const { t } = useLanguage();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [replyText, setReplyText] = useState("");
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(false);

    const fetchTickets = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/v1/admin/operator/tickets");
            setTickets(res.data);
            if (res.data.length > 0 && !selectedTicket) {
                setSelectedTicket(res.data[0]);
            }
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }, []);

    const handleSendReply = async () => {
        if (!selectedTicket || !replyText) return;
        setLoading(true);
        try {
            await axios.post("http://localhost:8000/api/v1/admin/operator/reply", {
                ticket_id: selectedTicket.id,
                reply_text: replyText
            });
            alert("Reply sent!");
            setReplyText("");
            await fetchTickets();
            setSelectedTicket(null); // Clear selection or move to next
        } catch (e) {
            alert("Failed to send reply");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
                <h1 className="text-3xl font-bold text-white">{t.operatorDashboard}</h1>
                <button
                    onClick={fetchTickets}
                    className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
                >
                    <RefreshCcw className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Ticket List */}
                <div className="w-1/3 rounded-xl border border-gray-800 bg-gray-950 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-800 bg-gray-900/50">
                        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{t.pendingRequests}</h2>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {tickets.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-48 text-gray-500 gap-2">
                                <CheckCircle className="h-8 w-8 opacity-50" />
                                <p>{t.allClear}</p>
                            </div>
                        )}
                        {tickets.map(t => (
                            <div
                                key={t.id}
                                onClick={() => setSelectedTicket(t)}
                                className={`p-4 rounded-lg border cursor-pointer transition-all ${selectedTicket?.id === t.id
                                    ? 'bg-blue-900/20 border-blue-500/50 ring-1 ring-blue-500/20'
                                    : 'bg-gray-900/50 border-gray-800 hover:bg-gray-800 hover:border-gray-700'}`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        {t.source === 'telegram' ? (
                                            <div className="bg-blue-500/10 p-1.5 rounded-md">
                                                <Send className="h-3 w-3 text-blue-400" />
                                            </div>
                                        ) : (
                                            <div className="bg-red-500/10 p-1.5 rounded-md">
                                                <Mail className="h-3 w-3 text-red-400" />
                                            </div>
                                        )}
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${t.source === 'telegram' ? 'bg-blue-900/30 text-blue-200' : 'bg-red-900/30 text-red-200'}`}>
                                            {t.source}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(t.timestamp * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 line-clamp-2 font-medium">{t.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail View */}
                <div className="flex-1 rounded-xl border border-gray-800 bg-gray-950 flex flex-col overflow-hidden">
                    {selectedTicket ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="mb-6 flex items-start gap-4">
                                    <div className="p-3 rounded-xl bg-gray-900 border border-gray-800">
                                        <AlertTriangle className="h-6 w-6 text-orange-500" />
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-lg font-bold text-white mb-1">{t.escalatedRequest}</h2>
                                        <p className="text-gray-400 text-sm">{t.reviewRequest}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 group hover:border-gray-700 transition-colors">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span> {t.english}
                                        </h3>
                                        <p className="text-sm text-gray-200 leading-relaxed">{selectedTicket.translations?.en || "N/A"}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 group hover:border-gray-700 transition-colors">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> {t.russian}
                                        </h3>
                                        <p className="text-sm text-gray-200 leading-relaxed">{selectedTicket.translations?.ru || "N/A"}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-gray-900 border border-gray-800 group hover:border-gray-700 transition-colors">
                                        <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span> {t.kazakh}
                                        </h3>
                                        <p className="text-sm text-gray-200 leading-relaxed">{selectedTicket.translations?.kk || "N/A"}</p>
                                    </div>
                                </div>

                                <div className="p-5 rounded-xl bg-gray-900 border border-gray-800 mb-6">
                                    <h3 className="text-xs font-semibold text-gray-400 mb-3 uppercase">{t.originalMessage}</h3>
                                    <p className="text-white text-base leading-relaxed p-2 bg-gray-800 rounded-lg">{selectedTicket.text}</p>
                                </div>
                            </div>

                            {/* Reply Area */}
                            <div className="p-4 border-t border-gray-800 bg-gray-900/30">
                                <div className="flex gap-4 items-start">
                                    <textarea
                                        className="flex-1 h-24 bg-gray-950 border border-gray-800 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none text-sm"
                                        placeholder={t.typeReply}
                                        value={replyText}
                                        onChange={(e) => setReplyText(e.target.value)}
                                    />
                                    <button
                                        onClick={handleSendReply}
                                        disabled={loading || !replyText.trim()}
                                        className="h-24 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium flex flex-col items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-900/20"
                                    >
                                        {loading ? (
                                            <RefreshCcw className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <>
                                                <Send className="h-5 w-5" />
                                                <span className="text-xs">{t.reply}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-4">
                            <div className="p-4 rounded-full bg-gray-900 border border-gray-800">
                                <MessageCircle className="h-8 w-8 opacity-50" />
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-medium text-gray-400">{t.noTicketSelected}</p>
                                <p className="text-sm">{t.selectTicketHint}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
