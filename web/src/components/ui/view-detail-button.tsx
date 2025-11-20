import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewDetailButtonProps {
    to: string;
    params?: Record<string, string>;
    label?: string;
    className?: string;
    variant?: "default" | "outline" | "secondary" | "ghost" | "link";
}

export function ViewDetailButton({
    to,
    params,
    label = "Voir la fiche détaillée",
    className,
    variant = "outline",
    ...props
}: ViewDetailButtonProps) {
    return (
        <Button
            variant={variant}
            className={cn("w-full", className)}
            asChild
            {...props}
        >
            <Link to={to} params={params}>
                {label}
            </Link>
        </Button>
    );
}
