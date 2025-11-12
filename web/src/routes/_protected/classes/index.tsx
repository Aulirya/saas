import { useEffect, useMemo, useState } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { Route as ClassDetailRoute } from "./$classId";
import { Download, Plus, Search, UserPlus, Eye } from "lucide-react";

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { SummaryStat } from "@/components/ui/summary-stat";
import {
    useSchoolClasses,
    type SchoolClassesFilters,
} from "@/features/classes/api/useSchoolClasses";
import { CreateClassModal } from "@/features/classes/components/CreateClassModal";
import type { SchoolClassExtended } from "@/features/classes/types";
import { cn } from "@/lib/utils";

const colorThemeToClasses: Record<
    "blue" | "green" | "orange",
    {
        bg: string;
        text: string;
        border: string;
        button: string;
        progress: string;
    }
> = {
    blue: {
        bg: "bg-blue-50",
        text: "text-blue-600",
        border: "border-blue-200",
        button: "bg-blue-600 hover:bg-blue-700",
        progress: "bg-blue-600",
    },
    green: {
        bg: "bg-green-50",
        text: "text-green-600",
        border: "border-green-200",
        button: "bg-green-600 hover:bg-green-700",
        progress: "bg-green-600",
    },
    orange: {
        bg: "bg-orange-50",
        text: "text-orange-600",
        border: "border-orange-200",
        button: "bg-orange-600 hover:bg-orange-700",
        progress: "bg-orange-600",
    },
};

const numberFormatter = new Intl.NumberFormat("fr-FR");

const SCHOOL_FILTER_OPTIONS = [
    { value: "all", label: "Toutes les écoles" },
    { value: "Lycée Jean Moulin", label: "Lycée Jean Moulin" },
    { value: "Collège Saint-Exupéry", label: "Collège Saint-Exupéry" },
] as const;

const LEVEL_FILTER_OPTIONS = [
    { value: "all", label: "Tous les niveaux" },
    { value: "Terminale", label: "Terminale" },
    { value: "Première", label: "Première" },
    { value: "Seconde", label: "Seconde" },
] as const;

type SchoolFilterValue = (typeof SCHOOL_FILTER_OPTIONS)[number]["value"];
type LevelFilterValue = (typeof LEVEL_FILTER_OPTIONS)[number]["value"];

export const Route = createFileRoute("/_protected/classes/")({
    component: ClassesPage,
});

function ClassesPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [schoolFilter, setSchoolFilter] = useState<SchoolFilterValue>("all");
    const [levelFilter, setLevelFilter] = useState<LevelFilterValue>("all");
    const [searchTerm, setSearchTerm] = useState("");

    const queryFilters = useMemo<SchoolClassesFilters>(
        () => ({
            school: schoolFilter !== "all" ? schoolFilter : null,
            level: levelFilter !== "all" ? levelFilter : null,
            search: searchTerm.trim() || null,
        }),
        [schoolFilter, levelFilter, searchTerm]
    );

    const { data: classes = [], isLoading } = useSchoolClasses(queryFilters);

    useEffect(() => {
        // Check if screen is below lg breakpoint (1024px)
        const checkMobile = () => {
            const mobile = window.innerWidth < 1024;
            setIsMobile(mobile);
            // Close modal when resizing to desktop
            if (!mobile && isModalOpen) {
                setIsModalOpen(false);
            }
            if (mobile && !isModalOpen) {
                setSelectedId(null);
            }
        };
        checkMobile();
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, [isModalOpen]);

    useEffect(() => {
        if (!classes.length) {
            setSelectedId(null);
            return;
        }

        if (isMobile) {
            if (selectedId && !classes.some((cls) => cls.id === selectedId)) {
                setSelectedId(null);
            }
            return;
        }

        if (!selectedId || !classes.some((cls) => cls.id === selectedId)) {
            setSelectedId(classes[0]?.id || null);
        }
    }, [classes, selectedId, isMobile]);

    const selectedClass = useMemo(() => {
        return classes.find((cls) => cls.id === selectedId);
    }, [classes, selectedId]);

    const handleClassSelect = (id: string) => {
        setSelectedId(id);
        // On mobile/tablet (< lg), open the modal when a class is selected
        if (isMobile) {
            setIsModalOpen(true);
        }
    };

    return (
        <div className="space-y-6 lg:space-y-6">
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

            <section className="">
                <div className="flex flex-row gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="class-search">Rechercher</Label>
                        <div className="relative">
                            <Search className="bg-white pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="class-search"
                                type="search"
                                placeholder="Rechercher une classe, un élève, une matière..."
                                value={searchTerm}
                                onChange={(event) =>
                                    setSearchTerm(event.target.value)
                                }
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="class-school-filter">École</Label>
                        <Select
                            value={schoolFilter}
                            onValueChange={(value) =>
                                setSchoolFilter(value as SchoolFilterValue)
                            }
                        >
                            <SelectTrigger id="class-school-filter">
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
                        <Label htmlFor="class-level-filter">Niveau</Label>
                        <Select
                            value={levelFilter}
                            onValueChange={(value) =>
                                setLevelFilter(value as LevelFilterValue)
                            }
                        >
                            <SelectTrigger id="class-level-filter">
                                <SelectValue placeholder="Tous les niveaux" />
                            </SelectTrigger>
                            <SelectContent>
                                {LEVEL_FILTER_OPTIONS.map((option) => (
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

            <div className="grid grid-cols-7 gap-6">
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
                    ) : classes.length ? (
                        classes.map((cls) => (
                            <ClassCard
                                key={cls.id}
                                classData={cls}
                                isSelected={cls.id === selectedId}
                                onSelect={handleClassSelect}
                            />
                        ))
                    ) : (
                        <Card className="border-dashed">
                            <CardHeader>
                                <CardTitle>Aucune classe trouvée</CardTitle>
                                <CardDescription>
                                    Créez votre première classe pour commencer à
                                    suivre vos élèves.
                                </CardDescription>
                            </CardHeader>
                            <CardFooter>
                                <Button
                                    onClick={() =>
                                        console.log("Create new class")
                                    }
                                >
                                    <Plus className="size-4" />
                                    Nouvelle classe
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                </div>

                {/* Desktop sidebar - hidden on mobile */}
                <div className="space-y-4 hidden lg:block lg:col-span-3 xl:col-span-2 xl:sticky xl:top-28">
                    <ClassSummarySidebar classData={selectedClass} />
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
                classData={selectedClass}
            />

            {/* Create Class Modal */}
            <CreateClassModal
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
            />
        </div>
    );
}

function ClassCard({
    classData,
    isSelected,
    onSelect,
}: {
    classData: SchoolClassExtended;
    isSelected: boolean;
    onSelect: (id: string) => void;
}) {
    const Icon = classData.icon;
    const colorTheme = colorThemeToClasses[classData.colorTheme];

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
                            "flex size-12 items-center justify-center rounded-xl",
                            colorTheme.bg,
                            colorTheme.text
                        )}
                    >
                        <Icon className="size-6" aria-hidden />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-xl sm:text-2xl">
                            {classData.name}
                        </CardTitle>
                        <CardDescription className="flex flex-wrap items-center gap-2 text-sm">
                            <span>{classData.school}</span>
                            <span className="text-muted-foreground">•</span>
                            <span>Année {classData.year}</span>
                        </CardDescription>
                    </div>
                </div>

                <CardAction>
                    <Button
                        asChild
                        className={cn(
                            "shrink-0",
                            colorThemeToClasses[classData.colorTheme].button
                        )}
                        aria-label="Voir la classe"
                    >
                        <Link
                            to={ClassDetailRoute.to}
                            params={{ classId: classData.id }}
                        >
                            <Eye className="size-4" /> Voir la classe
                        </Link>
                    </Button>
                </CardAction>
            </CardHeader>
        </Card>
    );
}

