import * as React from "react";

import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
    "inline-flex items-center gap-1.5 rounded-full border border-transparent px-3 py-1 text-xs font-semibold uppercase tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    {
        variants: {
            variant: {
                default:
                    "bg-primary/10 text-primary focus-visible:ring-primary/20",
                success:
                    "bg-emerald-100 text-emerald-700 border-emerald-200 focus-visible:ring-emerald-300/60",
                warning:
                    "bg-amber-100 text-amber-700 border-amber-200 focus-visible:ring-amber-300/60",
                outline:
                    "border-border bg-background text-foreground focus-visible:ring-border/60",
                muted: "bg-muted text-muted-foreground focus-visible:ring-muted/50",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

const Badge = React.forwardRef<
    HTMLSpanElement,
    React.ComponentPropsWithoutRef<"span"> & VariantProps<typeof badgeVariants>
>(({ className, variant, ...props }, ref) => {
    return (
        <span
            ref={ref}
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };
