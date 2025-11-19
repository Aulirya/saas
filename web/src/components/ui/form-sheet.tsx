import * as React from "react";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from "@/components/ui/sheet";

interface FormSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    formId?: string;
    children: React.ReactNode;
    footer: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
}

export function FormSheet({
    open,
    onOpenChange,
    title,
    children,
    footer,
    side = "right",
}: FormSheetProps) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side={side}>
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                </SheetHeader>

                {children}

                <SheetFooter>{footer}</SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
