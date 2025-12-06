"use client";

import { useState } from "react";
import RealDashboard from "@/components/RealDashboard";
import Playground from "@/components/Playground";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<"real" | "playground">("real");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex rounded-lg bg-gray-800 p-1 border border-gray-800">
          <button
            onClick={() => setActiveTab("real")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "real" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
          >
            Real
          </button>
          <button
            onClick={() => setActiveTab("playground")}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === "playground" ? "bg-gray-800 text-white shadow-sm" : "text-gray-400 hover:text-white"
              }`}
          >
            Playground
          </button>
        </div>
      </div>

      {activeTab === "real" ? <RealDashboard /> : <Playground />}
    </div>
  );
}
