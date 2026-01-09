import React, { useEffect, useMemo, useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as SubjectDetailRoute } from "./$subjectId";
import { Plus, Eye } from "lucide-react";
import { getCategoryConfig, getCategoryLabel } from "@/lib/subject-utils";

import type { SubjectCategory } from "@saas/shared";

import { PageHeader } from "@/components/PageHeader";
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
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import { useSubjects } from "@/features/subjects/api/useSubjects";
import { SkeletonCard } from "@/components/ui/skeleton";
import { SubjectFormModal } from "@/features/subjects/components/SubjectFormModal";
import type { Subject } from "@saas/shared";
import { cn } from "@/lib/utils";

type TypeFilterValue = string;
type CategoryFilterValue = SubjectCategory | "all";

export const Route = createFileRoute("/_protected/subjects/")({
    component: SubjectsPage,
});

function SubjectsPage() {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [typeFilter, setTypeFilter] = useState<TypeFilterValue>("all");
    const [categoryFilter, setCategoryFilter] =
        useState<CategoryFilterValue>("all");
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(5);
    const [sortBy, setSortBy] = useState<"name" | "updated_at">("name");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

    // Fetch data from database
    const { data: subjects = [], isLoading } = useSubjects();

    // Filter subjects by type, category, and search
    const filteredSubjects = useMemo(() => {
        let filtered = subjects;

        // Filter by search query
        if (searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter((subject) =>
                subject.name.toLowerCase().includes(query)
            );
        }

        // Filter by type
        if (typeFilter !== "all") {
            filtered = filtered.filter(
                (subject) => subject.type === typeFilter
            );
        }

        // Filter by category
        if (categoryFilter !== "all") {
            filtered = filtered.filter(
                (subject) => subject.category === categoryFilter
            );
        }

        return filtered;
    }, [subjects, searchQuery, typeFilter, categoryFilter]);

    // Get unique types for filter
    const subjectTypes = useMemo(() => {
        const types = new Set(
            subjects
                .map((s) => s.type)
                .filter(
                    (type): type is string =>
                        type !== null && type !== undefined && type !== ""
                )
        );
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

    // Get unique categories for filter
    const subjectCategories = useMemo(() => {
        const categories = new Set<SubjectCategory>(
            subjects.map((s) => s.category)
        );
        return Array.from(categories).sort((a, b) => {
            const labelA = getCategoryLabel(a);
            const labelB = getCategoryLabel(b);
            return labelA.localeCompare(labelB);
        });
    }, [subjects]);

    const categoryFilterOptions = useMemo(() => {
        return [
            { value: "all" as const, label: "Toutes les catégories" },
            ...subjectCategories.map((category) => ({
                value: category,
                label: getCategoryLabel(category),
            })),
        ];
    }, [subjectCategories]);

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

    // Reset to page 1 when filters, search, or sorting change
    useEffect(() => {
        setCurrentPage(1);
    }, [typeFilter, categoryFilter, searchQuery, sortBy, sortOrder]);

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

                    <FilterBar
                        searchId="subject-search"
                        searchPlaceholder="Rechercher une matière..."
                        searchValue={searchQuery}
                        onSearchChange={setSearchQuery}
                        filters={[
                            {
                                id: "subject-type-filter",
                                label: "Type",
                                value: typeFilter,
                                options: typeFilterOptions,
                                onValueChange: (value: string) =>
                                    setTypeFilter(value as TypeFilterValue),
                                placeholder: "Tous les types",
                            },
                            {
                                id: "subject-category-filter",
                                label: "Catégorie",
                                value: categoryFilter,
                                options: categoryFilterOptions,
                                onValueChange: (value: string) =>
                                    setCategoryFilter(
                                        value as CategoryFilterValue
                                    ),
                                placeholder: "Toutes les catégories",
                            },
                        ]}
                        sortBy={sortBy}
                        sortOptions={[{ value: "name", label: "Nom" }]}
                        onSortByChange={(value: string) =>
                            setSortBy(value as "name" | "updated_at")
                        }
                        sortOrder={sortOrder}
                        onSortOrderChange={setSortOrder}
                    />
                </div>

                <div className="grid grid-cols-7 gap-6 m-0 grow overflow-hidden">
                    <div className="col-span-7 flex flex-col overflow-hidden">
                        {/* Scrollable subjects list */}
                        <div className="flex-1 overflow-y-auto pr-3">
                            <div className="space-y-5">
                                {isLoading ? (
                                    <SkeletonCard />
                                ) : paginatedSubjects.length > 0 ? (
                                    paginatedSubjects.map((subject) => (
                                        <SubjectCard
                                            key={subject.id}
                                            subjectData={subject}
                                        />
                                    ))
                                ) : (
                                    <EmptyStateCard
                                        title="Aucune matière trouvée"
                                        description="Créez votre première matière pour commencer à organiser vos cours."
                                        buttonText="Nouvelle matière"
                                        onButtonClick={() =>
                                            setIsCreateModalOpen(true)
                                        }
                                    />
                                )}
                            </div>
                        </div>
                        {/* Fixed Pagination */}
                        {!isLoading && filteredSubjects.length > 0 && (
                            <div className="flex justify-center shrink-0 pt-4 border-t">
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
                                                    (page >= currentPage - 1 &&
                                                        page <= currentPage + 1)
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
                                                    <React.Fragment key={page}>
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
                                                        currentPage < totalPages
                                                    ) {
                                                        setCurrentPage(
                                                            currentPage + 1
                                                        );
                                                    }
                                                }}
                                                className={
                                                    currentPage === totalPages
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
                </div>

                {/* Create Subject Modal */}
                <SubjectFormModal
                    open={isCreateModalOpen}
                    onOpenChange={setIsCreateModalOpen}
                />
            </div>
        </>
    );
}

function SubjectCard({ subjectData }: { subjectData: Subject }) {
    const categoryConfig = getCategoryConfig(subjectData.category);
    const CategoryIcon = categoryConfig.icon;
    const categoryLabel = getCategoryLabel(subjectData.category);

    return (
        <Card className="border-border/70">
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-start gap-4">
                    <div
                        className={cn(
                            "flex size-12 items-center justify-center rounded-xl",
                            categoryConfig.color
                        )}
                    >
                        <CategoryIcon
                            className={cn("size-6", categoryConfig.iconColor)}
                            aria-hidden
                        />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="">{subjectData.name}</CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                            <span>{subjectData.type}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>{categoryLabel}</span>
                        </CardDescription>
                    </div>
                </div>

                <CardAction>
                    <Button
                        asChild
                        className={cn(
                            "shrink-0 text-white",
                            categoryConfig.buttonColor,
                            categoryConfig.buttonHoverColor
                        )}
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
