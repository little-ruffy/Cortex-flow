"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { Edit, Save, X } from "lucide-react";

interface Chunk {
    id: string;
    content: string;
    metadata: any;
}

export default function ChunkEditor() {
    const [documents, setDocuments] = useState<string[]>([]);
    const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
    const [chunks, setChunks] = useState<Chunk[]>([]);
    const [editingChunk, setEditingChunk] = useState<string | null>(null);
    const [editContent, setEditContent] = useState("");

    useEffect(() => {
        loadDocuments();
    }, []);

    const loadDocuments = async () => {
        try {
            const res = await axios.get("http://localhost:8000/api/v1/admin/documents");
            setDocuments(res.data.documents);
        } catch (err) {
            console.error(err);
        }
    };

    const loadChunks = async (filename: string) => {
        setSelectedDoc(filename);
        try {
            const res = await axios.get(`http://localhost:8000/api/v1/admin/documents/${filename}/chunks`);
            setChunks(res.data.chunks);
        } catch (err) {
            console.error(err);
        }
    };

    const startEdit = (chunk: Chunk) => {
        setEditingChunk(chunk.id);
        setEditContent(chunk.content);
    };

    const saveChunk = async () => {
        if (!editingChunk) return;
        try {
            await axios.put(`http://localhost:8000/api/v1/admin/chunks/${editingChunk}`, { content: editContent });
            setChunks(prev => prev.map(c => c.id === editingChunk ? { ...c, content: editContent } : c));
            setEditingChunk(null);
        } catch (err) {
            console.error(err);
            alert("Failed to update chunk");
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-white">Chunk Editor</h2>

            <div className="flex gap-6">
                <div className="w-1/3 rounded-xl border border-gray-800 bg-gray-950 p-4">
                    <h3 className="mb-4 text-lg font-medium text-gray-400">Documents</h3>
                    <div className="space-y-2">
                        {documents.map(doc => (
                            <button
                                key={doc}
                                onClick={() => loadChunks(doc)}
                                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${selectedDoc === doc
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                    }`}
                            >
                                {doc}
                            </button>
                        ))}
                        {documents.length === 0 && <p className="text-sm text-gray-500">No documents found.</p>}
                    </div>
                </div>

                <div className="flex-1 rounded-xl border border-gray-800 bg-gray-950 p-4">
                    <h3 className="mb-4 text-lg font-medium text-gray-400">
                        {selectedDoc ? `Chunks for ${selectedDoc}` : "Select a document"}
                    </h3>

                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                        {chunks.map(chunk => (
                            <div key={chunk.id} className="rounded-lg border border-gray-800 bg-gray-800 p-4">
                                {editingChunk === chunk.id ? (
                                    <div className="space-y-3">
                                        <textarea
                                            value={editContent}
                                            onChange={(e) => setEditContent(e.target.value)}
                                            rows={5}
                                            className="w-full rounded-lg border border-gray-700 bg-gray-950 p-3 text-sm text-white"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setEditingChunk(null)}
                                                className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-400 hover:text-white"
                                            >
                                                <X className="h-4 w-4" /> Cancel
                                            </button>
                                            <button
                                                onClick={saveChunk}
                                                className="flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
                                            >
                                                <Save className="h-4 w-4" /> Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="mb-3 text-sm text-gray-300">{chunk.content}</p>
                                        <div className="flex justify-between items-center border-t border-gray-800 pt-3">
                                            <span className="text-xs text-gray-500">ID: {chunk.id.slice(0, 8)}...</span>
                                            <button
                                                onClick={() => startEdit(chunk)}
                                                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                                            >
                                                <Edit className="h-3 w-3" /> Edit
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
