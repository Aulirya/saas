import { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { breakpoints } from "@/lib/media";

import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as ClassDetailRoute } from "./$classId";
import { Plus, Eye } from "lucide-react";
import { getClassConfig } from "@/lib/class-utils";

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
import { FilterBar } from "@/components/ui/filter-bar";
import { EmptyStateCard } from "@/components/ui/empty-state-card";
import { PaginationControls } from "@/components/ui/pagination-controls";

import {
    useSchoolClasses,
    useSchools,
    useClassesLevels,
} from "@/features/classes/api/useSchoolClasses";
import { useSchoolClassWithSubjects } from "@/features/classes/api/useSchoolClass";
import { SkeletonCard } from "@/components/ui/skeleton";
import { ClassFormModal } from "@/features/classes/components/ClassFormModal";
import type { SchoolClass } from "@/features/classes/types";
import { cn } from "@/lib/utils";
import { CardInfoLayout } from "@/components/ui/card-info-layout";
import { ViewDetailButton } from "@/components/ui/view-detail-button";
import { FormSheet } from "@/components/ui/form-sheet";
import { SchoolClassWithSubjectsAndLessons } from "@saas/shared";
import { formatLessonDateTime } from "@/lib/date";
import type { LessonWithSubject } from "@/types/class.types";

type SchoolFilterValue = string;
type LevelFilterValue = string;

export const Route = createFileRoute("/_protected/classes/")({
    component: ClassesPage,
    // A voir sur tanstack router
    // loader: async ({ context }) => {
    //     const schools = await orpc.schoolClass.listSchools.call({});
    //     const levels = await orpc.schoolClass.listLevels.call({});
    //     return { schools, levels };
    // },
});

