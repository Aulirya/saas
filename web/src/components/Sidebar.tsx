import { Link } from "@tanstack/react-router";

import {
    BookOpen,
    Calendar,
    LineChart,
    Users,
    Folder,
    ChevronLeft,
    ChevronRight,
    UsersRound,
} from "lucide-react";
import { useSidebar } from "../routes/__root";

export default function Sidebar() {
    const { isOpen, setIsOpen } = useSidebar();

    return (
        <>
            <aside
                className={`fixed left-0  ${
                    isOpen ? "w-80" : "w-20"
                } h-[calc(100vh)] bg-white border border-right z-40 transform transition-all duration-300 ease-in-out flex flex-col relative`}
            >
                {/* Expand button - shows when sidebar is collapsed */}
                {!isOpen && (
                    <button
                        onClick={() => setIsOpen(true)}
                        className="absolute top-2 -right-4 p-1.5 bg-white shadow hover:bg-gray-100 rounded-lg transition-colors z-50"
                        aria-label="Expand menu"
                    >
                        <ChevronRight size={16} className="text-gray-600" />
                    </button>
                )}

                {isOpen && (
                    <button
                        onClick={() => setIsOpen(false)}
                        className="absolute top-2 -right-4 p-1.5 bg-white shadow hover:bg-gray-100 rounded-lg transition-colors z-50"
                        aria-label="Expand menu"
                    >
                        <ChevronLeft size={16} className="text-gray-600" />
                    </button>
                )}
                <nav
                    className={`flex-1 p-4 overflow-y-auto flex flex-col gap-2`}
                >
                    <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700 ${
                            !isOpen ? "justify-center" : ""
                        }`}
                        activeProps={{
                            className: `flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2 ${
                                !isOpen ? "justify-center" : ""
                            }`,
                        }}
                    >
                        <Calendar size={20} />
                        {isOpen && (
                            <span className="font-medium">Dashboard</span>
                        )}
                    </Link>

                    <Link
                        to="/courses"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700 ${
                            !isOpen ? "justify-center" : ""
                        }`}
                        activeProps={{
                            className: `flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2 ${
                                !isOpen ? "justify-center" : ""
                            }`,
                        }}
                    >
                        <BookOpen size={20} />
                        {isOpen && (
                            <span className="font-medium">Mes cours</span>
                        )}
                    </Link>

                    <Link
                        to="/classes"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700 ${
                            !isOpen ? "justify-center" : ""
                        }`}
                        activeProps={{
                            className: `flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2 ${
                                !isOpen ? "justify-center" : ""
                            }`,
                        }}
                    >
                        <UsersRound size={20} />
                        {isOpen && (
                            <span className="font-medium">Mes classes</span>
                        )}
                    </Link>

                    <Link
                        to="/analytics"
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors mb-2 text-slate-700 ${
                            !isOpen ? "justify-center" : ""
                        }`}
                        activeProps={{
                            className: `flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2 ${
                                !isOpen ? "justify-center" : ""
                            }`,
                        }}
                    >
                        <LineChart size={20} />
                        {isOpen && (
                            <span className="font-medium">Analyses IA</span>
                        )}
                    </Link>

                    <Link
                        to="/community"
                        disabled={true}
                        className={`flex items-center gap-3 p-3 rounded-lg  transition-colors mb-2 text-slate-700 ${
                            !isOpen ? "justify-center" : ""
                        }`}
                        activeProps={{
                            className: `flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2 ${
                                !isOpen ? "justify-center" : ""
                            }`,
                        }}
                    >
                        <Users size={20} />
                        {isOpen && (
                            <>
                                <span className="font-medium">Communauté</span>
                                <span className="ml-auto text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full">
                                    Bientôt
                                </span>
                            </>
                        )}
                    </Link>

                    <Link
                        to="/resources"
                        disabled={true}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-colors mb-2 text-slate-700 ${
                            !isOpen ? "justify-center" : ""
                        }`}
                        activeProps={{
                            className: `flex items-center gap-3 p-3 rounded-lg bg-indigo-50 text-indigo-700 transition-colors mb-2 ${
                                !isOpen ? "justify-center" : ""
                            }`,
                        }}
                    >
                        <Folder size={20} />
                        {isOpen && (
                            <>
                                <span className="font-medium">Ressources</span>
                                <span className="ml-auto text-xs bg-orange-400 text-white px-2 py-0.5 rounded-full">
                                    Bientôt
                                </span>
                            </>
                        )}
                    </Link>
                </nav>
            </aside>
        </>
    );
}
