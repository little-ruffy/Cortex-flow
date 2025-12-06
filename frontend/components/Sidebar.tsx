"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Database, UserCog, MessageSquare, Settings } from "lucide-react";
import { clsx } from "clsx";
import Logo from "@/public/logo.webp";
import { useLanguage } from "@/context/LanguageContext";

export function Sidebar() {
    const pathname = usePathname();
    const { language, setLanguage, t } = useLanguage();

    const navItems = [
        { name: t.dashboard, href: "/", icon: LayoutDashboard },
        { name: "RAG Control", href: "/rag-control", icon: Database },
        { name: "Persona & Settings", href: "/settings", icon: UserCog },
        { name: t.operators, href: "/operators", icon: UserCog },
        { name: t.playground, href: "/playground", icon: MessageSquare },
        { name: t.feedback, href: "/feedback", icon: MessageSquare },
        { name: t.integrations, href: "/integrations", icon: LayoutDashboard },
    ];

    const languages = [
        { code: 'en', label: 'EN' },
        { code: 'ru', label: 'RU' },
        { code: 'kk', label: 'KK' }
    ];

    return (
        <div className="flex h-screen w-64 flex-col justify-between border-r border-gray-800 bg-gray-950 p-4 text-white">
            <div className="flex-1 flex flex-col min-h-0">
                <div className="mb-6 flex items-center gap-2 px-2 pt-2 shrink-0">
                    <Image src={Logo} alt="Logo" className="h-8 w-8 rounded-lg mr-1" />
                    <span className="text-xl font-bold">Cortex Flow</span>
                </div>

                <nav className="space-y-1 flex-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={clsx(
                                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                    isActive
                                        ? "bg-blue-600 text-white"
                                        : "text-gray-400 hover:bg-gray-800 hover:text-white"
                                )}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="border-t border-gray-800 pt-4 shrink-0 mt-auto">
                <div className="flex gap-2 mb-4 px-1">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            onClick={() => setLanguage(lang.code as any)}
                            className={clsx(
                                "flex-1 px-2 py-1.5 text-xs font-semibold rounded-md transition-all border",
                                language === lang.code
                                    ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                                    : "bg-gray-900 border-gray-800 text-gray-400 hover:bg-gray-800 hover:text-gray-300"
                            )}
                        >
                            {lang.label}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-900 transition-colors">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500"></div>
                    <div>
                        <p className="font-medium text-white">Admin</p>
                        <p className="text-xs opacity-70">admin@company.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
