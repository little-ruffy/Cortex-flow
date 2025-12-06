import { useEffect, useState } from "react";
import { Activity, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import axios from "axios";
import StatCard from "./StatCard";
import { useLanguage } from "@/context/LanguageContext";

export default function RealDashboard() {
    const { t } = useLanguage();
    const [stats, setStats] = useState({
        auto_resolution_rate: 0,
        average_response_time: "0s",
        total_tickets: 0,
        recent_activity: [],
        top_issues: []
    });

    useEffect(() => {
        axios.get("http://localhost:8000/api/v1/admin/analytics")
            .then(res => setStats(res.data))
            .catch(console.error);
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title={t.autoResolutionRate}
                    value={`${stats.auto_resolution_rate}%`}
                    icon={CheckCircle}
                    color="text-green-500"
                />
                <StatCard
                    title={t.avgResponseTime}
                    value={stats.average_response_time}
                    icon={Clock}
                    color="text-blue-500"
                />
                <StatCard
                    title={t.totalTickets}
                    value={stats.total_tickets}
                    icon={Activity}
                    color="text-purple-500"
                />
                <StatCard
                    title={t.escalatedToHuman}
                    value={`${(100 - stats.auto_resolution_rate).toFixed(1)}%`}
                    icon={AlertTriangle}
                    color="text-orange-500"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                    <h2 className="mb-4 text-xl font-semibold text-white">{t.recentActivity}</h2>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {stats.recent_activity?.length > 0 ? (
                            stats.recent_activity.map((item: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                                    <div className={`mt-1 h-2 w-2 rounded-full ${item.result?.action === 'auto_reply' ? 'bg-green-500' : item.result?.action === 'ignore' ? 'bg-gray-500' : 'bg-orange-500'}`} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{item.text}</p>
                                        <p className="text-xs text-gray-400 mt-1 flex justify-between">
                                            <span>{item.source}</span>
                                            <span>{new Date(item.timestamp * 1000).toLocaleTimeString()}</span>
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">{t.noRecentActivity}</div>
                        )}
                    </div>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
                    <h2 className="mb-4 text-xl font-semibold text-white">{t.topIssues}</h2>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {stats.top_issues?.length > 0 ? (
                            stats.top_issues.map((item: any, i: number) => (
                                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-900/20 border border-red-900/30">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{item.text}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            Reason: {item.rating === 'dislike' ? t.userDislike : t.escalation}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center text-gray-500 py-8">{t.noCriticalIssues}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
