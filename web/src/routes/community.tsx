import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/community")({ component: CommunityPage });

function CommunityPage() {
    return (
        <div className="p-6">
            <h1 className="text-2xl font-semibold mb-2">Communauté</h1>
            <p className="text-slate-600">Bientôt disponible.</p>
        </div>
    );
}


