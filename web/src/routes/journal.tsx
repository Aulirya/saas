import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/journal")({ component: JournalPage });

function JournalPage() {
    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-2">Journal de classe</h2>
            <p className="text-slate-600">Bienvenue dans votre journal.</p>
        </div>
    );
}
