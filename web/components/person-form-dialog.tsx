"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Person } from "@/lib/types";
import {
  formatGregorianYearInput,
  parseGregorianYearInput,
} from "@/lib/years";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

type PersonDraft = {
  extSourceId: string;
  name: string;
  nameDescription: string;
  birthYearHijri: string;
  birthYearGregorian: string;
  deathYearHijri: string;
  deathYearGregorian: string;
  detailNote: string;
  homelandId: string;
};

const emptyDraft: PersonDraft = {
  extSourceId: "",
  name: "",
  nameDescription: "",
  birthYearHijri: "",
  birthYearGregorian: "",
  deathYearHijri: "",
  deathYearGregorian: "",
  detailNote: "",
  homelandId: "",
};

function draftFromPerson(person?: Person | null): PersonDraft {
  if (!person) return emptyDraft;
  return {
    extSourceId: String(person.extSourceId),
    name: person.name,
    nameDescription: person.nameDescription ?? "",
    birthYearHijri: person.birthYearHijri?.toString() ?? "",
    birthYearGregorian: formatGregorianYearInput(
      person.birthYearGregorian,
      person.birthYearGregorianSecondary,
    ),
    deathYearHijri: person.deathYearHijri?.toString() ?? "",
    deathYearGregorian: formatGregorianYearInput(
      person.deathYearGregorian,
      person.deathYearGregorianSecondary,
    ),
    detailNote: person.detailNote ?? "",
    homelandId: person.homelandId ? String(person.homelandId) : "",
  };
}

function optionalNumber(value: string) {
  return value.trim() ? Number(value) : null;
}

