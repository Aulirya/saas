import { cn } from "@/lib/utils";

/**
 * Base skeleton component for loading states
 */
export function Skeleton({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("animate-pulse rounded-md bg-gray-200", className)}
            {...props}
        />
    );
}

/**
 * Skeleton for a header section with icon, title, subtitle, and action button
 */
export function SkeletonHeader({
    showIcon = true,
    showAction = true,
    className,
}: {
    showIcon?: boolean;
    showAction?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    {showIcon && <Skeleton className="size-12 rounded-xl" />}
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                </div>
                {showAction && <Skeleton className="h-6 w-32 rounded-full" />}
            </div>
        </div>
    );
}

/**
 * Skeleton for a card with title, optional description, and content lines
 */
export function SkeletonCard({
    showDescription = true,
    lines = 3,
    className,
}: {
    showDescription?: boolean;
    lines?: number;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "rounded-lg border border-dashed bg-card p-6",
                className
            )}
        >
            <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                {showDescription && <Skeleton className="mt-2 h-4 w-64" />}
            </div>
            <div className="mt-4 space-y-3">
                {Array.from({ length: lines }).map((_, i) => (
                    <Skeleton
                        key={i}
                        className={cn(
                            "h-3 rounded-full",
                            i === 0 && "w-full",
                            i === 1 && "w-3/4",
                            i === 2 && "w-2/4",
                            i > 2 && "w-2/3"
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

/**
 * Skeleton for a page detail view with header and grid of cards
 */
export function SkeletonPageDetail({
    headerCard = true,
    leftColumnCards = 4,
    rightColumnCards = 3,
    showRightColumn = true,
    className,
}: {
    headerCard?: boolean;
    leftColumnCards?: number;
    rightColumnCards?: number;
    showRightColumn?: boolean;
    className?: string;
}) {
    return (
        <div className={cn("space-y-6", className)}>
            {headerCard && (
                <div className="rounded-lg border bg-card p-6">
                    <SkeletonHeader />
                </div>
            )}

            <div className="grid gap-6 xl:grid-cols-[2fr,1fr]">
                <div className="space-y-6">
                    {Array.from({ length: leftColumnCards }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
                {showRightColumn && (
                    <div className="space-y-6">
                        {Array.from({ length: rightColumnCards }).map(
                            (_, i) => (
                                <SkeletonCard
                                    key={i}
                                    showDescription={false}
                                    lines={2}
                                />
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
