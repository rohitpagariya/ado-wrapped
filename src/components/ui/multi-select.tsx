"use client";

import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
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
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const selectAll = () => {
    onChange(options.map((o) => o.value));
  };

  const clearAll = () => {
    onChange([]);
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
            <span className="text-slate-500">Loading projects...</span>
          ) : selected.length === 0 ? (
            <span className="text-slate-500">{placeholder}</span>
          ) : selected.length === 1 ? (
            selectedLabels[0]
          ) : (
            <span>{selected.length} projects selected</span>
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
          {/* Select All / Clear All */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-700">
            <button
              type="button"
              onClick={selectAll}
              className="text-xs text-blue-400 hover:text-blue-300"
            >
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="text-xs text-slate-400 hover:text-slate-300"
            >
              Clear All
            </button>
          </div>

          {/* Options list */}
          <div className="max-h-60 overflow-auto py-1">
            {options.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500">
                No projects found
              </div>
            ) : (
              options.map((option) => {
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
