"use client";

import { FormEvent, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Person } from "@/lib/types";
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

type PersonDraft = {
  extSourceId: string;
  name: string;
  nameDescription: string;
  birthYearHijri: string;
  birthYearGregorian: string;
  deathYearHijri: string;
  deathYearGregorian: string;
  detailNote: string;
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
};

function draftFromPerson(person?: Person | null): PersonDraft {
  if (!person) return emptyDraft;
  return {
    extSourceId: String(person.extSourceId),
    name: person.name,
    nameDescription: person.nameDescription ?? "",
    birthYearHijri: person.birthYearHijri?.toString() ?? "",
    birthYearGregorian: person.birthYearGregorian?.toString() ?? "",
    deathYearHijri: person.deathYearHijri?.toString() ?? "",
    deathYearGregorian: person.deathYearGregorian?.toString() ?? "",
    detailNote: person.detailNote ?? "",
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

  useEffect(() => {
    if (open) {
      setDraft(draftFromPerson(person));
      setError("");
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
      const payload = {
        extSourceId: Number(draft.extSourceId),
        name: draft.name,
        nameDescription: draft.nameDescription || null,
        birthYearHijri: optionalNumber(draft.birthYearHijri),
        birthYearGregorian: optionalNumber(draft.birthYearGregorian),
        deathYearHijri: optionalNumber(draft.deathYearHijri),
        deathYearGregorian: optionalNumber(draft.deathYearGregorian),
        detailNote: draft.detailNote || null,
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
        type="number"
        step="1"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
