import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/courses")({ component: CoursesPage });

function CoursesPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-2">Mes cours</h1>
            <p className="text-slate-600">Liste de vos cours à venir.</p>
        </div>
    );
}


