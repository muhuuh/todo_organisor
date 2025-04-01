import React, { useState } from "react";
import { Tag } from "@/types/note";
import { Search, Calendar, X, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import NoteTag from "./NoteTag";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SearchFilters {
  term: string;
  tags: Tag[];
  dateFrom?: Date;
  dateTo?: Date;
}

interface SearchBarProps {
  allTags: Tag[];
  onSearch: (filters: SearchFilters) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ allTags, onSearch }) => {
  const [filters, setFilters] = useState<SearchFilters>({
    term: "",
    tags: [],
    dateFrom: undefined,
    dateTo: undefined,
  });

  const handleSearchTermChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({ ...filters, term: e.target.value });
  };

  const handleTagClick = (tag: Tag) => {
    const isSelected = filters.tags.some((t) => t.id === tag.id);
    let newTags: Tag[];

    if (isSelected) {
      newTags = filters.tags.filter((t) => t.id !== tag.id);
    } else {
      newTags = [...filters.tags, tag];
    }

    setFilters({ ...filters, tags: newTags });
  };

  const handleDateChange = (field: "dateFrom" | "dateTo", value: string) => {
    setFilters({
      ...filters,
      [field]: value ? new Date(value) : undefined,
    });
  };

  const clearFilters = () => {
    setFilters({
      term: "",
      tags: [],
      dateFrom: undefined,
      dateTo: undefined,
    });
    onSearch({
      term: "",
      tags: [],
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const applySearch = () => {
    onSearch(filters);
  };

  const hasFilters =
    filters.term ||
    filters.tags.length > 0 ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        <Input
          placeholder="Search notes..."
          value={filters.term}
          onChange={handleSearchTermChange}
          className="pl-10 pr-4"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              applySearch();
            }
          }}
        />
      </div>

      {/* Mobile Filter Accordion */}
      <div className="md:hidden">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="filters">
            <AccordionTrigger className="py-2 text-sm">
              <div className="flex items-center">
                <Filter className="h-4 w-4 mr-2" />
                Filter Options
                {filters.tags.length > 0 && (
                  <span className="ml-2 bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                    {filters.tags.length}
                  </span>
                )}
                {(filters.dateFrom || filters.dateTo) && (
                  <span className="ml-2 bg-primary/20 text-primary rounded-full px-2 py-0.5 text-xs">
                    Date
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                {/* Tags */}
                <div>
                  <div className="font-medium text-sm mb-2">Tags</div>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {filters.tags.map((tag) => (
                      <NoteTag
                        key={tag.id}
                        tag={tag}
                        onRemove={() => handleTagClick(tag)}
                      />
                    ))}
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1 border rounded-md p-2">
                    {allTags.length > 0 ? (
                      allTags.map((tag) => (
                        <div
                          key={tag.id}
                          className={`p-1.5 rounded-md cursor-pointer ${
                            filters.tags.some((t) => t.id === tag.id)
                              ? "bg-gray-100"
                              : ""
                          } hover:bg-gray-50`}
                          onClick={() => handleTagClick(tag)}
                        >
                          <NoteTag tag={tag} clickable />
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-muted-foreground p-1.5">
                        No tags available
                      </div>
                    )}
                  </div>
                </div>

                {/* Date Range */}
                <div>
                  <div className="font-medium text-sm mb-2">Date Range</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        From
                      </div>
                      <Input
                        type="date"
                        value={
                          filters.dateFrom
                            ? format(filters.dateFrom, "yyyy-MM-dd")
                            : ""
                        }
                        onChange={(e) =>
                          handleDateChange("dateFrom", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        To
                      </div>
                      <Input
                        type="date"
                        value={
                          filters.dateTo
                            ? format(filters.dateTo, "yyyy-MM-dd")
                            : ""
                        }
                        onChange={(e) =>
                          handleDateChange("dateTo", e.target.value)
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between pt-2">
                  {hasFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-9"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={applySearch}
                    className="h-9 ml-auto"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Desktop Filter UI */}
      <div className="hidden md:flex flex-wrap gap-2 items-center">
        <div className="text-sm text-gray-500">Filter by:</div>

        <div className="flex-1 flex flex-wrap gap-1.5">
          {filters.tags.map((tag) => (
            <NoteTag
              key={tag.id}
              tag={tag}
              onRemove={() => handleTagClick(tag)}
            />
          ))}

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                Tags
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
              <div className="max-h-60 overflow-y-auto space-y-1">
                {allTags.map((tag) => (
                  <div
                    key={tag.id}
                    className={`p-1.5 rounded-md cursor-pointer ${
                      filters.tags.some((t) => t.id === tag.id)
                        ? "bg-gray-100"
                        : ""
                    } hover:bg-gray-50`}
                    onClick={() => handleTagClick(tag)}
                  >
                    <NoteTag tag={tag} clickable />
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                <Calendar className="h-3.5 w-3.5 mr-1" />
                Date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <div>
                  <div className="text-sm font-medium mb-1">From</div>
                  <Input
                    type="date"
                    value={
                      filters.dateFrom
                        ? format(filters.dateFrom, "yyyy-MM-dd")
                        : ""
                    }
                    onChange={(e) =>
                      handleDateChange("dateFrom", e.target.value)
                    }
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <div className="text-sm font-medium mb-1">To</div>
                  <Input
                    type="date"
                    value={
                      filters.dateTo ? format(filters.dateTo, "yyyy-MM-dd") : ""
                    }
                    onChange={(e) => handleDateChange("dateTo", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex gap-2">
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-7 px-2"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          )}
          <Button size="sm" onClick={applySearch} className="h-7 px-3">
            Search
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
