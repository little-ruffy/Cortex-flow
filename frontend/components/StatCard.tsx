import { LucideIcon } from "lucide-react";

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
}

export default function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    return (
        <div className="rounded-xl border border-gray-800 bg-gray-950 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-400">{title}</p>
                    <p className="mt-2 text-3xl font-bold text-white">{value}</p>
                </div>
                <Icon className={`h-8 w-8 ${color}`} />
            </div>
        </div>
    );
}
