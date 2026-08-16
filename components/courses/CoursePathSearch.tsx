"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "@/components/icons";
import { searchCurriculum, type CurriculumSearchHit } from "@/lib/courses/curriculumSearch";
import { cn } from "@/lib/cn";

export default function CoursePathSearch() {
  const router = useRouter();
  const searchId = useId();
  const listboxId = `${searchId}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(
      typeof navigator !== "undefined" &&
        (navigator.platform.toUpperCase().includes("MAC") ||
          navigator.userAgent.includes("Mac")),
    );
  }, []);

  const results = useMemo(() => {
    return searchCurriculum(query, 6);
  }, [query]);

  const handleSelect = useCallback(
    (hit: CurriculumSearchHit) => {
      setIsOpen(false);
      setQuery("");
      setFocusedIndex(-1);
      router.push(hit.href);
    },
    [router],
  );

  // Click outside to close dropdown
  useEffect(() => {
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

  // Global shortcut (Cmd+K / Ctrl+K) to focus search
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) {
      if (e.key === "ArrowDown" && results.length > 0) {
        setIsOpen(true);
        setFocusedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetHit = focusedIndex >= 0 && focusedIndex < results.length
        ? results[focusedIndex]
        : results[0];
      if (targetHit) {
        handleSelect(targetHit);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  const handleClear = () => {
    setQuery("");
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="course-path__search" ref={containerRef}>
      <div className="course-path__search-box">
        <span className="course-path__search-icon" aria-hidden="true">
          <Search size={16} />
        </span>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          aria-expanded={isOpen && query.trim().length > 0}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-label="Buscar en el curso"
          placeholder="Buscar lección o tema..."
          value={query}
          onChange={(e) => {
            const nextQuery = e.target.value;
            setQuery(nextQuery);
            setIsOpen(nextQuery.trim().length > 0);
            setFocusedIndex(-1);
          }}
          onFocus={() => {
            if (query.trim().length > 0) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          className="course-path__search-input"
          autoComplete="off"
          spellCheck={false}
        />
        {query.trim().length > 0 ? (
          <button
            type="button"
            className="course-path__search-clear"
            onClick={handleClear}
            aria-label="Borrar búsqueda"
          >
            <X size={14} aria-hidden="true" />
          </button>
        ) : (
          <kbd className="course-path__search-kbd" aria-hidden="true">
            {isMac ? "⌘K" : "Ctrl+K"}
          </kbd>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div
          id={listboxId}
          role="listbox"
          className="course-path__search-dropdown"
          aria-label="Resultados de búsqueda"
        >
          {results.length > 0 ? (
            <ul className="course-path__search-list">
              {results.map((hit, index) => {
                const isSelected = index === focusedIndex;
                return (
                  <li
                    key={hit.id}
                    id={`${searchId}-option-${index}`}
                    role="option"
                    aria-selected={isSelected}
                    className="course-path__search-item-wrap"
                    onMouseEnter={() => setFocusedIndex(index)}
                    onClick={() => handleSelect(hit)}
                  >
                    <Link
                      href={hit.href}
                      className={cn(
                        "course-path__search-item",
                        isSelected && "course-path__search-item--focused",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSelect(hit);
                      }}
                      onMouseDown={(e) => {
                        // Prevent input blur before click triggers
                        e.preventDefault();
                      }}
                    >
                      <div className="course-path__search-item-main">
                        <span className="course-path__search-item-level">
                          {hit.levelLabel}
                        </span>
                        <span className="course-path__search-item-title">
                          {hit.title}
                        </span>
                      </div>
                      <span className="course-path__search-item-sub">
                        {hit.subtitle}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="course-path__search-empty">
              <p>No se encontraron resultados para &ldquo;{query}&rdquo;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
