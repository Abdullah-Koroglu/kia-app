"use client";

import { FormEvent, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { api } from "@/lib/client";
import type { Dictionaries, Person, RelationView } from "@/lib/types";
import { PersonFormDialog } from "./person-form-dialog";
import { PersonPicker } from "./person-picker";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";

export function RelationDialog({
  open,
  onOpenChange,
  currentPerson,
  direction,
  dictionaries,
  relation,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPerson: Person;
  direction: "teacher" | "student";
  dictionaries: Dictionaries;
  relation?: RelationView | null;
  onSaved: () => void;
}) {
  const [counterpart, setCounterpart] = useState<Person | null>(null);
  const [methodId, setMethodId] = useState("");
  const [scopeId, setScopeId] = useState("");
  const [certaintyId, setCertaintyId] = useState("");
  const [placeId, setPlaceId] = useState("");
  const [detailNote, setDetailNote] = useState("");
  const [quickPersonOpen, setQuickPersonOpen] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCounterpart(
      relation
        ? {
            id: relation.counterpartId,
            extSourceId: relation.counterpartExtSourceId,
            name: relation.counterpartName,
            nameDescription: relation.counterpartDescription,
            birthYearHijri: null,
            birthYearGregorian: null,
            birthYearGregorianSecondary: null,
            deathYearHijri: null,
            deathYearGregorian: null,
            deathYearGregorianSecondary: null,
            detailNote: null,
          }
        : null,
    );
    setMethodId(relation?.methodId.toString() ?? "");
    setScopeId(relation?.scopeId.toString() ?? "");
    setCertaintyId(relation?.certaintyId.toString() ?? "");
    setPlaceId(relation?.placeId?.toString() ?? "");
    setDetailNote(relation?.detailNote ?? "");
    setError("");
  }, [open, relation]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!counterpart) {
      setError(`${direction === "teacher" ? "Hoca" : "Talebe"} seçin.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const payload = {
        teacherId: direction === "teacher" ? counterpart.id : currentPerson.id,
        studentId: direction === "student" ? counterpart.id : currentPerson.id,
        methodId: Number(methodId),
        scopeId: Number(scopeId),
        certaintyId: Number(certaintyId),
        placeId: placeId ? Number(placeId) : null,
        detailNote: detailNote || null,
      };
      await api(relation ? `/api/relations/${relation.id}` : "/api/relations", {
        method: relation ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      onSaved();
      onOpenChange(false);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "İlişki kaydedilemedi.",
      );
    } finally {
      setBusy(false);
    }
  }

  const roleLabel = direction === "teacher" ? "Hoca" : "Talebe";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              relation ? `${roleLabel} ilişkisini düzenle` : `${roleLabel} ekle`
            </DialogTitle>
            <DialogDescription>
              {currentPerson.name} için aktarım ilişkisini kaydedin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit}>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label>{roleLabel}</Label>
                <PersonPicker
                  value={counterpart}
                  onChange={setCounterpart}
                  excludeId={currentPerson.id}
                  placeholder={`${roleLabel} olacak âlimi ara`}
                />
                {!relation ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => setQuickPersonOpen(true)}
                  >
                    <Plus className="size-4" />
                    Aradığınız âlim yoksa yeni âlim oluşturun
                  </Button>
                ) : null}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DictionaryField
                  label="Yöntem"
                  value={methodId}
                  onChange={setMethodId}
                  items={dictionaries.methods}
                  required
                />
                <DictionaryField
                  label="Kapsam"
                  value={scopeId}
                  onChange={setScopeId}
                  items={dictionaries.scopes}
                  required
                />
                <DictionaryField
                  label="Kesinlik"
                  value={certaintyId}
                  onChange={setCertaintyId}
                  items={dictionaries.certainties}
                  required
                />
                <DictionaryField
                  label="Mekân"
                  value={placeId}
                  onChange={setPlaceId}
                  items={dictionaries.places}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="relationNote">Detay notu</Label>
                <Textarea
                  id="relationNote"
                  value={detailNote}
                  onChange={(event) => setDetailNote(event.target.value)}
                />
              </div>
            </div>
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
      <PersonFormDialog
        open={quickPersonOpen}
        onOpenChange={setQuickPersonOpen}
        onSaved={(person) => {
          setCounterpart(person);
          setQuickPersonOpen(false);
        }}
      />
    </>
  );
}

function DictionaryField({
  label,
  value,
  onChange,
  items,
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: { id: number; name: string }[];
  required?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Select
        value={value || (required ? undefined : "none")}
        onValueChange={(next) => onChange(next === "none" ? "" : next)}
        required={required}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={required ? "Seçin" : "Bilinmiyor"} />
        </SelectTrigger>
        <SelectContent>
          {!required ? <SelectItem value="none">Bilinmiyor</SelectItem> : null}
          {items.map((item) => (
            <SelectItem value={String(item.id)} key={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
