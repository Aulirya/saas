import * as React from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface CardInfoLayoutProps {
    title: React.ReactNode;
    description?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    headerClassName?: string;
    contentClassName?: string;
    footerClassName?: string;
}

export function CardInfoLayout({
    title,
    description,
    children,
    footer,
    className,
    headerClassName,
    contentClassName,
    footerClassName,
}: CardInfoLayoutProps) {
    return (
        <Card className={cn("h-full flex flex-col", className)}>
            <CardHeader className={cn("", headerClassName)}>
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent
                className={cn("flex flex-col gap-6 flex-1", contentClassName)}
            >
                {children}
            </CardContent>
            {footer && (
                <CardFooter className={cn("mt-4", footerClassName)}>
                    {footer}
                </CardFooter>
            )}
        </Card>
    );
}
