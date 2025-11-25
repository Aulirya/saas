import React, { useEffect, useMemo, useState } from "react";
import { useMediaQuery } from "usehooks-ts";
import { breakpoints } from "@/lib/media";

import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as SubjectDetailRoute } from "./$subjectId";
import { Plus, Eye, BookOpen, ArrowUp, ArrowDown } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";
import {
    Card,
    CardAction,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import {
    useSubjects,
    useSubjectWithLessons,
} from "@/features/subjects/api/useSubjects";
import { SkeletonCard } from "@/components/ui/skeleton";
import { CreateSubjectModal } from "@/features/subjects/components/CreateSubjectModal";
import type { Subject, SubjectWithLessons } from "@saas/shared";
import { cn } from "@/lib/utils";
import { CardInfoLayout } from "@/components/ui/card-info-layout";
import { ViewDetailButton } from "@/components/ui/view-detail-button";
import { FormSheet } from "@/components/ui/form-sheet";
import { formatLessonDateTime } from "@/lib/date";
import type { LessonWithSubject } from "@/types/class.types";

type TypeFilterValue = string;

export const Route = createFileRoute("/_protected/subjects/")({
    component: SubjectsPage,
});

function SubjectsPage() {
    const isMobile = useMediaQuery(`(max-width: ${breakpoints.lg}px)`);

    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [sortBy, setSortBy] = useState<"name" | "updated_at">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Fetch data from database
    const { data: subjects = [], isLoading } = useSubjects();

    // Filter subjects by type
    const filteredSubjects = useMemo(() => {
        if (typeFilter === "all") {
            return subjects;
        }
        return subjects.filter((subject) => subject.type === typeFilter);
    }, [subjects, typeFilter]);

    // Get unique types for filter
    const subjectTypes = useMemo(() => {
        const types = new Set(subjects.map((s) => s.type));
        return Array.from(types).sort();
    }, [subjects]);

    const typeFilterOptions = useMemo(() => {
        return [
            { value: "all", label: "Tous les types" },
            ...subjectTypes.map((type) => ({
                value: type,
                label: type,
            })),
        ];
    }, [subjectTypes]);

    // If desktop and no selection, select the first subject
    if (!isMobile && !selectedId && filteredSubjects.length > 0) {
        setSelectedId(filteredSubjects[0].id);
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

    const selectedSubject = useMemo(() => {
        return filteredSubjects.find((s) => s.id === selectedId);
    }, [filteredSubjects, selectedId]);

    // Sort subjects
    const sortedSubjects = useMemo(() => {
        const sorted = [...filteredSubjects].sort((a, b) => {
            if (sortBy === "name") {
                const nameA = a.name.toLowerCase();
                const nameB = b.name.toLowerCase();
                return sortOrder === "asc"
                    ? nameA.localeCompare(nameB)
                    : nameB.localeCompare(nameA);
            }
            // Sort by updated_at if available
            return 0;
        });
        return sorted;
    }, [filteredSubjects, sortBy, sortOrder]);

    // Calculate pagination
    const totalPages = Math.ceil(sortedSubjects.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedSubjects = useMemo(() => {
        return sortedSubjects.slice(startIndex, endIndex);
    }, [sortedSubjects, startIndex, endIndex]);

    // Reset to page 1 when filters or sorting change
    useEffect(() => {
        setCurrentPage(1);
    }, [typeFilter, sortBy, sortOrder]);

    // Fetch full subject data (with lessons) only when a subject is selected
    const {
        data: selectedSubjectWithDetails,
        isLoading: isLoadingSubjectDetails,
    } = useSubjectWithLessons(selectedId ?? "", {
        enabled: !!selectedId,
    });

    const handleSubjectSelect = (id: string) => {
        setSelectedId(id);
        // On mobile/tablet (< lg), open the modal when a subject is selected
        if (isMobile) {
            setIsModalOpen(true);
        }
    };

    return (
        <>
            <div id="main" className="h-full flex flex-col">
                <div className="space-y-6 lg:space-y-6 ">
                    <PageHeader
                        title="Mes matières"
                        primaryAction={{
                            label: "Nouvelle matière",
                            icon: Plus,
                            onClick: () => {
                                setIsCreateModalOpen(true);
                            },
                        }}
                    />

                    <section className="mb-6 ">
                        <div className="flex flex-row gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="subject-type-filter">
                                    Type
                                </Label>
                                <Select
                                    value={typeFilter}
                                    onValueChange={(value: string) =>
                                        setTypeFilter(value as TypeFilterValue)
                                    }
                                >
                                    <SelectTrigger id="subject-type-filter">
                                        <SelectValue placeholder="Tous les types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {typeFilterOptions.map((option) => (
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
                                <Label htmlFor="subject-sort-by">
                                    Trier par
                                </Label>
                                <div className="flex gap-2">
                                    <Select
                                        value={sortBy}
                                        onValueChange={(
                                            value: "name" | "updated_at"
                                        ) => setSortBy(value)}
                                    >
                                        <SelectTrigger
                                            id="subject-sort-by"
                                            className="w-[140px]"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="name">
                                                Nom
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() =>
                                            setSortOrder(
                                                sortOrder === "asc"
                                                    ? "desc"
                                                    : "asc"
                                            )
                                        }
                                        title={
                                            sortOrder === "asc"
                                                ? "Trier par ordre décroissant"
                                                : "Trier par ordre croissant"
                                        }
                                    >
                                        {sortOrder === "asc" ? (
                                            <ArrowUp className="h-4 w-4" />
                                        ) : (
                                            <ArrowDown className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="grid grid-cols-7 gap-6 m-0 grow overflow-hidden">
                    <div className="space-y-5 col-span-7 lg:col-span-4 xl:col-span-5 overflow-y-auto pr-3 flex flex-col">
                        <div className="flex-1 space-y-5">
                            {isLoading ? (
                                <SkeletonCard />
                            ) : paginatedSubjects.length ? (
                                paginatedSubjects.map((subject) => (
                                    <SubjectCard
                                        key={subject.id}
                                        subjectData={subject}
                                        isSelected={subject.id === selectedId}
                                        onSelect={handleSubjectSelect}
                                    />
                                ))
                            ) : (
                                <Card className="border-dashed">
                                    <CardHeader>
                                        <CardTitle>
                                            Aucune matière trouvée
                                        </CardTitle>
                                        <CardDescription>
                                            Créez votre première matière pour
                                            commencer à organiser vos cours.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardFooter>
                                        <Button
                                            onClick={() =>
                                                setIsCreateModalOpen(true)
                                            }
                                        >
                                            <Plus className="size-4" />
                                            Nouvelle matière
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}
                        </div>
                        {/* Pagination */}
                        {!isLoading &&
                            filteredSubjects.length > 0 &&
                            totalPages > 1 && (
                                <div className="mt-6 flex justify-center">
                                    <Pagination>
                                        <PaginationContent>
                                            <PaginationItem>
                                                <PaginationPrevious
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (currentPage > 1) {
                                                            setCurrentPage(
                                                                currentPage - 1
                                                            );
                                                        }
                                                    }}
                                                    className={
                                                        currentPage === 1
                                                            ? "pointer-events-none opacity-50"
                                                            : "cursor-pointer"
                                                    }
                                                />
                                            </PaginationItem>

                                            {/* Page numbers */}
                                            {Array.from(
                                                { length: totalPages },
                                                (_, i) => i + 1
                                            )
                                                .filter((page) => {
                                                    if (
                                                        page === 1 ||
                                                        page === totalPages ||
                                                        (page >=
                                                            currentPage - 1 &&
                                                            page <=
                                                                currentPage + 1)
                                                    ) {
                                                        return true;
                                                    }
                                                    return false;
                                                })
                                                .map((page, index, array) => {
                                                    const showEllipsisBefore =
                                                        index > 0 &&
                                                        array[index - 1] !==
                                                            page - 1;

                                                    return (
                                                        <React.Fragment
                                                            key={page}
                                                        >
                                                            {showEllipsisBefore && (
                                                                <PaginationItem>
                                                                    <PaginationEllipsis />
                                                                </PaginationItem>
                                                            )}
                                                            <PaginationItem>
                                                                <PaginationLink
                                                                    href="#"
                                                                    isActive={
                                                                        currentPage ===
                                                                        page
                                                                    }
                                                                    onClick={(
                                                                        e
                                                                    ) => {
                                                                        e.preventDefault();
                                                                        setCurrentPage(
                                                                            page
                                                                        );
                                                                    }}
                                                                    className="cursor-pointer"
                                                                >
                                                                    {page}
                                                                </PaginationLink>
                                                            </PaginationItem>
                                                        </React.Fragment>
                                                    );
                                                })}

                                            <PaginationItem>
                                                <PaginationNext
                                                    href="#"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        if (
                                                            currentPage <
                                                            totalPages
                                                        ) {
                                                            setCurrentPage(
                                                                currentPage + 1
                                                            );
                                                        }
                                                    }}
                                                    className={
                                                        currentPage ===
                                                        totalPages
                                                            ? "pointer-events-none opacity-50"
                                                            : "cursor-pointer"
                                                    }
                                                />
                                            </PaginationItem>
                                        </PaginationContent>
                                    </Pagination>
                                </div>
                            )}
                    </div>
                    {/* Desktop sidebar - hidden on mobile */}
                    <div
                        className="space-y-4 hidden lg:block lg:col-span-3 xl:col-span-2 xl:sticky xl:top-28 h-fit"
                        style={{ top: "auto" }}
                    >
                        <SubjectSummarySidebar
                            subjectData={
                                selectedSubjectWithDetails ?? selectedSubject
                            }
                            isLoading={isLoadingSubjectDetails}
                        />
                    </div>
                </div>

                {/* Mobile modal - only visible on screens < lg */}
                <SubjectSummaryModal
                    open={isModalOpen}
                    onOpenChange={(isOpen) => {
                        setIsModalOpen(isOpen);
                        if (!isOpen && isMobile) {
                            setSelectedId(null);
                        }
                    }}
                    subjectData={selectedSubjectWithDetails ?? selectedSubject}
                    isLoading={isLoadingSubjectDetails}
                />

                {/* Create Subject Modal */}
                <CreateSubjectModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                />
            </div>
        </>
    );
}

function SubjectCard({
    subjectData,
    isSelected,
    onSelect,
}: {
    subjectData: Subject;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    return (
        <Card
            role="button"
            tabIndex={0}
            onClick={() => onSelect(subjectData.id)}
            onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(subjectData.id);
                }
            }}
            className={cn(
                "group cursor-pointer border-border/70 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                isSelected
                    ? "border-primary shadow-sm"
                    : "hover:border-primary/50 hover:shadow-sm"
            )}
        >
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            "flex size-12 items-center justify-center rounded-xl bg-muted"
                        )}
                    >
                        <BookOpen className="size-6" aria-hidden />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="">{subjectData.name}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                            <span>{subjectData.type}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{subjectData.hours_per_week}h / semaine</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{subjectData.total_hours}h total</span>
                        </CardDescription>
                    </div>
                </div>

                <CardAction>
                    <Button
                        asChild
                        className="shrink-0 bg-primary hover:bg-primary/90"
                        aria-label="Voir la matière"
                    >
                        <Link
                            to={SubjectDetailRoute.to}
                            params={{ subjectId: subjectData.id }}
                        >
                            <Eye className="size-4" /> Voir la matière
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>
        </Card>
    );
}

