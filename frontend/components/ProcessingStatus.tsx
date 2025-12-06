"use client";

import { Loader2 } from "lucide-react";

export default function ProcessingStatus() {
    return (
        <div className="flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 p-4 text-blue-400 animate-fade-in">
            <div className="relative">
                <Loader2 className="h-5 w-5 animate-spin" />
                <div className="absolute inset-0 animate-ping rounded-full bg-blue-500 opacity-20"></div>
            </div>
            <div className="flex flex-col">
                <span className="text-sm font-medium">Processing documents...</span>
                <span className="text-xs opacity-70">Generating embeddings & chunks</span>
            </div>
        </div>
    );
}
