import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

type SelectableCardProps = {
    isSelected: boolean;
    onSelect: () => void;
    icon: ReactNode;
    iconContainerClassName?: string;
    title: ReactNode;
    description: ReactNode;
    action: ReactNode;
    className?: string;
};

export function SelectableCard({
    isSelected,
    onSelect,
    icon,
    iconContainerClassName,
    title,
    description,
    action,
    className,
}: SelectableCardProps) {
    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect();
                }
            }}
            className={cn(
                "group cursor-pointer border-border/70 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                "hover:border-muted-foreground/50 hover:shadow-sm",
                isSelected ? "border-muted-foreground/80 shadow-sm" : "",
                className
            )}
        >
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            "flex size-12 items-center justify-center rounded-xl",
                            iconContainerClassName
                        )}
                    >
                        {icon}
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="">{title}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                            {description}
                        </CardDescription>
                    </div>
                </div>

                <CardAction>{action}</CardAction>
            </CardHeader>
        </Card>
    );
}
