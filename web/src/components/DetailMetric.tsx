import {
    BookOpen,
    Clock,
    GraduationCap,
    TrendingUp,
    Users,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DetailMetricProps, MetricConfig } from "@/types/class.types";

const metricConfigs: Record<string, MetricConfig> = {
    Élèves: {
        icon: Users,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-600",
    },
    Matières: {
        icon: BookOpen,
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
    },
    "Heures / semaine": {
        icon: Clock,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
    },
    "Moyenne générale": {
        icon: TrendingUp,
        iconBg: "bg-purple-50",
        iconColor: "text-purple-600",
    },
    "Heures totales": {
        icon: Clock,
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
    },
    "Heures complétées": {
        icon: TrendingUp,
        iconBg: "bg-orange-50",
        iconColor: "text-orange-600",
    },
    "Fichiers uploadés": {
        icon: BookOpen,
        iconBg: "bg-green-50",
        iconColor: "text-green-600",
    },
};

export function DetailMetric({ label, value }: DetailMetricProps) {
    const config = metricConfigs[label] || {
        icon: GraduationCap,
        iconBg: "bg-muted",
        iconColor: "text-muted-foreground",
    };
    const Icon = config.icon;

    return (
        <Card className="grow rounded-lg border border-border/60 bg-background px-4 py-3">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "flex size-10 items-center justify-center rounded-lg",
                        config.iconBg,
                        config.iconColor
                    )}
                >
                    <Icon className="size-5" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                        {value}
                    </p>
                </div>
            </div>
        </Card>
    );
}
