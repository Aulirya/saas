import { Plus } from "lucide-react";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateCardProps {
    title: string;
    description: string;
    buttonText: string;
    onButtonClick: () => void;
}

export function EmptyStateCard({
    title,
    description,
    buttonText,
    onButtonClick,
}: EmptyStateCardProps) {
    return (
        <Card className="border-dashed">
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button onClick={onButtonClick}>
                    <Plus className="size-4" />
                    {buttonText}
                </Button>
            </CardFooter>
        </Card>
    );
}
