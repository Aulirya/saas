import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatisticsCardProps = {
    description: string;
    data: React.ReactNode;
    icon?: LucideIcon;
    iconBg?: string; // Tailwind classes for the icon container background (e.g., "bg-blue-100")
    iconColor?: string; // Tailwind classes for the icon color (e.g., "text-blue-600")
    onClick?: () => void;
};

export function StatisticsCard({
    description,
    data,
    icon,
    iconBg = "bg-primary/10",
    iconColor = "text-primary",
    onClick,
}: StatisticsCardProps) {
    return (
        <Card
            className={cn(
                "@container/card flex flex-row items-center justify-between py-2 shadow-none",
                onClick &&
                    "cursor-pointer transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            )}
            onClick={onClick}
            role={onClick ? "button" : undefined}
            tabIndex={onClick ? 0 : undefined}
            onKeyDown={(event) => {
                if (!onClick) return;
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onClick();
                }
            }}
        >
            <CardHeader className="grow">
                <CardDescription>{description}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
                    {data}
                </CardTitle>
            </CardHeader>
            {icon ? (
                <div
                    className={`mr-6 flex h-14 w-14 items-center justify-center rounded-xl ${iconBg}`}
                >
                    {(() => {
                        const Icon = icon;
                        return <Icon className={`h-6 w-6 ${iconColor}`} />;
                    })()}
                </div>
            ) : null}
        </Card>
    );
}