export function PersonFormDialog({
  open,
  onOpenChange,
  person,
  canEditDetails = true,
  canChangeExternalId = false,
  writableRanges = [],
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  person?: Person | null;
  canEditDetails?: boolean;
  canChangeExternalId?: boolean;
  writableRanges?: { startExtSourceId: number; endExtSourceId: number }[];
  onSaved: (person: Person) => void;
}) {
  const [draft, setDraft] = useState<PersonDraft>(emptyDraft);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [places, setPlaces] = useState<{ id: number; name: string }[]>([]);
  const [newHomeland, setNewHomeland] = useState("");

  useEffect(() => {
    if (open) {
      setDraft(draftFromPerson(person));
      setError("");
      setNewHomeland("");
      void api<{ items: { id: number; name: string }[] }>("/api/places")
        .then((data) => setPlaces(data.items))
        .catch(() => setPlaces([]));
    }
  }, [open, person]);

  function set<K extends keyof PersonDraft>(key: K, value: PersonDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const birthGregorian = parseGregorianYearInput(draft.birthYearGregorian);
      const deathGregorian = parseGregorianYearInput(draft.deathYearGregorian);
      const payload = {
        extSourceId: Number(draft.extSourceId),
        name: draft.name,
        nameDescription: draft.nameDescription || null,
        birthYearHijri: optionalNumber(draft.birthYearHijri),
        birthYearGregorian: birthGregorian.primary,
        birthYearGregorianSecondary: birthGregorian.secondary,
        deathYearHijri: optionalNumber(draft.deathYearHijri),
        deathYearGregorian: deathGregorian.primary,
        deathYearGregorianSecondary: deathGregorian.secondary,
        detailNote: draft.detailNote || null,
        homelandId: draft.homelandId ? Number(draft.homelandId) : null,
      };
      const saved = await api<Person>(
        person ? `/api/persons/${person.id}` : "/api/persons",
        {
          method: person ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      onSaved(saved);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kayıt yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  async function createHomeland() {
    if (!newHomeland.trim()) return;
    setBusy(true);
    setError("");
    try {
      const created = await api<{ id: number; name: string }>("/api/places", {
        method: "POST",
        body: JSON.stringify({ name: newHomeland }),
      });
      setPlaces((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name, "tr")));
      set("homelandId", String(created.id));
      setNewHomeland("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Memleket oluşturulamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{person ? "Kişiyi düzenle" : "Yeni kişi"}</DialogTitle>
          <DialogDescription>
            {person && !canEditDetails
              ? "Yönetici olarak yalnızca dış kaynak ID değerini değiştirebilirsiniz."
              : "Araştırma kaynağındaki temel kişi bilgilerini girin."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="extSourceId">Dış kaynak ID</Label>
              <Input
                id="extSourceId"
                type="number"
                step="1"
                required
                disabled={Boolean(person) && !canChangeExternalId}
                value={draft.extSourceId}
                onChange={(event) => set("extSourceId", event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Kısa isim</Label>
              <Input
                id="name"
                required
                disabled={Boolean(person) && !canEditDetails}
                maxLength={180}
                value={draft.name}
                onChange={(event) => set("name", event.target.value)}
              />
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="nameDescription">İsim açıklaması</Label>
              <Input
                id="nameDescription"
                disabled={Boolean(person) && !canEditDetails}
                value={draft.nameDescription}
                onChange={(event) => set("nameDescription", event.target.value)}
                placeholder="Tam isim, künye, nisbe veya lakap"
              />
            </div>
            <YearField
              id="birthYearHijri"
              label="Hicrî doğum yılı"
              value={draft.birthYearHijri}
              onChange={(value) => set("birthYearHijri", value)}
              disabled={Boolean(person) && !canEditDetails}
            />
            <YearField
              id="birthYearGregorian"
              label="Miladî doğum yılı"
              value={draft.birthYearGregorian}
              onChange={(value) => set("birthYearGregorian", value)}
              disabled={Boolean(person) && !canEditDetails}
            />
            <YearField
              id="deathYearHijri"
              label="Hicrî vefat yılı"
              value={draft.deathYearHijri}
              onChange={(value) => set("deathYearHijri", value)}
              disabled={Boolean(person) && !canEditDetails}
            />
            <YearField
              id="deathYearGregorian"
              label="Miladî vefat yılı"
              value={draft.deathYearGregorian}
              onChange={(value) => set("deathYearGregorian", value)}
              disabled={Boolean(person) && !canEditDetails}
            />
            <p className="-mt-2 text-xs text-muted-foreground sm:col-span-2">
              Hicrî alanlara tek yıl; Miladî alanlara 856 veya 856-857 biçiminde yıl girin.
            </p>
            <div className="grid gap-2 sm:col-span-2">
              <Label>Memleket</Label>
              <Select
                value={draft.homelandId || "none"}
                onValueChange={(value) => set("homelandId", value === "none" ? "" : value)}
                disabled={Boolean(person) && !canEditDetails}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Bilinmiyor" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Bilinmiyor</SelectItem>
                  {places.map((place) => <SelectItem value={String(place.id)} key={place.id}>{place.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {!person || canEditDetails ? (
                <div className="flex gap-2">
                  <Input value={newHomeland} onChange={(event) => setNewHomeland(event.target.value)} placeholder="Listede yoksa yeni memleket" />
                  <Button type="button" variant="outline" disabled={busy || !newHomeland.trim()} onClick={() => void createHomeland()}>Ekle</Button>
                </div>
              ) : null}
            </div>
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="detailNote">Detay notu</Label>
              <Textarea
                id="detailNote"
                disabled={Boolean(person) && !canEditDetails}
                value={draft.detailNote}
                onChange={(event) => set("detailNote", event.target.value)}
              />
            </div>
          </div>
          {!person && writableRanges.length ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Yazılabilir ID aralıkları: {writableRanges.map((range) => `${range.startExtSourceId}–${range.endExtSourceId}`).join(", ")}
            </p>
          ) : null}
          {error ? (
            <p className="mt-4 text-sm text-destructive">{error}</p>
          ) : null}
          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              İptal
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? "Kaydediliyor…" : "Kaydet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function YearField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={id.includes("Gregorian") ? "text" : "number"}
        inputMode={id.includes("Gregorian") ? "text" : "numeric"}
        step={id.includes("Gregorian") ? undefined : "1"}
        maxLength={id.includes("Gregorian") ? 21 : undefined}
        placeholder={id.includes("Gregorian") ? "Örn. 856-857" : "Örn. 243"}
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
