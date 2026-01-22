import { disableDemoMode, isDemoEnabled } from "../utils/demo";
import { Button } from "./ui/button";

export default function DemoBanner() {
    if (!isDemoEnabled()) {
        return null;
    }

    return (
        <div className="w-full bg-amber-50 border-b border-amber-200 text-amber-900">
            <div className="max-w-screen-2xl mx-auto px-6 py-2 flex items-center justify-between gap-4 text-sm">
                <span>
                    Mode démo actif. Les données peuvent être réinitialisées
                    régulièrement.
                </span>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        disableDemoMode();
                        window.location.assign("/");
                    }}
                >
                    Quitter le mode démo
                </Button>
            </div>
        </div>
    );
}
