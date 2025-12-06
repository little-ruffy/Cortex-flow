"use client";

import { useState, useEffect } from "react";
import { Upload, FileText, Trash2, Edit, RefreshCw } from "lucide-react";
import ChunkEditor from "@/components/ChunkEditor";
import ProcessingStatus from "@/components/ProcessingStatus";
import axios from "axios";
import { useLanguage } from "@/context/LanguageContext";

export default function RagControl() {
    const { t } = useLanguage();
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const [existingDocs, setExistingDocs] = useState<string[]>([]);
    const [loadingDocs, setLoadingDocs] = useState(false);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoadingDocs(true);
        try {
            const res = await axios.get("http://localhost:8000/api/v1/admin/documents");
            setExistingDocs(res.data.documents);
        } catch (err) {
            console.error("Failed to load docs", err);
        } finally {
            setLoadingDocs(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    };

    const handleUpload = async () => {
        if (files.length === 0) return;
        setUploading(true);

        const formData = new FormData();
        files.forEach(f => formData.append('files', f));

        try {
            await axios.post('http://localhost:8000/api/v1/admin/upload-document', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setFiles([]);
            setProcessing(true);
            setTimeout(() => {
                setProcessing(false);
                fetchDocuments();
            }, 3000);
        } catch (err) {
            console.error(err);
            alert("Upload failed.");
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (filename: string) => {
        if (!confirm(`${t.deleteConfirm} ${filename}?`)) return;
        try {
            await axios.delete(`http://localhost:8000/api/v1/admin/documents/${filename}`);
            fetchDocuments();
        } catch (err) {
            console.error(err);
            alert("Delete failed");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-white">{t.knowledgeBase}</h1>
                <button
                    onClick={handleUpload}
                    disabled={uploading || files.length === 0}
                    className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                    {uploading ? t.uploading : t.syncToVectorDB}
                </button>
            </div>

            {processing && <ProcessingStatus />}

            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-700 bg-gray-950 transition-colors hover:border-gray-500"
            >
                <Upload className="mb-4 h-12 w-12 text-gray-500" />
                <p className="text-lg font-medium text-gray-300">{t.dragDrop}</p>
                <p className="text-sm text-gray-500">{t.supportedFormats}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-white">{t.stagedFiles}</h2>
                    {files.length === 0 && (
                        <p className="text-gray-500">{t.noFilesSelected}</p>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                        {files.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800 p-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-blue-400" />
                                    <div>
                                        <p className="font-medium text-white">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
                                    </div>
                                </div>
                                <button onClick={() => setFiles(files.filter((_, i) => i !== idx))}>
                                    <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-500" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-white">{t.indexedDocuments}</h2>
                        <button onClick={fetchDocuments} className="text-gray-400 hover:text-white">
                            <RefreshCw className={`h-4 w-4 ${loadingDocs ? "animate-spin" : ""}`} />
                        </button>
                    </div>

                    {existingDocs.length === 0 && !loadingDocs && (
                        <p className="text-gray-500">{t.noDocumentsIndex}</p>
                    )}
                    <div className="grid grid-cols-1 gap-4">
                        {existingDocs.map((doc, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg border border-gray-800 bg-gray-800 p-4">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-6 w-6 text-green-400" />
                                    <p className="font-medium text-white truncate max-w-[200px]" title={doc}>{doc}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handleDelete(doc)} title="Delete from Index">
                                        <Trash2 className="h-5 w-5 text-gray-500 hover:text-red-500" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="border-t border-gray-800 pt-8">
                <ChunkEditor />
            </div>
        </div>
    );
}
