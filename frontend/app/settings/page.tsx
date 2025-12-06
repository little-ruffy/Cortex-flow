"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { Save, Sparkles, BarChart, Download } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function Settings() {
    const { t } = useLanguage();
    const [config, setConfig] = useState({
        llm_model: "",
        embedding_model: "",
        reranker_model: "",
        system_prompt: "",
        temperature: 0.7,
        top_k: 3,
        max_answer_length: 200,
        prefer_small_answers: false,
        enable_critic_loop: false,
        style_method: "rag",
        style_example_text: "",
    });
    const [loading, setLoading] = useState(false);

    const [analysisText, setAnalysisText] = useState("");
    const [analysisMetrics, setAnalysisMetrics] = useState<any>(null);
    const [analyzing, setAnalyzing] = useState(false);

    useEffect(() => {
        axios.get("http://localhost:8000/api/v1/admin/settings")
            .then(res => setConfig(prev => ({ ...prev, ...res.data })))
            .catch(err => console.error("Failed to load settings", err));
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;

        setConfig(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : (name === "temperature" || name === "top_k" || name === "max_answer_length" ? Number(value) : value)
        }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await axios.post("http://localhost:8000/api/v1/admin/settings", config);
            alert(t.saveSuccess);
        } catch (err) {
            console.error(err);
            alert(t.saveFail);
        } finally {
            setLoading(false);
        }
    };

    const analyzeStyle = async () => {
        if (!analysisText) return;
        setAnalyzing(true);
        try {
            const res = await axios.post("http://localhost:8000/api/v1/admin/analyze-style", { text: analysisText });
            setAnalysisMetrics(res.data);
        } catch (err) {
            console.error(err);
            alert("Analysis failed");
        } finally {
            setAnalyzing(false);
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-white">{t.personaSettings}</h1>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-400" />
                        {t.modelConfig}
                    </h2>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.llmModel}</label>
                        <select
                            name="llm_model"
                            value={config.llm_model}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600"
                        >
                            <option value="gpt-5-mini">GPT-5-Mini</option>
                            <option value="gpt-oss:20b">GPT-OSS:20b (Ollama)</option>
                            <option value="llama3:latest">Llava:13b (Ollama)</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.embeddingModel}</label>
                        <select
                            name="embedding_model"
                            value={config.embedding_model}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600"
                        >
                            <option value="sentence-transformers/all-MiniLM-L6-v2">sentence-transformers/all-MiniLM-L6-v2</option>
                            <option value="Qwen/Qwen3-Embedding-0.6B">Qwen/Qwen3-Embedding-0.6B</option>
                            <option value="BAAI/bge-large-en-v1.5">BAAI/bge-large-en-v1.5</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.rerankerModel}</label>
                        <select
                            name="reranker_model"
                            value={config.reranker_model}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600"
                        >
                            <option value="BAAI/bge-reranker-v2-m3">BAAI/bge-reranker-v2-m3</option>
                            <option value="Qwen/Qwen3-Reranker-0.6B">Qwen/Qwen3-Reranker-0.6B</option>
                            <option value="cross-encoder/ms-marco-MiniLM-L-6-v2">cross-encoder/ms-marco-MiniLM-L-6-v2</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.temperature}</label>
                            <input type="number" step="0.1" name="temperature" value={config.temperature} onChange={handleChange} className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.topK}</label>
                            <input type="number" name="top_k" value={config.top_k} onChange={handleChange} className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                        <BarChart className="h-5 w-5 text-green-400" />
                        {t.personaStyle}
                    </h2>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">{t.systemPrompt}</label>
                        <textarea
                            name="system_prompt"
                            rows={8}
                            value={config.system_prompt}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.maxAnswerLength}</label>
                            <input type="number" name="max_answer_length" value={config.max_answer_length} onChange={handleChange} className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-400 mb-1">{t.styleCopyMethod}</label>
                            <select
                                name="style_method"
                                value={config.style_method}
                                onChange={handleChange}
                                className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600"
                            >
                                <option value="rag">Standard RAG</option>
                                <option value="wasserstein">Wasserstein Distance</option>
                                <option value="vector">Latent Space Vector</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="prefer_small_answers" checked={config.prefer_small_answers} onChange={handleChange} className="h-4 w-4 bg-gray-800 border-gray-700 rounded" />
                            <span className="text-sm text-gray-300">{t.preferConcise}</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" name="enable_critic_loop" checked={config.enable_critic_loop} onChange={handleChange} className="h-4 w-4 bg-gray-800 border-gray-700 rounded" />
                            <span className="text-sm text-gray-300">{t.enableCritic}</span>
                        </label>
                    </div>
                </div>
            </div>

            <div className="rounded-xl border border-gray-800 bg-gray-950 p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <Download className="h-5 w-5 text-purple-400" />
                    {t.styleExtraction}
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <p className="text-sm text-gray-400 mb-2">{t.pasteText}</p>
                        <textarea
                            name="style_example_text"
                            placeholder={t.pasteText}
                            rows={6}
                            value={config.style_example_text || ""}
                            onChange={handleChange}
                            className="w-full rounded-lg border border-gray-800 bg-gray-800 p-2.5 text-white outline-none focus:border-blue-600 mb-2"
                        />
                        <button
                            onClick={() => {
                                setAnalysisText(config.style_example_text || "");
                                analyzeStyle();
                            }}
                            disabled={analyzing || !config.style_example_text}
                            className="text-sm bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                            {analyzing ? t.analyzing : t.analyzeStyle}
                        </button>
                    </div>

                    {analysisMetrics && (
                        <div className="bg-gray-800 rounded-lg p-4 border border-gray-800">
                            <h3 className="font-semibold text-gray-200 mb-3 flex justify-between items-center">
                                {t.analysisResults}
                                <button
                                    onClick={() => {
                                        const styleDesc = `\n\n[STYLE INSTRUCTIONS]\nAdopt the following writing style:\n- Complexity: Flesch Ease ${analysisMetrics.flesch_reading_ease.toFixed(1)} (Grade ${analysisMetrics.flesch_kincaid_grade.toFixed(1)})\n- Tone: Polarity ${analysisMetrics.tone.polarity.toFixed(2)}, Subjectivity ${analysisMetrics.tone.subjectivity.toFixed(2)}\n- Keywords: ${analysisMetrics.top_keywords.map((k: any) => k[0]).join(", ")}\n- Sentence Length: ~${analysisMetrics.avg_sentence_length.toFixed(1)} words.`;

                                        setConfig(prev => ({
                                            ...prev,
                                            system_prompt: prev.system_prompt + styleDesc
                                        }));
                                        alert("Style instructions appended to System Prompt. Review and Save.");
                                    }}
                                    className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
                                >
                                    {t.applyToPersona}
                                </button>
                            </h3>
                            <div className="space-y-2 text-sm text-gray-300">
                                <div className="flex justify-between">
                                    <span>Reading Ease:</span>
                                    <span className="text-white">{analysisMetrics.flesch_reading_ease?.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Grade Level:</span>
                                    <span className="text-white">{analysisMetrics.flesch_kincaid_grade?.toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Avg Sentence Length:</span>
                                    <span className="text-white">{analysisMetrics.avg_sentence_length?.toFixed(1)} words</span>
                                </div>
                                <div>
                                    <span className="block mb-1">Tone:</span>
                                    <div className="ml-2 pl-2 border-l border-gray-700">
                                        <div className="flex justify-between">
                                            <span>Polarity:</span>
                                            <span className={analysisMetrics.tone.polarity > 0 ? "text-green-400" : "text-red-400"}>
                                                {analysisMetrics.tone.polarity?.toFixed(2)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Subjectivity:</span>
                                            <span className="text-white">{analysisMetrics.tone.subjectivity?.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2 border-t border-gray-800">
                                    <span className="block mb-1">Top Keywords:</span>
                                    <div className="flex flex-wrap gap-2">
                                        {analysisMetrics.top_keywords?.map(([word, count]: any) => (
                                            <span key={word} className="text-xs bg-gray-800 px-2 py-1 rounded-full text-gray-300">
                                                {word} ({count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end sticky bottom-6 bg-transparent">
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50 shadow-lg shadow-blue-900/20"
                >
                    <button
                        onClick={async () => {
                            if (confirm("Are you sure you want to delete ALL feedback history? This cannot be undone.")) {
                                try {
                                    await axios.delete("http://localhost:8000/api/v1/admin/feedback/all");
                                    alert("All feedback cleared.");
                                } catch (e) { alert("Failed to clear feedback"); }
                            }
                        }}
                        className="flex items-center gap-2 rounded-lg bg-red-600 px-6 py-3 font-medium text-white hover:bg-red-700 disabled:opacity-50 shadow-lg shadow-red-900/20 mr-4"
                    >
                        {t.clearFeedback}
                    </button>
                    <Save className="h-5 w-5" />
                    {t.saveSettings}
                </button>
            </div>
        </div>
    )
}
