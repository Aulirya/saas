import { useEffect, useMemo, useState } from "react";
import { breakpoints } from "@/lib/media";
import { useMediaQuery } from "usehooks-ts";

import { Route as CourseDetailRoute } from "./$courseId";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Plus } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { SummaryStat } from "@/components/ui/summary-stat";
import { useCoursePrograms } from "@/features/courses/api/useCoursePrograms";
import type { CourseProgram } from "@/features/courses/types";
import { cn, getColorFromText } from "@/lib/utils";
import { CreateCourseModal } from "@/features/courses/components/CreateCourseModal";

const numberFormatter = new Intl.NumberFormat("fr-FR");

export const Route = createFileRoute("/_protected/courses/")({
    component: CoursesPage,
});

function CoursesPage() {
    const { data: programs = [], isLoading } = useCoursePrograms();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const isMobile = useMediaQuery(`(max-width: ${breakpoints.lg}px)`);
    useEffect(() => {
        if (!isMobile) setIsModalOpen(false);
        else setSelectedId(null);
    }, [isMobile]);

    useEffect(() => {
        if (!programs.length) {
            setSelectedId(null);
            return;
        }

        if (
            !isMobile &&
            (!selectedId ||
                !programs.some((program) => program.id === selectedId))
        ) {
            setSelectedId(programs[0].id);
        }
    }, [programs, selectedId, isMobile]);

    const selectedProgram = useMemo(() => {
        return programs.find((program) => program.id === selectedId);
    }, [programs, selectedId]);

    const handleProgramSelect = (id: string) => {
        setSelectedId(id);
        // On mobile/tablet (< lg), open the modal when a program is selected
        if (isMobile) {
            setIsModalOpen(true);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <PageHeader
                title="Progression des cours"
                primaryAction={{
                    label: "Nouveau cours",
                    icon: Plus,
                    onClick: () => {
                        setIsCreateModalOpen(true);
                    },
                }}
                className="mb-10"
            />

            <div className="grid grid-cols-7 gap-6 flex-1 min-h-0">
                <div className="space-y-5 col-span-7 lg:col-span-4 xl:col-span-5">
                    {isLoading ? (
                        <Card className="animate-pulse border-dashed">
                            <CardHeader>
                                <CardTitle className="h-6 w-40 rounded bg-muted" />
                                <CardDescription className="h-4 w-64 rounded bg-muted" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="h-3 w-full rounded-full bg-muted" />
                                <div className="h-3 w-3/5 rounded-full bg-muted" />
                                <div className="h-3 w-2/5 rounded-full bg-muted" />
                            </CardContent>
                        </Card>
                    ) : programs.length ? (
                        programs.map((program) => (
                            <ProgramCard
                                key={program.id}
                                program={program}
                                isSelected={program.id === selectedId}
                                onSelect={handleProgramSelect}
                            />
                        ))
                    ) : (
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle>Aucun cours trouvé</CardTitle>
                                <CardDescription>
                                    Créez votre premier programme pour commencer
                                    à planifier vos cours.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <Plus className="size-4" />
                                    Nouveau cours
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>

                {/* Desktop sidebar - hidden on mobile */}
                <div className="hidden lg:block lg:col-span-3 xl:col-span-2 xl:sticky xl:top-28 xl:h-full xl:flex xl:flex-col">
                    <ProgramSummary program={selectedProgram} />
                </div>
            </div>

            {/* Mobile modal - only visible on screens < lg */}
            <ProgramSummaryModal
                open={isModalOpen}
                onOpenChange={(isOpen) => {
                    setIsModalOpen(isOpen);
                    if (!isOpen && isMobile) {
                        setSelectedId(null);
                    }
                }}
                program={selectedProgram}
            />

            {/* Create Course Modal */}
            <CreateCourseModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </div>
    );
}

function ProgramCard({
    program,
    isSelected,
    onSelect,
}: {
    program: CourseProgram;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    const Icon = program.icon;

    // Get color scheme based on subject text
    const colorScheme = getColorFromText(program.subject);

    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={() => onSelect(program.id)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(program.id);
                }
            }}
            className={cn(
                "group cursor-pointer border-border/70 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isSelected
                    ? "border-muted-foreground/80 shadow-sm"
                    : "hover:border-muted-foreground/50 hover:shadow-sm"
            )}
        >
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            "flex size-12 items-center justify-center rounded-xl",
                            colorScheme.bgLight,
                            colorScheme.text
                        )}
                    >
                        <Icon className="size-6" aria-hidden />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-xl sm:text-2xl">
                            {program.subject}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                            <span>{program.level}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{program.weeklyHours}h/semaine</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{program.students} élèves</span>
                        </CardDescription>
                    </div>
                </div>

                <CardAction>
                    <Button
                        asChild
                        aria-label="Voir le cours"
                        className={cn("shrink-0", colorScheme.button)}
                    >
                        <Link
                            to={CourseDetailRoute.to}
                            params={{ courseId: program.id }}
                        >
                            <Eye className="size-4" /> Voir le cours
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>
        </Card>
    );
}