function ClassesPage() {
    // const isMobile = false;
    const isMobile = useMediaQuery(`(max-width: ${breakpoints.lg}px)`);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [schoolFilter, setSchoolFilter] = useState<SchoolFilterValue>("all");
    const [levelFilter, setLevelFilter] = useState<LevelFilterValue>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5); // Items per page
    const [sortBy, setSortBy] = useState<"name" | "updated_at">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Fetch data from database
    const { data: classes = [], isLoading } = useSchoolClasses({
        school: schoolFilter !== "all" ? schoolFilter : undefined,
        level: levelFilter !== "all" ? levelFilter : undefined,
    });

    console.log("classes: ", classes);

    // WORK ON view pre-loading
    const { data: schools = [], isLoading: isLoadingSchools } = useSchools();
    const { data: levels = [], isLoading: isLoadingLevels } =
        useClassesLevels();

    // ----- FILTER OPTIONS -----
    const schoolFilterOptions = useMemo(() => {
        return [
            { value: "all", label: "Toutes les écoles" },
            ...schools.map((school) => ({
                value: school,
                label: school,
            })),
        ];
    }, [schools]);

    const levelFilterOptions = useMemo(() => {
        return [
            { value: "all", label: "Tous les niveaux" },
            ...levels.map((level) => ({
                value: level,
                label: level,
            })),
        ];
    }, [levels]);

    // If desktop and no selection, select the first program
    if (!isMobile && !selectedId && classes.length > 0) {
        setSelectedId(classes[0].id);
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

    const selectedClass = useMemo(() => {
        return classes.find((cls) => cls.id === selectedId);
    }, [classes, selectedId]);

    // Filter classes by search query
    const filteredClasses = useMemo(() => {
        let filtered = classes;

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((cls) =>
                cls.name.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [classes, searchQuery]);

    // Sort classes
    const sortedClasses = useMemo(() => {
        const sorted = [...filteredClasses].sort((a, b) => {
            if (sortBy === "name") {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                return sortOrder === "asc"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }
            // Sort by updated_at
            const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
            const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
            return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        return sorted;
    }, [filteredClasses, sortBy, sortOrder]);

    // Calculate pagination
    const totalPages = Math.ceil(sortedClasses.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedClasses = useMemo(() => {
        return sortedClasses.slice(startIndex, endIndex);
    }, [sortedClasses, startIndex, endIndex]);

    // Reset to page 1 when filters, search, or sorting change
    useEffect(() => {
        setCurrentPage(1);
    }, [schoolFilter, levelFilter, searchQuery, sortBy, sortOrder]);

    // Fetch full class data (with subjects and lessons) only when a class is selected
    // This avoids loading lessons for all classes, only fetching when needed
    const { data: selectedClassWithDetails, isLoading: isLoadingClassDetails } =
        useSchoolClassWithSubjects(selectedId ?? "", {
            enabled: !!selectedId, // Only fetch if a class is selected
        });

    const handleClassSelect = (id: string) => {
        setSelectedId(id);
        // On mobile/tablet (< lg), open the modal when a class is selected
        if (isMobile) {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <PageLayout
                header={
                    <>
                        <PageHeader
                            title="Mes classes"
                            primaryAction={{
                                label: "Nouvelle classe",
                                icon: Plus,
                                onClick: () => {
                                    setIsCreateModalOpen(true);
                                },
                            }}
                        />

                        <FilterBar
                            searchId="class-search"
                            searchPlaceholder="Rechercher une classe..."
                            searchValue={searchQuery}
                            onSearchChange={setSearchQuery}
                            filters={[
                                {
                                    id: "class-school-filter",
                                    label: "École",
                                    value: schoolFilter,
                                    options: schoolFilterOptions,
                                    onValueChange: (value: string) =>
                                        setSchoolFilter(
                                            value as SchoolFilterValue
                                        ),
                                    placeholder: "Toutes les écoles",
                                    isLoading: isLoadingSchools,
                                },
                                {
                                    id: "class-level-filter",
                                    label: "Niveau",
                                    value: levelFilter,
                                    options: levelFilterOptions,
                                    onValueChange: (value: string) =>
                                        setLevelFilter(
                                            value as LevelFilterValue
                                        ),
                                    placeholder: "Tous les niveaux",
                                    isLoading: isLoadingLevels,
                                },
                            ]}
                            sortBy={sortBy}
                            sortOptions={[
                                { value: "name", label: "Nom" },
                                {
                                    value: "updated_at",
                                    label: "Date de modification",
                                },
                            ]}
                            onSortByChange={(value: string) =>
                                setSortBy(value as "name" | "updated_at")
                            }
                            sortOrder={sortOrder}
                            onSortOrderChange={setSortOrder}
                        />
                    </>
                }
            >
                <div className="grid grid-cols-7 gap-6 m-0 grow overflow-hidden">
                    <div className="col-span-7 lg:col-span-4 xl:col-span-5 flex flex-col overflow-hidden">
                        {/* Scrollable classes list */}
                        <div className="flex-1 overflow-y-auto pr-3 pt-3 pl-3">
                            <div className="space-y-5">
                                {isLoading ? (
                                    <SkeletonCard />
                                ) : paginatedClasses.length > 0 ? (
                                    paginatedClasses.map((cls) => (
                                        <ClassCard
                                            key={cls.id}
                                            classData={cls}
                                            isSelected={cls.id === selectedId}
                                            onSelect={handleClassSelect}
                                        />
                                    ))
                                ) : (
                                    <EmptyStateCard
                                        title="Aucune classe trouvée"
                                        description="Créez votre première classe pour commencer à suivre vos élèves."
                                        buttonText="Nouvelle classe"
                                        onButtonClick={() =>
                                            setIsCreateModalOpen(true)
                                        }
                                    />
                                )}
                            </div>
                        </div>
                        {/* Fixed Pagination */}
                        {!isLoading && filteredClasses.length > 0 && (
                            <PaginationControls
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                            />
                        )}
                    </div>
                    {/* Desktop sidebar - hidden on mobile */}
                    <div
                        className="space-y-4 hidden lg:block pt-3 pr-3 lg:col-span-3 xl:col-span-2 xl:sticky xl:top-28 h-fit"
                        style={{ top: "auto" }}
                    >
                        <ClassSummarySidebar
                            classData={
                                selectedClassWithDetails ?? selectedClass
                            }
                            isLoading={isLoadingClassDetails}
                        />
                    </div>
                </div>

                {/* Mobile modal - only visible on screens < lg */}
                <ClassSummaryModal
                    open={isModalOpen}
                    onOpenChange={(isOpen) => {
                        setIsModalOpen(isOpen);
                        if (!isOpen && isMobile) {
                            setSelectedId(null);
                        }
                    }}
                    classData={selectedClassWithDetails ?? selectedClass}
                    isLoading={isLoadingClassDetails}
                />

                {/* Create Class Modal */}
                <ClassFormModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                />
            </PageLayout>
        </>
    );
}

function ClassCard({
    classData,
    isSelected,
    onSelect,
}: {
    classData: SchoolClass;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    const classConfig = getClassConfig(classData.level);

    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={() => onSelect(classData.id)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(classData.id);
                }
            }}
            className={cn(
                "group cursor-pointer border-border/70 transition-all duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                "hover:shadow-md hover:scale-[1.01]",
                isSelected
                    ? `${classConfig.ringColor} shadow-md ring-2 `
                    : `${classConfig.ringHoverColor} `
            )}
        >
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4 flex-1">
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <CardTitle className="text-lg font-semibold">
                            {classData.name}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="font-medium text-foreground/80">
                                {classData.school}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span>{classData.level}</span>
                            {classData.students_count !== undefined && (
                                <>
                                    <span className="text-muted-foreground">
                                        •
                                    </span>
                                    <span className="text-muted-foreground">
                                        {classData.students_count} élève
                                        {classData.students_count > 1
                                            ? "s"
                                            : ""}
                                    </span>
                                </>
                            )}
                        </CardDescription>
                    </div>
                </div>

                <CardAction>
                    <Button
                        asChild
                        className={cn(
                            "shrink-0 text-white transition-all",
                            classConfig.buttonColor,
                            classConfig.buttonHoverColor,
                            "group-hover:shadow-sm"
                        )}
                        aria-label="Voir la classe"
                    >
                        <Link
                            to={ClassDetailRoute.to}
                            params={{ classId: classData.id }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Eye className="size-4" /> Voir la classe
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>
        </Card>
    );
}

function ClassSummarySidebar({
    classData,
    isLoading = false,
}: {
    classData: SchoolClassWithSubjectsAndLessons | SchoolClass | undefined;
    isLoading?: boolean;
}) {
    const classConfig = getClassConfig(classData?.level ?? "");
    if (!classData) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle>Sélectionnez une classe</CardTitle>
                    <CardDescription>
                        Sélectionnez une classe pour afficher son résumé et ses
                        statistiques.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <CardInfoLayout
            title={`${classData.name}`}
            description={`${classData.school} - ${classData.level}`}
            className={classConfig.ringColor}
            footer={
                <ViewDetailButton
                    to={ClassDetailRoute.to}
                    params={{ classId: classData.id }}
                />
            }
        >
            <ClassSummaryContent classData={classData} isLoading={isLoading} />
        </CardInfoLayout>
    );
}

function ClassSummaryModal({
    open,
    onOpenChange,
    classData,
    isLoading = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classData: SchoolClassWithSubjectsAndLessons | SchoolClass | undefined;
    isLoading?: boolean;
}) {
    return (
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            title={
                classData
                    ? `${classData.name} - ${classData.school}`
                    : "Résumé de la classe"
            }
            children={
                <>
                    <ClassSummaryContent
                        classData={classData}
                        isLoading={isLoading}
                    />
                </>
            }
            footer={
                classData && (
                    <ViewDetailButton
                        to={ClassDetailRoute.to}
                        params={{ classId: classData.id }}
                    />
                )
            }
        ></FormSheet>
    );
}

function ClassSummaryContent({
    classData,
    isLoading = false,
}: {
    classData: SchoolClassWithSubjectsAndLessons | SchoolClass | undefined;
    isLoading?: boolean;
}) {
    if (!classData) {
        return (
            <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                    Sélectionnez une classe pour afficher son résumé et ses
                    statistiques.
                </p>
            </div>
        );
    }

    // Extract upcoming lessons if the class has subjects with lessons
    const upcomingLessons = useMemo(() => {
        // Check if classData has subjects (it's SchoolClassWithSubjectsAndLessons)
        if (
            "subjects" in classData &&
            Array.isArray(classData.subjects) &&
            classData.subjects.length > 0
        ) {
            const lessons = (
                classData.subjects as Array<{
                    name: string;
                    lessons?: Array<{
                        id: string;
                        label: string;
                        start_at?: string | null;
                        end_at?: string | null;
                    }>;
                }>
            )
                .flatMap((subject) => {
                    const subjectLessons = subject.lessons || [];
                    return subjectLessons.map((lesson) => ({
                        ...lesson,
                        subject_name: subject.name,
                        // Convert null to undefined for type compatibility
                        start_at: lesson.start_at ?? undefined,
                        end_at: lesson.end_at ?? undefined,
                    }));
                })
                // Filter to get upcoming lessons (optional - remove if you want all lessons)
                // .filter((lesson) => {
                //     if (!lesson.start_at) return false;
                //     return new Date(lesson.start_at) >= now;
                // })
                .sort((a, b) => {
                    const dateA = new Date(a.start_at || "").getTime();
                    const dateB = new Date(b.start_at || "").getTime();
                    return dateA - dateB;
                })
                .slice(0, 3); // Show only the next 3 lessons

            return lessons as LessonWithSubject[];
        }
        return [];
    }, [classData]);

    return (
        <div className="flex flex-col gap-6">
            {/* Upcoming Lessons */}
            <section>
                <p className="font-medium py-3">Prochaines leçons</p>
                {isLoading ? (
                    <div className="space-y-2">
                        <div className="h-16 rounded-lg border border-border/60 bg-muted/20 animate-pulse" />
                        <div className="h-16 rounded-lg border border-border/60 bg-muted/20 animate-pulse" />
                    </div>
                ) : upcomingLessons.length > 0 ? (
                    <div className="space-y-2">
                        {upcomingLessons.map((lesson) => {
                            const { dateStr, timeStr } = formatLessonDateTime(
                                lesson.start_at,
                                lesson.end_at
                            );

                            return (
                                <div
                                    key={lesson.id}
                                    className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm"
                                >
                                    <span className="font-semibold text-foreground">
                                        {lesson.subject_name} — {lesson.label}
                                    </span>
                                    {dateStr && (
                                        <span className="text-xs text-muted-foreground">
                                            {dateStr}
                                            {timeStr && ` • ${timeStr}`}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground">
                        Aucune leçon planifiée prochainement
                    </p>
                )}
            </section>
        </div>
    );
}
