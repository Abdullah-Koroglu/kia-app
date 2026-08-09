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
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card, CardContent, CardFooter } from "./ui/card";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

export function PersonsClient() {
  const [data, setData] = useState<PersonPageResult>({
    items: [],
    total: 0,
    page: 1,
    pageSize: 50,
    pageCount: 1,
    capabilities: { canCreate: false, writableRanges: [] },
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
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Kişiler
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.total.toLocaleString("tr-TR")} kişi kaydı
          </p>
        </div>
        {data.capabilities.canCreate ? <Button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Yeni Kişi
        </Button> : null}
      </div>

      <Card className="mb-5">
        <CardContent>
          <div className="grid gap-4 lg:grid-cols-[minmax(260px,1.5fr)_1fr_1fr_130px_130px_auto] lg:items-end">
            <div className="grid gap-2">
              <Label htmlFor="personSearch">Arama</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
                <Input
                  id="personSearch"
                  className="pl-9"
                  value={queryInput}
                  onChange={(event) => setQueryInput(event.target.value)}
                  placeholder="ID, isim veya isim açıklaması"
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Hocaya göre</Label>
              <PersonPicker
                value={teacher}
                onChange={(person) => {
                  setTeacher(person);
                  setPage(1);
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label>Talebeye göre</Label>
              <PersonPicker
                value={student}
                onChange={(person) => {
                  setStudent(person);
                  setPage(1);
                }}
              />
            </div>
            <div className="grid gap-2">
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
            <div className="grid gap-2">
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
        </CardContent>
      </Card>

      {message ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 py-0">
        <Table className="min-w-[920px]">
          <TableHeader>
            <TableRow>
              <TableHead>Dış Kaynak ID</TableHead>
              <TableHead>İsim</TableHead>
              <TableHead>İsim Açıklaması</TableHead>
              <TableHead>Doğum</TableHead>
              <TableHead>Vefat</TableHead>
              <TableHead>Memleket</TableHead>
              <TableHead>Kontrol</TableHead>
              <TableHead className="w-28 text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.items.map((person) => (
              <TableRow key={person.id}>
                <TableCell className="font-mono text-xs text-muted-foreground">
                  #{person.extSourceId}
                </TableCell>
                <TableCell>
                  <Link
                    className="font-medium hover:underline"
                    href={`/persons/${person.id}`}
                  >
                    {person.name}
                  </Link>
                </TableCell>
                <TableCell
                  className="max-w-sm truncate text-muted-foreground"
                  title={person.nameDescription ?? ""}
                >
                  {person.nameDescription || "—"}
                </TableCell>
                <TableCell>
                  {yearLabel(
                    person.birthYearHijri,
                    person.birthYearGregorian,
                    person.birthYearGregorianSecondary,
                  )}
                </TableCell>
                <TableCell>
                  {yearLabel(
                    person.deathYearHijri,
                    person.deathYearGregorian,
                    person.deathYearGregorianSecondary,
                  )}
                </TableCell>
                <TableCell>{person.homelandName || "—"}</TableCell>
                <TableCell>
                  <Badge variant={person.reviewStatus === "APPROVED" ? "default" : "outline"}>
                    {person.reviewStatus === "APPROVED" ? "Onaylı" : person.reviewStatus === "READY_FOR_REVIEW" ? "Kontrolde" : person.reviewStatus === "CHANGES_REQUESTED" ? "Düzeltme" : "Hazırlanıyor"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    {person.capabilities?.canEdit || person.capabilities?.canChangeExternalId ? <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${person.name} kişisini düzenle`}
                      onClick={() => {
                        setEditing(person);
                        setFormOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button> : null}
                    {person.capabilities?.canDelete ? <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`${person.name} kişisini sil`}
                      onClick={() => setDeleting(person)}
                    >
                      <Trash2 className="text-destructive" />
                    </Button> : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Kişiler yükleniyor…
          </div>
        ) : !data.items.length ? (
          <div className="p-12 text-center">
            <Users className="mx-auto mb-3 size-8 text-muted-foreground/50" />
            <p className="font-medium text-muted-foreground">
              {query || hasFilters
                ? "Aramanızla eşleşen kişi bulunamadı."
                : "Henüz kişi bulunmuyor."}
            </p>
          </div>
        ) : null}
        <CardFooter className="justify-between">
          <p className="text-sm text-muted-foreground">
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
        </CardFooter>
      </Card>

      <PersonFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        person={editing}
        canEditDetails={editing?.capabilities?.canEdit ?? true}
        canChangeExternalId={editing?.capabilities?.canChangeExternalId ?? false}
        writableRanges={data.capabilities.writableRanges}
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
