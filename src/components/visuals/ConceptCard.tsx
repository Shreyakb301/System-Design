import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConceptCardProps {
    title: string;
    description: string;
    className?: string;
    children: React.ReactNode;
}

export function ConceptCard({ title, description, className, children }: ConceptCardProps) {
    return (
        <Card className={cn("overflow-hidden border-2", className)}>
            <CardHeader className="bg-muted/50 pb-4">
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                {children}
            </CardContent>
        </Card>
    );
}
