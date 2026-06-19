"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
  searchText?: string;
  disabled?: boolean;
};

export type SearchableSelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SearchableSelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
};

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "اختر...",
  searchPlaceholder = "ابحث...",
  emptyMessage = "لا توجد نتائج",
  className,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listboxId = useId();
  const optionIdPrefix = `${listboxId}-option`;

  useEffect(() => {
    if (!open) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 0);

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!rootRef.current?.contains(document.activeElement)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }

      if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") {
        return;
      }

      event.preventDefault();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedOption = options.find((option) => option.value === value);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredOptions = normalizedQuery
    ? options.filter((option) =>
        `${option.label} ${option.searchText ?? ""}`.toLocaleLowerCase().includes(normalizedQuery),
      )
    : options;

  const handleSelect = useCallback((nextValue: string) => {
    onChange(nextValue);
    setOpen(false);
    setQuery("");
    setFocusedIndex(-1);
  }, [onChange]);

  useEffect(() => {
    setFocusedIndex(-1);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const enabledOptions = filteredOptions.filter((option) => !option.disabled);

    function findNextIndex(startIndex: number, direction: 1 | -1) {
      let index = startIndex;

      while (index >= 0 && index < filteredOptions.length) {
        if (!filteredOptions[index]?.disabled) {
          return index;
        }

        index += direction;
      }

      return -1;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!rootRef.current?.contains(document.activeElement)) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (!enabledOptions.length) {
          return;
        }

        setFocusedIndex((current) =>
          current < 0 ? findNextIndex(0, 1) : findNextIndex(current + 1, 1),
        );
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (!enabledOptions.length) {
          return;
        }

        setFocusedIndex((current) =>
          current < 0 ? findNextIndex(filteredOptions.length - 1, -1) : findNextIndex(current - 1, -1),
        );
      }

      if (event.key === "Enter" && focusedIndex >= 0) {
        const focusedOption = filteredOptions[focusedIndex];

        if (!focusedOption?.disabled) {
          event.preventDefault();
          handleSelect(focusedOption.value);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [filteredOptions, focusedIndex, handleSelect, open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <Button
        type="button"
        variant="outline"
        className="w-full justify-between px-3 font-normal"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={focusedIndex >= 0 ? `${optionIdPrefix}-${focusedIndex}` : undefined}
        onClick={() => {
          setOpen((current) => !current);
          setQuery("");
          setFocusedIndex(-1);
        }}
      >
        <span className="truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronsUpDown className="size-4 opacity-50" />
      </Button>

      {open ? (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-background p-2 shadow-md">
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className={cn(
              "mb-2 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none",
              "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            )}
          />

          <div id={listboxId} role="listbox" className="max-h-60 overflow-y-auto">
            {filteredOptions.length ? (
              filteredOptions.map((option, index) => (
                <button
                  id={`${optionIdPrefix}-${index}`}
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  disabled={option.disabled}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-start",
                    focusedIndex === index && "bg-accent",
                    option.disabled ? "cursor-not-allowed opacity-50" : "hover:bg-accent",
                  )}
                  onClick={() => handleSelect(option.value)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <span className="truncate">{option.label}</span>
                  {option.value === value ? <Check className="size-4" /> : null}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
