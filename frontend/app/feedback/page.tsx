"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { MessageSquare, ThumbsUp, ThumbsDown, Plus, ArrowRight, Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface FeedbackLog {
    text: string;
    source: string;
    result: any;
    rating?: string;
}

export default function FeedbackPage() {
    const { t } = useLanguage();
    const [logs, setLogs] = useState<FeedbackLog[]>([]);
    const [selectedLog, setSelectedLog] = useState<FeedbackLog | null>(null);
    const [selectedIndex, setSelectedIndex] = useState<number>(-1);
    const [correction, setCorrection] = useState("");

    useEffect(() => {
        axios.get("http://localhost:8000/api/v1/admin/feedback")
            .then(res => setLogs(res.data.reverse()))
            .catch(err => console.error(err));
    }, []);

    const addToKnowledgeBase = async () => {
        if (!selectedLog || !correction) return;
        try {
            await axios.post("http://localhost:8000/api/v1/admin/feedback/add-few-shot", {
                user_query: selectedLog.text,
                assistant_response: correction
            });
            alert("Added to Knowledge Base as Few-Shot Example!");
            setCorrection("");
            setSelectedLog(null);
        } catch (err) {
            console.error(err);
            alert("Failed to add.");
        }
    };

    const handleRate = async (index: number, rating: string) => {
        const realIndex = logs.length - 1 - index;

        try {
            await axios.post(`http://localhost:8000/api/v1/admin/feedback/${realIndex}/rate`, { rating });
            const newLogs = [...logs];
            newLogs[index].rating = rating;
            setLogs(newLogs);
            if (selectedLog === logs[index]) {
                setSelectedLog({ ...logs[index], rating });
            }
        } catch (err) {
            console.error(err);
            alert("Rating failed");
        }
    }

    const handleDownload = () => {
        window.open("http://localhost:8000/api/v1/admin/feedback/download", "_blank");
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">{t.feedbackLabeling}</h1>
                <button
                    onClick={handleDownload}
                    className="flex items-center gap-2 rounded-lg bg-gray-800 px-4 py-2 font-medium text-white hover:bg-gray-700 border border-gray-700"
                >
                    <Download className="h-4 w-4" />
                    {t.downloadDataset}
                </button>
            </div>

            <div className="flex gap-6 h-[calc(100vh-10rem)]">
                <div className="w-1/2 flex flex-col rounded-xl border border-gray-800 bg-gray-950 p-4">
                    <h2 className="mb-4 text-xl font-semibold text-white">{t.recentInteractions}</h2>
                    <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                        {logs.map((log, idx) => (
                            <div
                                key={idx}
                                onClick={() => { setSelectedLog(log); setSelectedIndex(idx); setCorrection(""); }}
                                className={`cursor-pointer rounded-lg border p-4 transition-colors ${selectedLog === log
                                    ? "border-blue-500 bg-gray-800"
                                    : "border-gray-800 bg-gray-800 hover:border-gray-600"
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex gap-2">
                                        <span className="text-xs font-mono text-gray-500 bg-gray-800 px-2 py-1 rounded">{log.source}</span>
                                        <span className={`text-xs px-2 py-1 rounded ${log.result?.action === "auto_reply" ? "bg-green-900 text-green-300" :
                                            log.result?.action === "escalate" ? "bg-orange-900 text-orange-300" :
                                                "bg-gray-700 text-gray-300"
                                            }`}>
                                            {log.result?.action}
                                        </span>
                                    </div>
                                    <div className="flex gap-1">
                                        {log.rating === "like" && <ThumbsUp className="h-4 w-4 text-green-400" />}
                                        {log.rating === "dislike" && <ThumbsDown className="h-4 w-4 text-red-400" />}
                                    </div>
                                </div>
                                <p className="text-sm text-white font-medium mb-1 line-clamp-2">{log.text}</p>
                                {log.result?.response && (
                                    <p className="text-xs text-gray-400 line-clamp-2">{log.result.response}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex-1 rounded-xl border border-gray-800 bg-gray-950 p-6 flex flex-col">
                    {selectedLog ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-semibold text-white">{t.reviewCorrect}</h2>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRate(selectedIndex, "like"); }}
                                        className={`p-2 rounded hover:bg-gray-800 ${selectedLog.rating === "like" ? "text-green-400" : "text-gray-400"}`}
                                    >
                                        <ThumbsUp className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleRate(selectedIndex, "dislike"); }}
                                        className={`p-2 rounded hover:bg-gray-800 ${selectedLog.rating === "dislike" ? "text-red-400" : "text-gray-400"}`}
                                    >
                                        <ThumbsDown className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto">
                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">{t.userQuery}</label>
                                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-800 text-white">
                                        {selectedLog.text}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">{t.systemAction}</label>
                                    <div className="p-3 bg-gray-800 rounded-lg border border-gray-800 text-gray-300 font-mono text-sm overflow-x-auto">
                                        {JSON.stringify(selectedLog.result, null, 2)}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm text-gray-400">{t.correctAnswer}</label>
                                    <textarea
                                        rows={8}
                                        value={correction}
                                        onChange={(e) => setCorrection(e.target.value)}
                                        placeholder={t.writeIdealResponse}
                                        className="w-full rounded-lg border border-gray-800 bg-gray-800 p-3 text-white outline-none focus:border-blue-600"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={addToKnowledgeBase}
                                    disabled={!correction}
                                    className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="h-5 w-5" />
                                    {t.addToKnowledgeBase}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <ArrowRight className="h-12 w-12 mb-4 opacity-50" />
                            <p>{t.selectInteraction}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
