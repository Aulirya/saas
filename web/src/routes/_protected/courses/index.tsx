import { useEffect, useMemo, useState } from "react";
import { breakpoints } from "@/lib/media";
import { useMediaQuery } from "usehooks-ts";

import { Route as CourseDetailRoute } from "./$courseId";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, Plus } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import { PageLayout } from "@/components/PageLayout";

import {
    Card,
    CardAction,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FormSheet } from "@/components/ui/form-sheet";
import { CardInfoLayout } from "@/components/ui/card-info-layout";
import { ViewDetailButton } from "@/components/ui/view-detail-button";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { SkeletonCard } from "@/components/ui/skeleton";

import { useCoursePrograms } from "@/features/courses/api/useCoursePrograms";
import type { CourseProgram } from "@/features/courses/types";
import { cn, getColorFromText } from "@/lib/utils";
import { CourseFormModal } from "@/features/courses/components/CourseFormModal";

type LevelFilterValue = string;
type SubjectFilterValue = string;
type ClassFilterValue = string;

export const Route = createFileRoute("/_protected/courses/")({
    component: CoursesPage,
});

function CoursesPage() {
    const isMobile = useMediaQuery(`(max-width: ${breakpoints.lg}px)`);

    // ---------------------------
    // Selection & Modal State
    // ---------------------------
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    // ---------------------------
    // Filters State
    // ---------------------------
    const [levelFilter, setLevelFilter] = useState<LevelFilterValue>("all");
    const [subjectFilter, setSubjectFilter] =
        useState<SubjectFilterValue>("all");
    const [classFilter, setClassFilter] = useState<ClassFilterValue>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");

    // ---------------------------
    // Pagination State
    // ---------------------------
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);

    // ---------------------------
    // Sorting State
    // ---------------------------
    const [sortBy, setSortBy] = useState<"subject" | "level">("subject");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // ---------------------------
    // Data Fetching
    // ---------------------------
    const { data: allPrograms = [], isLoading } = useCoursePrograms();

    // ---------------------------
    // FILTERING
    // ---------------------------
    // Generate filter options dynamically from data, Derive from allPrograms
    const levelFilterOptions = useMemo(() => {
        const uniqueLevels = Array.from(
            new Set(allPrograms.map((p) => p.level))
        ).sort();

        return [
            { value: "all", label: "Tous les niveaux" },
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

    const classFilterOptions = useMemo(() => {
        const uniqueClasses = Array.from(
            new Set(allPrograms.map((p) => p.className))
        ).sort();
        return [
            { value: "all", label: "Toutes les classes" },
            ...uniqueClasses.map((className) => ({
                value: className,
                label: className,
            })),
        ];
    }, [allPrograms]);

    // Filter programs by search query, level, subject, and class
    const filteredPrograms = useMemo(() => {
        let filtered = allPrograms;

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(
                (program) =>
                    program.subject.toLowerCase().includes(query) ||
                    program.level.toLowerCase().includes(query) ||
                    program.className.toLowerCase().includes(query)
            );
        }

        // Filter by subject
        if (subjectFilter !== "all") {
            filtered = filtered.filter(
                (program) => program.subject === subjectFilter
            );
        }

        // Filter by level
        if (levelFilter !== "all") {
            filtered = filtered.filter(
                (program) => program.level === levelFilter
            );
        }

        // Filter by class
        if (classFilter !== "all") {
            filtered = filtered.filter(
                (program) => program.className === classFilter
            );
        }

        return filtered;
    }, [allPrograms, searchQuery, subjectFilter, levelFilter, classFilter]);

    // ---------------------------
    // SORTING
    // ---------------------------
    const sortedPrograms = useMemo(() => {
        const sorted = [...filteredPrograms].sort((a, b) => {
            if (sortBy === "subject") {
                const subjectA = a.subject.toLowerCase();
                const subjectB = b.subject.toLowerCase();
                return sortOrder === "asc"
                    ? subjectA.localeCompare(subjectB)
                    : subjectB.localeCompare(subjectA);
            }
            // Sort by level
            const levelA = a.level.toLowerCase();
            const levelB = b.level.toLowerCase();
            return sortOrder === "asc"
                ? levelA.localeCompare(levelB)
                : levelB.localeCompare(levelA);
        });
        return sorted;
    }, [filteredPrograms, sortBy, sortOrder]);

    // ---------------------------
    // PAGINATION
    // ---------------------------
    const totalPages = Math.ceil(sortedPrograms.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedPrograms = useMemo(() => {
        return sortedPrograms.slice(startIndex, endIndex);
    }, [sortedPrograms, startIndex, endIndex]);

    // Reset to page 1 when filters, search, or sorting change
    useEffect(() => {
        setCurrentPage(1);
    }, [
        levelFilter,
        subjectFilter,
        classFilter,
        searchQuery,
        sortBy,
        sortOrder,
    ]);

    // ---------------------------
    // SELECTION
    // ---------------------------
    if (!isMobile && !selectedId && sortedPrograms.length > 0) {
        setSelectedId(sortedPrograms[0].id);
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
        return sortedPrograms.find((program) => program.id === selectedId);
    }, [sortedPrograms, selectedId]);

    const handleProgramSelect = (id: string) => {
        setSelectedId(id);
        // On mobile/tablet (< lg), open the modal when a program is selected
        if (isMobile) {
            setIsModalOpen(true);
        }
    };

    return (
        <PageLayout
            header={
                <>
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

                    <FilterBar
                        searchId="course-search"
                        searchPlaceholder="Rechercher un cours..."
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        filters={[
                            {
                                id: "course-subject-filter",
                                label: "Matière",
                                value: subjectFilter,
                                options: subjectFilterOptions,
                                onValueChange: (value: string) =>
                                    setSubjectFilter(
                                        value as SubjectFilterValue
                                    ),
                                placeholder: "Toutes les matières",
                            },
                            {
                                id: "course-level-filter",
                                label: "Niveau",
                                value: levelFilter,
                                options: levelFilterOptions,
                                onValueChange: (value: string) =>
                                    setLevelFilter(value as LevelFilterValue),
                                placeholder: "Tous les niveaux",
                            },
                            {
                                id: "course-class-filter",
                                label: "Classe",
                                value: classFilter,
                                options: classFilterOptions,
                                onValueChange: (value: string) =>
                                    setClassFilter(value as ClassFilterValue),
                                placeholder: "Toutes les classes",
                            },
                        ]}
                        sortBy={sortBy}
                        sortOptions={[
                            { value: "subject", label: "Matière" },
                            { value: "level", label: "Niveau" },
                        ]}
                        onSortByChange={(value: string) =>
                            setSortBy(value as "subject" | "level")
                        }
                        sortOrder={sortOrder}
                        onSortOrderChange={setSortOrder}
                    />
                </>
            }
        >
            <div className="grid grid-cols-7 gap-6 m-0 grow overflow-hidden">
                <div className="col-span-7 lg:col-span-4 xl:col-span-5 flex flex-col overflow-hidden">
                    {/* Scrollable programs list */}
                    <div className="flex-1 overflow-y-auto pr-3 pt-3 pl-3">
                        <div className="space-y-5">
                            {isLoading ? (
                                <SkeletonCard />
                            ) : paginatedPrograms.length > 0 ? (
                                paginatedPrograms.map((program) => (
                                    <ProgramCard
                                        key={program.id}
                                        program={program}
                                        isSelected={program.id === selectedId}
                                        onSelect={handleProgramSelect}
                                    />
                                ))
                            ) : (
                                <EmptyStateCard
                                    title="Aucun cours trouvé"
                                    description="Créez votre premier programme pour commencer à planifier vos cours."
                                    buttonText="Nouveau cours"
                                    onButtonClick={() =>
                                        setIsCreateModalOpen(true)
                                    }
                                />
                            )}
                        </div>
                    </div>
                    {/* Fixed Pagination */}
                    {!isLoading && filteredPrograms.length > 0 && (
                        <PaginationControls
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={setCurrentPage}
                        />
                    )}
                </div>

                {/* Desktop sidebar - hidden on mobile */}
                {paginatedPrograms.length > 0 && (
                    <div
                        className="space-y-4 hidden overflow-hidden lg:block pt-3 h-auto pr-3 lg:col-span-3 xl:col-span-2 xl:sticky xl:top-28 "
                        style={{ top: "auto" }}
                    >
                        <ProgramSummary program={selectedProgram} />
                    </div>
                )}
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
            <CourseFormModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </PageLayout>
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
                            {program.subject} • {program.className}
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
        return;
    }

    const progressValue = Math.round(
        (program.completedHours / Math.max(program.totalHours, 1)) * 100
    );
    const completedText = `${program.completedHours} / ${program.totalHours} heures (${progressValue}%)`;

    const colorScheme = getColorFromText(program.subject);

    return (
        <div className="flex flex-col gap-6 overflow-y-scroll ">
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
