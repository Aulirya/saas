import { Search, ArrowUp, ArrowDown, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface FilterOption {
    value: string;
    label: string;
}

export interface SortOption {
    value: string;
    label: string;
}

export interface FilterField {
    id: string;
    label: string;
    value: string;
    options: FilterOption[];
    onValueChange: (value: string) => void;
    placeholder?: string;
    isLoading?: boolean;
    clearValue?: string; // Value to set when clearing (defaults to "all")
}

interface FilterBarProps {
    searchId: string;
    searchPlaceholder: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filters: FilterField[];
    sortBy: string;
    sortOptions: SortOption[];
    onSortByChange: (value: string) => void;
    sortOrder: "asc" | "desc";
    onSortOrderChange: (order: "asc" | "desc") => void;
}

export function FilterBar({
    searchId,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    filters,
    sortBy,
    sortOptions,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
}: FilterBarProps) {
    return (
        <section className="mb-6">
            <div className="flex flex-row gap-6 flex-wrap">
                {/* Search Input */}
                <div className="space-y-2 flex-1 min-w-[200px]">
                    <Label htmlFor={searchId}>Rechercher</Label>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-muted-foreground" />
                        <Input
                            id={searchId}
                            type="text"
                            placeholder={searchPlaceholder}
                            value={searchValue}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className={searchValue ? "pl-9 pr-9" : "pl-9"}
                        />
                        {searchValue && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    onSearchChange("");
                                }}
                                title="Effacer la recherche"
                                type="button"
                            >
                                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filter Dropdowns */}
                {filters.map((filter) => {
                    const clearValue = filter.clearValue ?? "all";
                    const isFiltered = filter.value !== clearValue;

                    return (
                        <div key={filter.id} className="space-y-2">
                            <Label htmlFor={filter.id}>{filter.label}</Label>
                            <div className="relative group">
                                <Select
                                    value={filter.value}
                                    onValueChange={filter.onValueChange}
                                >
                                    <SelectTrigger id={filter.id}>
                                        <SelectValue
                                            placeholder={
                                                filter.placeholder || "Tous"
                                            }
                                        />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {filter.isLoading ? (
                                            <SelectItem
                                                value="loading"
                                                disabled
                                            >
                                                Chargement...
                                            </SelectItem>
                                        ) : (
                                            filter.options.map((option) => (
                                                <SelectItem
                                                    key={option.value}
                                                    value={option.value}
                                                >
                                                    {option.label}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {isFiltered && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-9 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            e.preventDefault();
                                            filter.onValueChange(clearValue);
                                        }}
                                        title="Effacer le filtre"
                                        type="button"
                                    >
                                        <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* Sort Controls */}
                <div className="space-y-2">
                    <Label htmlFor={`${searchId}-sort-by`}>Trier par</Label>
                    <div className="flex gap-2">
                        <Select value={sortBy} onValueChange={onSortByChange}>
                            <SelectTrigger
                                id={`${searchId}-sort-by`}
                                className="w-[140px]"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {sortOptions.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                                onSortOrderChange(
                                    sortOrder === "asc" ? "desc" : "asc"
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
    );
}
