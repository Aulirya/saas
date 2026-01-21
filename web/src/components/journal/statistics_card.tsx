import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type StatisticsCardProps = {
    description: string;
    data: React.ReactNode;
    icon?: LucideIcon;
    iconBg?: string; // Tailwind classes for the icon container background (e.g., "bg-blue-100")
    iconColor?: string; // Tailwind classes for the icon color (e.g., "text-blue-600")
};

export function StatisticsCard({
    description,
    data,
    icon,
    iconBg = "bg-primary/10",
    iconColor = "text-primary",
}: StatisticsCardProps) {
    return (
        <Card className="@container/card flex flex-row items-center justify-between py-2 shadow-none">
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