function ProgramSummary({ program }: { program: CourseProgram | undefined }) {
    if (!program) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardDescription>
                        Sélectionnez un cours pour afficher sa progression et
                        ses statistiques.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    const progressValue = Math.round(
        (program.completedHours / Math.max(program.totalHours, 1)) * 100
    );
    const completedText = `${numberFormatter.format(
        program.completedHours
    )} / ${numberFormatter.format(
        program.totalHours
    )} heures (${progressValue}%)`;

    return (
        <Card className="h-full flex flex-col">
            <CardHeader className=" border-b">
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                        <CardTitle>
                            {" "}
                            {program.subject} • {program.level}
                        </CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-6 flex-1">
                <section className="">
                    <p className=" font-medium pb-3">Progression actuelle</p>
                    <Progress value={progressValue} />
                    <p className="text-xs text-muted-foreground pt-1">
                        {completedText}
                    </p>
                </section>

                <section className="space-y-3">
                    <p className=" font-medium">Prochains chapitres</p>
                    <div className="space-y-2">
                        {program.nextChapters.map((chapter, index) => (
                            <div
                                key={chapter.id}
                                className={cn(
                                    "flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm transition-colors",
                                    index === 0 &&
                                        "border-primary/50 bg-primary/5"
                                )}
                            >
                                <span className="font-medium text-foreground">
                                    {chapter.title}
                                </span>
                                <span className="text-primary text-xs ">
                                    {chapter.plannedHours}h planifiées
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
                <CardFooter className="mt-auto">
                    <Button variant="outline" className="w-full" asChild>
                        <Link
                            to={CourseDetailRoute.to}
                            params={{ courseId: program.id }}
                        >
                            Voir la fiche détaillée
                        </Link>
                    </Button>
                </CardFooter>
            </CardContent>
        </Card>
    );
}

function ProgramSummaryModal({
    open,
    onOpenChange,
    program,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    program: CourseProgram | undefined;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {program
                            ? `${program.subject} • ${program.level}`
                            : "Résumé du programme"}
                    </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                    <ProgramSummaryContent program={program} />
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ProgramSummaryContent({
    program,
}: {
    program: CourseProgram | undefined;
}) {
    if (!program) {
        return (
            <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                    Sélectionnez un cours pour afficher sa progression et ses
                    statistiques.
                </p>
            </div>
        );
    }

    const progressValue = Math.round(
        (program.completedHours / Math.max(program.totalHours, 1)) * 100
    );
    const completedText = `${numberFormatter.format(
        program.completedHours
    )} / ${numberFormatter.format(
        program.totalHours
    )} heures (${progressValue}%)`;

    return (
        <div className="flex flex-col gap-6">
            <Button variant="outline" className="w-full" asChild>
                <Link
                    to={CourseDetailRoute.to}
                    params={{ courseId: program.id }}
                >
                    Voir la fiche détaillée
                </Link>
            </Button>
            <section>
                <p className="font-medium pb-3">Progression actuelle</p>
                <Progress value={progressValue} />
                <p className="text-xs text-muted-foreground pt-1">
                    {completedText}
                </p>
            </section>

            <section className="space-y-3">
                <p className="font-medium">Prochains chapitres</p>
                <div className="space-y-2">
                    {program.nextChapters.map((chapter, index) => (
                        <div
                            key={chapter.id}
                            className={cn(
                                "flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm transition-colors",
                                index === 0 && "border-primary/50 bg-primary/5"
                            )}
                        >
                            <span className="font-medium text-foreground">
                                {chapter.title}
                            </span>
                            <span className="text-primary text-xs">
                                {chapter.plannedHours}h planifiées
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <section className="space-y-3">
                <p className="font-medium">Statistiques</p>
                <div className="flex flex-col gap-3">
                    <SummaryStat
                        label="Supports uploadés"
                        value={numberFormatter.format(program.stats.uploads)}
                    />
                    <SummaryStat
                        label="Évaluations"
                        value={numberFormatter.format(
                            program.stats.evaluations
                        )}
                    />
                </div>
            </section>
        </div>
    );
}
