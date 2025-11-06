import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-2">Analyses IA</h1>
            <p className="text-slate-600">Tableaux de bord et insights alimentés par l'IA.</p>
        </div>
    );
}