function SubjectSummarySidebar({
    subjectData,
    isLoading = false,
}: {
    subjectData: SubjectWithLessons | Subject | undefined;
    isLoading?: boolean;
}) {
    if (!subjectData) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle>Sélectionnez une matière</CardTitle>
                    <CardDescription>
                        Sélectionnez une matière pour afficher son résumé et ses
                        statistiques.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <CardInfoLayout
            title={`${subjectData.name}`}
            description={`${subjectData.type} • ${subjectData.hours_per_week}h / semaine`}
            footer={
                <ViewDetailButton
                    to={SubjectDetailRoute.to}
                    params={{ subjectId: subjectData.id }}
                />
            }
        >
            <SubjectSummaryContent
                subjectData={subjectData}
                isLoading={isLoading}
            />
        </CardInfoLayout>
    );
}

function SubjectSummaryModal({
    open,
    onOpenChange,
    subjectData,
    isLoading = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    subjectData: SubjectWithLessons | Subject | undefined;
    isLoading?: boolean;
}) {
    return (
        <FormSheet
            open={open}
            onOpenChange={onOpenChange}
            title={
                subjectData
                    ? `${subjectData.name} - ${subjectData.type}`
                    : "Résumé de la matière"
            }
            children={
                <>
                    <SubjectSummaryContent
                        subjectData={subjectData}
                        isLoading={isLoading}
                    />
                </>
            }
            footer={
                subjectData && (
                    <ViewDetailButton
                        to={SubjectDetailRoute.to}
                        params={{ subjectId: subjectData.id }}
                    />
                )
            }
        ></FormSheet>
    );
}

