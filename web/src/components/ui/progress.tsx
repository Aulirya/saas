import * as React from "react";

import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
    HTMLDivElement,
    React.ComponentPropsWithoutRef<"div"> & {
        value?: number;
        indicatorClassName?: string;
    }
>(({ className, value = 0, indicatorClassName, ...props }, ref) => (
    <div
        ref={ref}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        data-slot="progress"
        className={cn(
            "relative h-2 w-full overflow-hidden rounded-full bg-primary/20",
            className
        )}
        {...props}
    >
        <div
            data-slot="progress-indicator"
            className={cn(
                "h-full w-full flex-1 bg-primary transition-all",
                indicatorClassName
            )}
            style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
    </div>
));
Progress.displayName = "Progress";

export { Progress };
