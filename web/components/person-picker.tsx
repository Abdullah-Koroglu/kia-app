"use client";

import { ChevronsUpDown, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/client";
import type { Person, PersonPageResult } from "@/lib/types";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

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
        }
      } catch {
        setResults([]);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [query, value, excludeId]);

  if (value) {
    return (
      <div className="flex h-8 items-center gap-2 rounded-lg border bg-background px-2.5 text-sm">
        <span className="min-w-0 flex-1 truncate">
          <span className="mr-2 font-mono text-xs text-muted-foreground">
            #{value.extSourceId}
          </span>
          {value.name}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          aria-label="Seçimi temizle"
        >
          <X />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal text-muted-foreground"
        >
          <span className="flex min-w-0 items-center gap-2 truncate">
            <Search />
            {placeholder}
          </span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={query}
            onValueChange={setQuery}
            placeholder={placeholder}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim()
                ? "Eşleşen kişi bulunamadı."
                : "Aramak için yazmaya başlayın."}
            </CommandEmpty>
            {results.map((person) => (
              <CommandItem
                key={person.id}
                value={person.id}
                onSelect={() => {
                  onChange(person);
                  setQuery("");
                  setOpen(false);
                }}
              >
                <div className="min-w-0">
                  <div className="truncate">
                    <span className="mr-2 font-mono text-xs text-muted-foreground">
                      #{person.extSourceId}
                    </span>
                    <span className="font-medium">{person.name}</span>
                  </div>
                  {person.nameDescription ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {person.nameDescription}
                    </p>
                  ) : null}
                </div>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
