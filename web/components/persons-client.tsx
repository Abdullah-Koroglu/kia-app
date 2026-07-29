"use client";

import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Person, PersonPageResult } from "@/lib/types";
import { yearLabel } from "@/lib/utils";
import { PersonFormDialog } from "./person-form-dialog";
import { PersonPicker } from "./person-picker";
import { Button } from "./ui/button";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { Input, Label } from "./ui/field";

export function PersonsClient() {
  const [data, setData] = useState<PersonPageResult>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 50,
    pageCount: 1,
  });
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [teacher, setTeacher] = useState<Person | null>(null);
  const [student, setStudent] = useState<Person | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [deathYear, setDeathYear] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Person | null>(null);
  const [deleting, setDeleting] = useState<Person | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");
    const params = new URLSearchParams({
      page: String(page),
    });
    if (query) params.set("q", query);
    if (teacher) params.set("teacherId", teacher.id);
    if (student) params.set("studentId", student.id);
    if (birthYear) params.set("birthYear", birthYear);
    if (deathYear) params.set("deathYear", deathYear);

    try {
      setData(await api<PersonPageResult>(`/api/persons?${params}`));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Liste yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [page, query, teacher, student, birthYear, deathYear]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setQuery(queryInput.trim());
    }, 260);
    return () => clearTimeout(timer);
  }, [queryInput]);

  function clearFilters() {
    setTeacher(null);
    setStudent(null);
    setBirthYear("");
    setDeathYear("");
    setPage(1);
  }

  async function removePerson() {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await api(`/api/persons/${deleting.id}`, { method: "DELETE" });
      setDeleting(null);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kişi silinemedi.");
      setDeleting(null);
    } finally {
      setDeleteBusy(false);
    }
  }

  const hasFilters = teacher || student || birthYear || deathYear;

  return (
    <>
      <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">Araştırma kayıtları</p>
          <h1 className="page-title">Kişiler</h1>
          <p className="mt-2 text-sm text-stone-600">
            {data.total.toLocaleString("tr-TR")} kişi kaydı
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Kişi
        </Button>
      </div>

      <section className="surface mb-5 p-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.5fr)_1fr_1fr_130px_130px_auto] lg:items-end">
          <div>
            <Label htmlFor="personSearch">Arama</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-stone-400" />
              <Input
                id="personSearch"
                className="pl-9"
                value={queryInput}
                onChange={(event) => setQueryInput(event.target.value)}
                placeholder="ID, isim veya isim açıklaması"
              />
            </div>
          </div>
          <div>
            <Label>Hocaya göre</Label>
            <PersonPicker
              value={teacher}
              onChange={(person) => {
                setTeacher(person);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Label>Talebeye göre</Label>
            <PersonPicker
              value={student}
              onChange={(person) => {
                setStudent(person);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Label htmlFor="birthYear">Doğum yılı</Label>
            <Input
              id="birthYear"
              type="number"
              value={birthYear}
              onChange={(event) => {
                setBirthYear(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <div>
            <Label htmlFor="deathYear">Vefat yılı</Label>
            <Input
              id="deathYear"
              type="number"
              value={deathYear}
              onChange={(event) => {
                setDeathYear(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={!hasFilters}
            title="Filtreleri temizle"
          >
            <X className="size-4" />
            Temizle
          </Button>
        </div>
      </section>

      {message ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {message}
        </div>
      ) : null}

      <section className="surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table min-w-[920px]">
            <thead>
              <tr>
                <th>Dış Kaynak ID</th>
                <th>İsim</th>
                <th>İsim Açıklaması</th>
                <th>Doğum</th>
                <th>Vefat</th>
                <th className="w-28 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((person) => (
                <tr key={person.id}>
                  <td className="font-mono text-xs text-emerald-900">
                    #{person.extSourceId}
                  </td>
                  <td>
                    <Link
                      className="font-semibold text-stone-950 hover:text-emerald-800 hover:underline"
                      href={`/persons/${person.id}`}
                    >
                      {person.name}
                    </Link>
                  </td>
                  <td
                    className="max-w-sm truncate text-stone-600"
                    title={person.nameDescription ?? ""}
                  >
                    {person.nameDescription || "—"}
                  </td>
                  <td>{yearLabel(person.birthYearHijri, person.birthYearGregorian)}</td>
                  <td>{yearLabel(person.deathYearHijri, person.deathYearGregorian)}</td>
                  <td>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${person.name} kişisini düzenle`}
                        onClick={() => {
                          setEditing(person);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`${person.name} kişisini sil`}
                        onClick={() => setDeleting(person)}
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
          <div className="p-12 text-center text-sm text-stone-500">
            Kişiler yükleniyor…
          </div>
        ) : !data.items.length ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 size-8 text-stone-300" />
            <p className="font-medium text-stone-700">
              {query || hasFilters
                ? "Aramanızla eşleşen kişi bulunamadı."
                : "Henüz kişi bulunmuyor."}
            </p>
          </div>
        ) : null}
        <div className="flex items-center justify-between border-t border-stone-200 px-4 py-3">
          <p className="text-sm text-stone-500">
            Sayfa {data.page} / {data.pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((current) => current - 1)}
            >
              <ChevronLeft className="size-4" />
              Önceki
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pageCount || loading}
              onClick={() => setPage((current) => current + 1)}
            >
              Sonraki
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <PersonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        person={editing}
        onSaved={() => void load()}
      />
      <ConfirmDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Kişiyi silmek istiyor musunuz?"
        description={
          deleting
            ? `${deleting.name} kaydı kalıcı olarak silinecek. İlişkisi bulunan kişiler silinemez.`
            : ""
        }
        onConfirm={() => void removePerson()}
        busy={deleteBusy}
      />
    </>
  );
}

