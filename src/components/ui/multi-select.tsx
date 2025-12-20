"use client";

import * as React from "react";
import { Check, ChevronDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  error?: boolean;
  /** Label for "X selected" text, e.g., "projects" or "repositories" */
  selectionLabel?: string;
  /** Label when showing no items in dropdown, e.g., "No projects found" */
  emptyLabel?: string;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options...",
  disabled = false,
  loading = false,
  className,
  error = false,
  selectionLabel = "items",
  emptyLabel = "No items found",
  searchPlaceholder = "Search...",
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery(""); // Clear search when closing
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  React.useEffect(() => {
    if (isOpen && searchInputRef.current) {
      // Small delay to ensure the dropdown is rendered
      setTimeout(() => searchInputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Filter options based on search query
  const filteredOptions = React.useMemo(() => {
    if (!searchQuery.trim()) return options;
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  // Select all visible (filtered) options
  const selectAll = () => {
    const filteredValues = filteredOptions.map((o) => o.value);
    const newSelected = Array.from(new Set([...selected, ...filteredValues]));
    onChange(newSelected);
  };

  // Clear all visible (filtered) options, or all if no search
  const clearAll = () => {
    if (searchQuery.trim()) {
      const filteredValues = new Set(filteredOptions.map((o) => o.value));
      onChange(selected.filter((v) => !filteredValues.has(v)));
    } else {
      onChange([]);
    }
  };

  const selectedLabels = options
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md border",
          "bg-slate-900/50 text-white placeholder:text-slate-500",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900",
          error ? "border-destructive" : "border-slate-600",
          disabled || loading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer hover:border-slate-500"
        )}
      >
        <span className="truncate text-left">
          {loading ? (
            <span className="text-slate-500">Loading {selectionLabel}...</span>
          ) : selected.length === 0 ? (
            <span className="text-slate-500">{placeholder}</span>
          ) : selected.length === 1 ? (
            selectedLabels[0]
          ) : (
            <span>
              {selected.length} {selectionLabel} selected
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-slate-400 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Selected badges (when closed and has selections) */}
      {!isOpen && selected.length > 0 && selected.length <= 3 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map((label) => (
            <span
              key={label}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30"
            >
              {label}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  const option = options.find((o) => o.label === label);
                  if (option) toggleOption(option.value);
                }}
                className="hover:text-blue-100"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Dropdown menu */}
      {isOpen && !disabled && !loading && (
        <div className="absolute z-50 w-full mt-1 rounded-md border border-slate-600 bg-slate-800 shadow-lg">
          {/* Search input */}
          <div className="px-3 py-2 border-b border-slate-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className={cn(
                  "w-full pl-8 pr-3 py-1.5 text-sm rounded-md border",
                  "bg-slate-900/50 text-white placeholder:text-slate-500",
                  "border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                )}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          </div>

          {/* Select All / Clear All */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Select All
              {searchQuery.trim() ? ` (${filteredOptions.length})` : ""}
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              Clear{searchQuery.trim() ? " Visible" : " All"}
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                {searchQuery.trim()
                  ? `No matches for "${searchQuery}"`
                  : emptyLabel}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      "flex items-center gap-2 w-full px-3 py-2 text-sm text-left",
                      "hover:bg-slate-700/50 transition-colors",
                      isSelected && "bg-slate-700/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center justify-center w-4 h-4 rounded border",
                        isSelected
                          ? "bg-blue-500 border-blue-500"
                          : "border-slate-500"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-slate-500 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
