"use client";

import { useState } from "react";
import { Send } from "lucide-react";

import axios from "axios";

export default function Playground() {
    const [messages, setMessages] = useState<any[]>([
        { role: "assistant", content: "Hello! I am the AI Help Desk agent. How can I assist you?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMsg = { role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setLoading(true);

        try {
            const res = await axios.post("http://localhost:8000/api/v1/ingest/message", {
                text: input,
                source: "playground"
            });

            const data = res.data;
            let content = "";
            let sources: string[] = [];

            if (data.action === "auto_reply") {
                content = data.response;
                sources = data.sources || [];
            } else if (data.action === "escalate") {
                content = `[ESCALATED] Ticket created. Reason: ${data.classification?.type || "Complex issue"}. Priority: ${data.classification?.priority}`;
            } else if (data.action === "ignore") {
                content = "[IGNORED] Message classified as spam.";
            }

            const botMsg = {
                role: "assistant",
                content: content,
                sources: sources
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to AI Server." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-4rem)] flex-col gap-4">
            <h1 className="text-3xl font-bold text-white">Playground</h1>

            <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-950 p-6">
                <div className="space-y-6">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[80%] rounded-lg p-4 ${msg.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-800 text-gray-200"
                                }`}>
                                <p>{msg.content}</p>
                                {msg.sources && (
                                    <div className="mt-2 border-t border-gray-700 pt-2">
                                        <p className="mb-1 text-xs font-semibold text-gray-400">Sources:</p>
                                        <ul className="list-inside list-disc text-xs text-gray-500">
                                            {msg.sources.map((s: string, i: number) => (
                                                <li key={i}>{s}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="flex justify-start">
                            <div className="rounded-lg bg-gray-800 p-4 text-gray-400">
                                Thinking...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-gray-800 bg-gray-950 px-4 py-3 text-white outline-none focus:border-blue-600"
                />
                <button
                    onClick={sendMessage}
                    disabled={loading}
                    className="flex items-center justify-center rounded-lg bg-blue-600 px-6 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    <Send className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}
