import { Link } from "@tanstack/react-router";

import ClerkHeader from "../integrations/clerk/header-user.tsx";

import { useState } from "react";

import {
    BookOpen,
    Calendar,
    LineChart,
    Users,
    Folder,
    Menu,
    X,
} from "lucide-react";

export default function Header() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <header className="p-4 flex items-center bg-white text-gray shadow-lg justify-between">
                <div className="flex flex-row items-center">
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Open menu"
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="ml-4 text-xl font-semibold">
                        <Link to="/">
                            <img
                                src="/aulirya_logo.png"
                                alt="Aulirya Logo"
                                className="h-10"
                            />
                        </Link>
                    </h1>
                </div>

                <div className="flex items-center gap-3 ml-6">
                    <ClerkHeader />
                </div>
            </header>

            <aside
                className={`fixed top-0 left-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
                    isOpen ? "translate-x-0" : "-translate-x-full"
                }`}
            >
                <div className="flex items-center justify-between p-4">
                    <img
                        src="/aulirya_logo.png"
                        alt="Aulirya Logo"
                        className="h-10"
                    />
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Close menu"
                    >
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 overflow-y-auto">
                    <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700"
                        activeProps={{
                            className:
                                "flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2",
                        }}
                    >
                        <Calendar size={20} />
                        <span className="font-medium">Dashboard</span>
                    </Link>

                    <Link
                        to="/courses"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700"
                        activeProps={{
                            className:
                                "flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2",
                        }}
                    >
                        <BookOpen size={20} />
                        <span className="font-medium">Mes cours</span>
                    </Link>

                    <Link
                        to="/analytics"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700"
                        activeProps={{
                            className:
                                "flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2",
                        }}
                    >
                        <LineChart size={20} />
                        <span className="font-medium">Analyses IA</span>
                    </Link>

                    <Link
                        to="/community"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700"
                        activeProps={{
                            className:
                                "flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2",
                        }}
                    >
                        <Users size={20} />
                        <span className="font-medium">Communauté</span>
                        <span className="ml-auto text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full">
                            Bientôt
                        </span>
                    </Link>

                    <Link
                        to="/resources"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700"
                        activeProps={{
                            className:
                                "flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2",
                        }}
                    >
                        <Folder size={20} />
                        <span className="font-medium">Ressources</span>
                        <span className="ml-auto text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full">
                            Bientôt
                        </span>
                    </Link>
                </nav>
            </aside>
        </>
    );
}
