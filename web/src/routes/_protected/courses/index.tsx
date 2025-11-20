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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FormSheet } from "@/components/ui/form-sheet";
import { CardInfoLayout } from "@/components/ui/card-info-layout";
import { ViewDetailButton } from "@/components/ui/view-detail-button";

import { useCoursePrograms } from "@/features/courses/api/useCoursePrograms";
import type { CourseProgram } from "@/features/courses/types";
import { cn, getColorFromText } from "@/lib/utils";
import { CreateCourseModal } from "@/features/courses/components/CreateCourseModal";

// School filter options - static for now since data doesn't have school field yet
const SCHOOL_FILTER_OPTIONS = [
    { value: "all", label: "Toutes les écoles" },
    { value: "Lycée Jean Moulin", label: "Lycée Jean Moulin" },
    { value: "Collège Saint-Exupéry", label: "Collège Saint-Exupéry" },
] as const;

// DON'T PAY ATTENTION TO THE LOGIC OF FILTERS, IT'S JUST FOR DEMO PURPOSES
type SchoolFilterValue = string;
type ClassFilterValue = string;
type SubjectFilterValue = string;

export const Route = createFileRoute("/_protected/courses/")({
    component: CoursesPage,
});

function CoursesPage() {
    const isMobile = useMediaQuery(`(max-width: ${breakpoints.lg}px)`);

    const { data: allPrograms = [], isLoading } = useCoursePrograms();

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // DON'T PAY ATTENTION TO THE LOGIC OF FILTERS, IT'S JUST FOR DEMO PURPOSES
    // ------- START OF FILTERS LOGIC (NOT FOR PRODUCTION) -------
    const [schoolFilter, setSchoolFilter] = useState<SchoolFilterValue>("all");
    const [classFilter, setClassFilter] = useState<ClassFilterValue>("all");
    const [subjectFilter, setSubjectFilter] =
        useState<SubjectFilterValue>("all");

    // Generate filter options dynamically from data
    const classFilterOptions = useMemo(() => {
        const uniqueLevels = Array.from(
            new Set(allPrograms.map((p) => p.level))
        ).sort();
        return [
            { value: "all", label: "Toutes les classes" },
            ...uniqueLevels.map((level) => ({ value: level, label: level })),
        ];
    }, [allPrograms]);

    const subjectFilterOptions = useMemo(() => {
        const uniqueSubjects = Array.from(
            new Set(allPrograms.map((p) => p.subject))
        ).sort();
        return [
            { value: "all", label: "Toutes les matières" },
            ...uniqueSubjects.map((subject) => ({
                value: subject,
                label: subject,
            })),
        ];
    }, [allPrograms]);

    // Frontend filtering logic
    const programs = useMemo(() => {
        return allPrograms.filter((program) => {
            // Subject filter
            if (subjectFilter !== "all" && program.subject !== subjectFilter) {
                return false;
            }

            // Class filter (using level field)
            if (classFilter !== "all" && program.level !== classFilter) {
                return false;
            }

            return true;
        });
    }, [allPrograms, schoolFilter, classFilter, subjectFilter]);

    // ------- END OF FILTERS LOGIC (NOT FOR PRODUCTION) -------

    // If desktop and no selection, select the first program
    if (!isMobile && !selectedId && programs.length > 0) {
        setSelectedId(programs[0].id);
    }

    // If mobile and modal is closed, reset the selection
    if (isMobile && !isModalOpen && selectedId) {
        setSelectedId(null);
    }

    // If desktop and modal is open, close it
    useEffect(() => {
        if (!isMobile) {
            setIsModalOpen(false);
        }
    }, [isMobile]);

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
        <div className="space-y-6 lg:space-y-6">
            <PageHeader
                title="Progression des cours"
                primaryAction={{
                    label: "Nouveau cours",
                    icon: Plus,
                    onClick: () => {
                        setIsCreateModalOpen(true);
                    },
                }}
            />

            {/* Filters */}
            <section className="mb-6">
                <div className="flex flex-row gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="course-school-filter">École</Label>
                        <Select
                            value={schoolFilter}
                            onValueChange={(value) =>
                                setSchoolFilter(value as SchoolFilterValue)
                            }
                        >
                            <SelectTrigger id="course-school-filter">
                                <SelectValue placeholder="Toutes les écoles" />
                            </SelectTrigger>
                            <SelectContent>
                                {SCHOOL_FILTER_OPTIONS.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="course-class-filter">Classe</Label>
                        <Select
                            value={classFilter}
                            onValueChange={(value) =>
                                setClassFilter(value as ClassFilterValue)
                            }
                        >
                            <SelectTrigger id="course-class-filter">
                                <SelectValue placeholder="Toutes les classes" />
                            </SelectTrigger>
                            <SelectContent>
                                {classFilterOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="course-subject-filter">Matière</Label>
                        <Select
                            value={subjectFilter}
                            onValueChange={(value) =>
                                setSubjectFilter(value as SubjectFilterValue)
                            }
                        >
                            <SelectTrigger id="course-subject-filter">
                                <SelectValue placeholder="Toutes les matières" />
                            </SelectTrigger>
                            <SelectContent>
                                {subjectFilterOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>

            {/* Programs list */}
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

    return (
        <CardInfoLayout
            title={`${program.subject} • ${program.level}`}
            footer={
                <ViewDetailButton
                    to={CourseDetailRoute.to}
                    params={{ courseId: program.id }}
                />
            }
        >
            <ProgramSummaryContent program={program} />
        </CardInfoLayout>
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
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            title={
                program
                    ? `${program.subject} • ${program.level}`
                    : "Résumé du programme"
            }
            children={
                <>
                    <ProgramSummaryContent program={program} />
                </>
            }
            footer={
                program && (
                    <ViewDetailButton
                        to={CourseDetailRoute.to}
                        params={{ courseId: program.id }}
                    />
                )
            }
        ></FormSheet>
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
    const completedText = `${program.completedHours} / ${program.totalHours} heures (${progressValue}%)`;

    const colorScheme = getColorFromText(program.subject);
    console.log(colorScheme);

    return (
        <div className="flex flex-col gap-6">
            <section>
                <p className="font-medium pb-3">Progression actuelle</p>
                <Progress
                    value={progressValue}
                    indicatorClassName={colorScheme.bg}
                />
                <p className="text-xs text-muted-foreground pt-1">
                    {completedText}
                </p>
            </section>

            <section className="space-y-3">
                <p className="font-medium">Prochaines leçons</p>
                <div className="space-y-2">
                    {program.nextLessons.map((lesson) => (
                        <div
                            key={lesson.id}
                            className={cn(
                                "flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm transition-colors"
                            )}
                        >
                            <span className="font-medium text-foreground">
                                {lesson.title}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {lesson?.date
                                    ? lesson.date.toLocaleDateString()
                                    : "Date à préciser"}
                            </span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
