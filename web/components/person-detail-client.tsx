"use client";

import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type {
  Dictionaries,
  Person,
  RelationView,
} from "@/lib/types";
import { yearLabel } from "@/lib/utils";
import { PersonFormDialog } from "./person-form-dialog";
import { RelationDialog } from "./relation-dialog";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { Label, Select } from "./ui/field";

type DetailResponse = {
  person: Person;
  teachers: RelationView[];
  students: RelationView[];
};

type FilterState = {
  methodId: string;
  scopeId: string;
  certaintyId: string;
  placeId: string;
};

const emptyFilters: FilterState = {
  methodId: "",
  scopeId: "",
  certaintyId: "",
  placeId: "",
};

export function PersonDetailClient({ personId }: { personId: string }) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [dictionaries, setDictionaries] = useState<Dictionaries>({
    methods: [],
    scopes: [],
    certainties: [],
    places: [],
  });
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [personFormOpen, setPersonFormOpen] = useState(false);
  const [relationOpen, setRelationOpen] = useState(false);
  const [direction, setDirection] = useState<"teacher" | "student">("teacher");
  const [editingRelation, setEditingRelation] = useState<RelationView | null>(
    null,
  );
  const [deletingRelation, setDeletingRelation] =
    useState<RelationView | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value) params.set(key, value);
    }
    try {
      const [detailData, dictionaryData] = await Promise.all([
        api<DetailResponse>(`/api/persons/${personId}?${params}`),
        api<Dictionaries>("/api/dictionaries"),
      ]);
      setDetail(detailData);
      setDictionaries(dictionaryData);
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kişi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [personId, filters]);

  useEffect(() => {
    void load();
  }, [load]);

  async function removeRelation() {
    if (!deletingRelation) return;
    setDeleteBusy(true);
    try {
      await api(`/api/relations/${deletingRelation.id}`, { method: "DELETE" });
      setDeletingRelation(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "İlişki silinemedi.");
      setDeletingRelation(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  function openCreate(nextDirection: "teacher" | "student") {
    setDirection(nextDirection);
    setEditingRelation(null);
    setRelationOpen(true);
  }

  function openEdit(
    relation: RelationView,
    nextDirection: "teacher" | "student",
  ) {
    setDirection(nextDirection);
    setEditingRelation(relation);
    setRelationOpen(true);
  }

  if (!detail) {
    return (
      <div className="surface p-12 text-center text-sm text-stone-600">
        {loading ? "Kişi bilgileri yükleniyor…" : message || "Kişi bulunamadı."}
      </div>
    );
  }

  return (
    <>
      <Link
        href="/persons"
        className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-emerald-800"
      >
        <ArrowLeft className="size-4" />
        Kişilere dön
      </Link>

      {message ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      ) : null}

      <RelationSection
        title="Hocaları"
        emptyText="Bu kişinin kayıtlı hocası bulunmuyor."
        relations={detail.teachers}
        onAdd={() => openCreate("teacher")}
        onEdit={(relation) => openEdit(relation, "teacher")}
        onDelete={setDeletingRelation}
        filters={filters}
        setFilters={setFilters}
        dictionaries={dictionaries}
        loading={loading}
      />

      <section className="person-focus my-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-emerald-900 text-white">
              <UserRound className="size-6" />
            </div>
            <div>
              <p className="eyebrow">Kişi bilgileri</p>
              <h1 className="font-serif text-3xl font-semibold tracking-tight text-stone-950">
                {detail.person.name}
              </h1>
              <p className="mt-1 font-mono text-xs text-emerald-800">
                Dış kaynak #{detail.person.extSourceId}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={() => setPersonFormOpen(true)}>
            <Pencil className="size-4" />
            Kişiyi Düzenle
          </Button>
        </div>
        <div className="mt-6 grid gap-5 border-t border-stone-200 pt-5 md:grid-cols-3">
          <Info label="İsim açıklaması" value={detail.person.nameDescription} />
          <Info
            label="Doğum"
            value={yearLabel(
              detail.person.birthYearHijri,
              detail.person.birthYearGregorian,
            )}
          />
          <Info
            label="Vefat"
            value={yearLabel(
              detail.person.deathYearHijri,
              detail.person.deathYearGregorian,
            )}
          />
          <div className="md:col-span-3">
            <Info label="Detay notu" value={detail.person.detailNote} />
          </div>
        </div>
      </section>

      <RelationSection
        title="Talebeleri"
        emptyText="Bu kişinin kayıtlı talebesi bulunmuyor."
        relations={detail.students}
        onAdd={() => openCreate("student")}
        onEdit={(relation) => openEdit(relation, "student")}
        onDelete={setDeletingRelation}
        filters={filters}
        setFilters={setFilters}
        dictionaries={dictionaries}
        loading={loading}
      />

      <PersonFormDialog
        open={personFormOpen}
        onOpenChange={setPersonFormOpen}
        person={detail.person}
        onSaved={() => void load()}
      />
      <RelationDialog
        open={relationOpen}
        onOpenChange={setRelationOpen}
        currentPerson={detail.person}
        direction={direction}
        dictionaries={dictionaries}
        relation={editingRelation}
        onSaved={() => void load()}
      />
      <ConfirmDialog
        open={Boolean(deletingRelation)}
        onOpenChange={(open) => !open && setDeletingRelation(null)}
        title="İlişkiyi silmek istiyor musunuz?"
        description={
          deletingRelation
            ? `${detail.person.name} ile ${deletingRelation.counterpartName} arasındaki seçili ilişki silinecek. Kişi kayıtları korunacak.`
            : ""
        }
        onConfirm={() => void removeRelation()}
        busy={deleteBusy}
      />
    </>
  );
}

function RelationSection({
  title,
  emptyText,
  relations,
  onAdd,
  onEdit,
  onDelete,
  filters,
  setFilters,
  dictionaries,
  loading,
}: {
  title: string;
  emptyText: string;
  relations: RelationView[];
  onAdd: () => void;
  onEdit: (relation: RelationView) => void;
  onDelete: (relation: RelationView) => void;
  filters: FilterState;
  setFilters: (filters: FilterState) => void;
  dictionaries: Dictionaries;
  loading: boolean;
}) {
  const hasFilters = Object.values(filters).some(Boolean);
  return (
    <section className="surface overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-stone-200 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Aktarım ilişkileri</p>
          <h2 className="font-serif text-2xl font-semibold text-stone-950">
            {title}
          </h2>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <MiniFilter
            label="Yöntem"
            value={filters.methodId}
            items={dictionaries.methods}
            onChange={(value) => setFilters({ ...filters, methodId: value })}
          />
          <MiniFilter
            label="Kapsam"
            value={filters.scopeId}
            items={dictionaries.scopes}
            onChange={(value) => setFilters({ ...filters, scopeId: value })}
          />
          <MiniFilter
            label="Kesinlik"
            value={filters.certaintyId}
            items={dictionaries.certainties}
            onChange={(value) => setFilters({ ...filters, certaintyId: value })}
          />
          <MiniFilter
            label="Mekân"
            value={filters.placeId}
            items={dictionaries.places}
            onChange={(value) => setFilters({ ...filters, placeId: value })}
          />
          {hasFilters ? (
            <Button
              variant="ghost"
              size="icon"
              title="Filtreleri temizle"
              onClick={() => setFilters(emptyFilters)}
            >
              <X className="size-4" />
            </Button>
          ) : null}
          <Button size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            {title === "Hocaları" ? "Hoca Ekle" : "Talebe Ekle"}
          </Button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table min-w-[900px]">
          <thead>
            <tr>
              <th>Dış Kaynak ID</th>
              <th>{title === "Hocaları" ? "Hoca" : "Talebe"}</th>
              <th>Yöntem</th>
              <th>Kapsam</th>
              <th>Kesinlik</th>
              <th>Mekân</th>
              <th>Not</th>
              <th className="w-24 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {relations.map((relation) => (
              <tr key={relation.id}>
                <td className="font-mono text-xs text-emerald-900">
                  #{relation.counterpartExtSourceId}
                </td>
                <td>
                  <Link
                    className="font-semibold text-stone-950 hover:text-emerald-800 hover:underline"
                    href={`/persons/${relation.counterpartId}`}
                  >
                    {relation.counterpartName}
                  </Link>
                </td>
                <td>{relation.methodName}</td>
                <td>{relation.scopeName}</td>
                <td>
                  <span className="badge">{relation.certaintyName}</span>
                </td>
                <td>{relation.placeName || "—"}</td>
                <td
                  className="max-w-48 truncate text-stone-600"
                  title={relation.detailNote ?? ""}
                >
                  {relation.detailNote || "—"}
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(relation)}
                      aria-label="İlişkiyi düzenle"
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(relation)}
                      aria-label="İlişkiyi sil"
                    >
                      <Trash2 className="size-4 text-red-700" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loading ? (
        <div className="p-8 text-center text-sm text-stone-500">
          İlişkiler yükleniyor…
        </div>
      ) : !relations.length ? (
        <div className="p-10 text-center">
          <BookOpen className="mx-auto mb-3 size-7 text-stone-300" />
          <p className="text-sm font-medium text-stone-600">{emptyText}</p>
        </div>
      ) : null}
    </section>
  );
}

function MiniFilter({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: { id: number; name: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="w-32">
      <Label className="text-xs">{label}</Label>
      <Select
        className="h-9 text-xs"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Tümü</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </Select>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value?: string | null;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-6 text-stone-800">
        {value || "—"}
      </dd>
    </div>
  );
}

