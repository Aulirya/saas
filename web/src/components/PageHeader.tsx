import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface PageHeaderAction {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
    variant?: "default" | "outline" | "secondary" | "destructive" | "ghost";
    className?: string;
}

export interface PageHeaderDropdown {
    value: string;
    options: { value: string; label: string }[];
    onValueChange: (value: string) => void;
    placeholder?: string;
}

export interface PageHeaderProps {
    // Title section
    title: string;
    subtitle?: string;

    // Left navigation (for detailed version)
    showBackButton?: boolean;
    onBackClick?: () => void;
    leftIconButton?: {
        icon: LucideIcon;
        onClick: () => void;
        label?: string;
    };

    // Primary action (for simple version)
    primaryAction?: PageHeaderAction;

    // Multiple actions (for detailed version)
    actions?: PageHeaderAction[];

    // Dropdown (for detailed version)
    dropdown?: PageHeaderDropdown;

    // Layout variant
    variant?: "simple" | "detailed";

    className?: string;
}

export function PageHeader({
    title,
    subtitle,
    showBackButton = false,
    onBackClick,
    leftIconButton,
    primaryAction,
    actions = [],
    dropdown,
    variant = "simple",
    className,
}: PageHeaderProps) {
    const isMobile = useIsMobile();
    const isDetailed =
        variant === "detailed" ||
        showBackButton ||
        leftIconButton ||
        actions.length > 0 ||
        dropdown;

    return (
        <div className={cn(isDetailed && "border-b", className)}>
            <div
                className={cn(
                    "flex flex-col gap-4",
                    !isMobile && "flex-row items-center justify-between",
                    isMobile && isDetailed && "gap-3"
                )}
            >
                {/* Left Section */}
                <div
                    className={cn(
                        "flex items-center gap-3",
                        !isMobile && isDetailed && "flex-1",
                        isMobile && "flex-wrap"
                    )}
                >
                    {/* Back Button */}
                    {showBackButton && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onBackClick}
                            className="shrink-0"
                            aria-label="Retour"
                        >
                            <ArrowLeft className="size-4" />
                        </Button>
                    )}

                    {/* Left Icon Button */}
                    {leftIconButton && (
                        <Button
                            variant="secondary"
                            size="icon"
                            onClick={leftIconButton.onClick}
                            className="shrink-0"
                            aria-label={leftIconButton.label || "Icon button"}
                        >
                            <leftIconButton.icon className="size-4" />
                        </Button>
                    )}

                    {/* Title Section */}
                    <div
                        className={cn(
                            "flex flex-col",
                            !isMobile && isDetailed && "flex-1",
                            isMobile && "flex-1 min-w-0"
                        )}
                    >
                        <h1
                            className={cn(
                                "font-bold text-foreground",
                                isDetailed ? "text-xl" : "text-2xl",
                                isMobile && isDetailed && "text-lg"
                            )}
                        >
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Section - Actions */}
                <div
                    className={cn(
                        "flex items-center gap-2",
                        isMobile && "flex-wrap w-full",
                        !isMobile && "shrink-0"
                    )}
                >
                    {/* Simple Version: Primary Action */}
                    {!isDetailed && primaryAction && (
                        <Button
                            onClick={primaryAction.onClick}
                            variant={primaryAction.variant || "default"}
                            className={primaryAction.className}
                        >
                            {primaryAction.icon && (
                                <primaryAction.icon className="size-4" />
                            )}
                            {primaryAction.label}
                        </Button>
                    )}

                    {/* Detailed Version: Dropdown and Actions */}
                    {isDetailed && (
                        <>
                            {dropdown && (
                                <Select
                                    value={dropdown.value}
                                    onValueChange={dropdown.onValueChange}
                                >
                                    <SelectTrigger className="w-fit">
                                        <SelectValue
                                            placeholder={dropdown.placeholder}
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {dropdown.options.map((option) => (
                                            <SelectItem
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}

                            {actions.map((action, index) => (
                                <Button
                                    key={index}
                                    variant={action.variant || "default"}
                                    onClick={action.onClick}
                                    className={cn(
                                        isMobile && action.label && "flex-1",
                                        action.className
                                    )}
                                >
                                    {action.icon && (
                                        <action.icon className="size-4" />
                                    )}
                                    {(!isMobile || action.label) &&
                                        action.label}
                                </Button>
                            ))}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