function SubjectSummaryContent({
    subjectData,
    isLoading = false,
}: {
    subjectData: SubjectWithLessons | Subject | undefined;
    isLoading?: boolean;
}) {
    if (!subjectData) {
        return (
            <div className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                    Sélectionnez une matière pour afficher son résumé et ses
                    statistiques.
                </p>
            </div>
        );
    }

    // Extract upcoming lessons if the subject has lessons
    const upcomingLessons = useMemo(() => {
        if (
            "lessons" in subjectData &&
            Array.isArray(subjectData.lessons) &&
            subjectData.lessons.length > 0
        ) {
            const lessons = subjectData.lessons
                .map((lesson) => ({
                    ...lesson,
                    subject_name: subjectData.name,
                    start_at: lesson.start_at ?? undefined,
                    end_at: lesson.end_at ?? undefined,
                }))
                .sort((a, b) => {
                    const dateA = new Date(a.start_at || "").getTime();
                    const dateB = new Date(b.start_at || "").getTime();
                    return dateA - dateB;
                })
                .slice(0, 3);

            return lessons as LessonWithSubject[];
        }
        return [];
    }, [subjectData]);

    return (
        <div className="flex flex-col gap-6">
            {/* Upcoming Lessons */}
            <section>
                <p className="font-medium pb-3">Prochaines leçons</p>
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
                                        {lesson.label}
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
