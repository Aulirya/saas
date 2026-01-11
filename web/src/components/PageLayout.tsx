import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface PageLayoutProps {
    header?: ReactNode;
    children: ReactNode;
    className?: string;
    headerClassName?: string;
}

/**
 * Common layout component for list/detail pages with header and content sections.
 * Provides consistent structure with proper flex layout and spacing.
 */
export function PageLayout({
    header,
    children,
    className,
    headerClassName,
}: PageLayoutProps) {
    return (
        <div id="main" className={cn("h-full flex flex-col px-2", className)}>
            {header && (
                <div className={cn("space-y-6 lg:space-y-6", headerClassName)}>
                    {header}
                </div>
            )}

            {children}
        </div>
    );
}
