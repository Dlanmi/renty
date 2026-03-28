"use client";

import { useCallback, useRef, useState } from "react";

interface TagInputProps {
  name: string;
  label: string;
  initialTags?: string[];
  suggestions?: readonly string[];
  placeholder?: string;
}

export default function TagInput({
  name,
  label,
  initialTags = [],
  suggestions = [],
  placeholder = "Escribe y presiona Enter",
}: TagInputProps) {
  const [tags, setTags] = useState<string[]>(initialTags);
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      // Case-insensitive dedup
      const exists = tags.some(
        (t) => t.toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return;
      setTags((prev) => [...prev, trimmed]);
      setInputValue("");
    },
    [tags]
  );

  const removeTag = useCallback((index: number) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    }
    if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  const filteredSuggestions = suggestions.filter(
    (s) =>
      !tags.some((t) => t.toLowerCase() === s.toLowerCase()) &&
      (inputValue
        ? s.toLowerCase().includes(inputValue.toLowerCase())
        : true)
  );

  const serialized = tags.join(", ");

  return (
    <div className="block space-y-1">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <input type="hidden" name={name} value={serialized} />

      <div
        className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 py-1.5 focus-within:border-accent"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={`${tag}-${index}`}
            className="inline-flex items-center gap-1 rounded-lg bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="ml-0.5 rounded-full p-0.5 text-accent/60 hover:bg-accent/20 hover:text-accent"
              aria-label={`Eliminar ${tag}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M5.28 4.22a.75.75 0 00-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 101.06 1.06L8 9.06l2.72 2.72a.75.75 0 101.06-1.06L9.06 8l2.72-2.72a.75.75 0 00-1.06-1.06L8 6.94 5.28 4.22z" />
              </svg>
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => {
            // Delay to allow click on suggestion
            setTimeout(() => setShowSuggestions(false), 150);
            if (inputValue.trim()) addTag(inputValue);
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="min-w-[120px] flex-1 border-0 bg-transparent px-1 py-0.5 text-sm text-stone-900 outline-none placeholder:text-stone-400"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1.5">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                addTag(suggestion);
                inputRef.current?.focus();
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-stone-200 bg-stone-50 px-2 py-0.5 text-xs text-stone-600 transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="h-3 w-3"
              >
                <path d="M8.75 3.75a.75.75 0 00-1.5 0v3.5h-3.5a.75.75 0 000 1.5h3.5v3.5a.75.75 0 001.5 0v-3.5h3.5a.75.75 0 000-1.5h-3.5v-3.5z" />
              </svg>
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted">
        Escribe y presiona Enter para agregar, o haz clic en las sugerencias.
      </p>
    </div>
  );
}
