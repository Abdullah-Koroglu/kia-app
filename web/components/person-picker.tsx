"use client";

import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Person, PersonPageResult } from "@/lib/types";
import { Button } from "./ui/button";
import { Input } from "./ui/field";

export function PersonPicker({
  value,
  onChange,
  excludeId,
  placeholder = "İsim veya dış kaynak ID ile ara",
}: {
  value: Person | null;
  onChange: (person: Person | null) => void;
  excludeId?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);
  const [open, setOpen] = useState(false);
  const requestNumber = useRef(0);

  useEffect(() => {
    if (value || query.trim().length < 1) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const current = ++requestNumber.current;
      try {
        const data = await api<PersonPageResult>(
          `/api/persons?compact=true&q=${encodeURIComponent(query)}`,
        );
        if (current === requestNumber.current) {
          setResults(data.items.filter((person) => person.id !== excludeId));
          setOpen(true);
        }
      } catch {
        setResults([]);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, value, excludeId]);

  if (value) {
    return (
      <div className="flex min-h-11 items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3">
        <div className="min-w-0">
          <span className="mr-2 font-mono text-xs text-emerald-800">
            #{value.extSourceId}
          </span>
          <span className="text-sm font-medium text-stone-900">{value.name}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          aria-label="Seçimi temizle"
        >
          <X className="size-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-stone-400" />
      <Input
        className="pl-9"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
      />
      {open && results.length ? (
        <div className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-stone-200 bg-white p-1 shadow-xl">
          {results.map((person) => (
            <button
              type="button"
              key={person.id}
              className="block w-full rounded-lg px-3 py-2 text-left hover:bg-stone-100"
              onClick={() => {
                onChange(person);
                setQuery("");
                setOpen(false);
              }}
            >
              <span className="mr-2 font-mono text-xs text-emerald-800">
                #{person.extSourceId}
              </span>
              <span className="text-sm font-medium text-stone-900">
                {person.name}
              </span>
              {person.nameDescription ? (
                <span className="mt-0.5 block truncate text-xs text-stone-500">
                  {person.nameDescription}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