function ClassMetric({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color?: "blue" | "green" | "orange" | "purple";
}) {
    return (
        <div className="rounded-lg transition-colors">
            <p
                className={cn(
                    "mt-2 text-xl font-bold text-center",
                    color === "blue" && "text-blue-500",
                    color === "green" && "text-green-500",
                    color === "orange" && "text-orange-500",
                    color === "purple" && "text-purple-500",
                    !color && "text-primary"
                )}
            >
                {value}
            </p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground text-center">
                {label}
            </p>
        </div>
    );
}

function ClassSummarySidebar({
    classData,
}: {
    classData: SchoolClassExtended | undefined;
}) {
    if (!classData) {
        return (
            <Card className="border-dashed">
                <CardHeader>
                    <CardTitle>Résumé sélectionné</CardTitle>
                    <CardDescription>
                        Sélectionnez une classe pour afficher son résumé et ses
                        statistiques.
                    </CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* New Class Button */}

            {/* Summary Card */}
            <Card>
                <CardHeader className="space-y-3 border-b">
                    <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                            <CardTitle>Résumé sélectionné</CardTitle>
                            <CardDescription>
                                {classData.name} - {classData.school}
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-6 pt-6">
                    {/* Subject Distribution */}
                    <section>
                        <p className="font-medium pb-3">
                            Répartition par matière
                        </p>
                        <div className="space-y-3">
                            {classData.subjectDistribution.map((dist) => (
                                <div key={dist.subject} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">
                                            {dist.subject}
                                        </span>
                                        <span className="text-muted-foreground">
                                            {dist.hoursPerWeek}h/sem
                                        </span>
                                    </div>
                                    <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                        <div
                                            className={cn(
                                                "h-full transition-all",
                                                dist.color === "blue" &&
                                                    "bg-blue-600",
                                                dist.color === "green" &&
                                                    "bg-green-600",
                                                dist.color === "purple" &&
                                                    "bg-purple-600",
                                                dist.color === "orange" &&
                                                    "bg-orange-600"
                                            )}
                                            style={{
                                                transform: `translateX(-${
                                                    100 - dist.percentage
                                                }%)`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Upcoming Courses */}
                    {classData.upcomingCourses.length > 0 && (
                        <section className="space-y-3">
                            <p className="font-medium">Prochains cours</p>
                            <div className="space-y-2">
                                {classData.upcomingCourses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm"
                                    >
                                        <span
                                            className={cn(
                                                "font-medium",
                                                course.color === "blue" &&
                                                    "text-blue-600",
                                                course.color === "green" &&
                                                    "text-green-600",
                                                course.color === "purple" &&
                                                    "text-purple-600"
                                            )}
                                        >
                                            {course.subject} - {course.title}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {course.date} {course.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </CardContent>
                <CardFooter>
                    <Button variant="outline" className="w-full" asChild>
                        <Link
                            to={ClassDetailRoute.to}
                            params={{ classId: classData.id }}
                        >
                            Voir la fiche détaillée
                        </Link>
                    </Button>
                </CardFooter>
            </Card>

            {/* Statistics Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Statistiques</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <SummaryStat
                        label="Présence moyenne"
                        value={`${classData.statistics.averageAttendance}%`}
                    />
                    <SummaryStat
                        label="Devoirs rendus"
                        value={`${classData.statistics.homeworkSubmitted}%`}
                    />
                    <SummaryStat
                        label="Évaluations"
                        value={numberFormatter.format(
                            classData.statistics.evaluations
                        )}
                    />
                </CardContent>
            </Card>

            {/* Class Analysis Card */}
            {classData.analyses.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <svg
                                className="size-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                />
                            </svg>
                            Analyses de classe
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                        {classData.analyses.map((analysis, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "rounded-lg border px-4 py-3 text-sm",
                                    analysis.type === "success" &&
                                        "bg-emerald-50 border-emerald-200 text-emerald-700",
                                    analysis.type === "warning" &&
                                        "bg-amber-50 border-amber-200 text-amber-700"
                                )}
                            >
                                {analysis.message}
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Actions rapides</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <button
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                        onClick={() => console.log("Add student")}
                    >
                        <UserPlus className="size-4" />
                        Ajouter élève
                    </button>
                    <button
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                        onClick={() => console.log("Export list")}
                    >
                        <Download className="size-4" />
                        Exporter liste
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}

function ClassSummaryModal({
    open,
    onOpenChange,
    classData,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    classData: SchoolClassExtended | undefined;
}) {
    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>
                        {classData
                            ? `${classData.name} - ${classData.school}`
                            : "Résumé de la classe"}
                    </SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                    <ClassSummaryContent classData={classData} />
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ClassSummaryContent({
    classData,
}: {
    classData: SchoolClassExtended | undefined;
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

    const numberFormatter = new Intl.NumberFormat("fr-FR");

    return (
        <div className="flex flex-col gap-6">
            {/* Subject Distribution */}
            <section>
                <p className="font-medium pb-3">Répartition par matière</p>
                <div className="space-y-3">
                    {classData.subjectDistribution.map((dist) => (
                        <div key={dist.subject} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">
                                    {dist.subject}
                                </span>
                                <span className="text-muted-foreground">
                                    {dist.hoursPerWeek}h/sem
                                </span>
                            </div>
                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                                <div
                                    className={cn(
                                        "h-full transition-all",
                                        dist.color === "blue" && "bg-blue-600",
                                        dist.color === "green" &&
                                            "bg-green-600",
                                        dist.color === "purple" &&
                                            "bg-purple-600",
                                        dist.color === "orange" &&
                                            "bg-orange-600"
                                    )}
                                    style={{
                                        transform: `translateX(-${
                                            100 - dist.percentage
                                        }%)`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Upcoming Courses */}
            {classData.upcomingCourses.length > 0 && (
                <section className="space-y-3">
                    <p className="font-medium">Prochains cours</p>
                    <div className="space-y-2">
                        {classData.upcomingCourses.map((course) => (
                            <div
                                key={course.id}
                                className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 px-4 py-3 text-sm"
                            >
                                <span
                                    className={cn(
                                        "font-medium",
                                        course.color === "blue" &&
                                            "text-blue-600",
                                        course.color === "green" &&
                                            "text-green-600",
                                        course.color === "purple" &&
                                            "text-purple-600"
                                    )}
                                >
                                    {course.subject} - {course.title}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    {course.date} {course.time}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Statistics */}
            <section className="space-y-3">
                <p className="font-medium">Statistiques</p>
                <div className="flex flex-col gap-3">
                    <SummaryStat
                        label="Présence moyenne"
                        value={`${classData.statistics.averageAttendance}%`}
                    />
                    <SummaryStat
                        label="Devoirs rendus"
                        value={`${classData.statistics.homeworkSubmitted}%`}
                    />
                    <SummaryStat
                        label="Évaluations"
                        value={numberFormatter.format(
                            classData.statistics.evaluations
                        )}
                    />
                </div>
            </section>

            {/* Class Analysis */}
            {classData.analyses.length > 0 && (
                <section className="space-y-3">
                    <p className="font-medium">Analyses de classe</p>
                    <div className="flex flex-col gap-2">
                        {classData.analyses.map((analysis, index) => (
                            <div
                                key={index}
                                className={cn(
                                    "rounded-lg border px-4 py-3 text-sm",
                                    analysis.type === "success" &&
                                        "bg-emerald-50 border-emerald-200 text-emerald-700",
                                    analysis.type === "warning" &&
                                        "bg-amber-50 border-amber-200 text-amber-700"
                                )}
                            >
                                {analysis.message}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Actions */}
            <section className="space-y-3">
                <p className="font-medium">Actions rapides</p>
                <div className="flex flex-col gap-2">
                    <button
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                        onClick={() => console.log("Add student")}
                    >
                        <UserPlus className="size-4" />
                        Ajouter élève
                    </button>
                    <button
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                        onClick={() => console.log("Export list")}
                    >
                        <Download className="size-4" />
                        Exporter liste
                    </button>
                    <Link
                        to={ClassDetailRoute.to}
                        params={{ classId: classData.id }}
                        className="flex items-center gap-2 text-sm text-foreground hover:text-primary transition-colors"
                    >
                        <Eye className="size-4" />
                        Voir la fiche détaillée
                    </Link>
                </div>
            </section>
        </div>
    );
}
