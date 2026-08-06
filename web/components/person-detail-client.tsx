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
import type { Dictionaries, Person, RelationView } from "@/lib/types";
import { yearLabel } from "@/lib/utils";
import { PersonFormDialog } from "./person-form-dialog";
import { RelationDialog } from "./relation-dialog";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

type DetailResponse = {
  person: Person;
  teachers: RelationView[];
  students: RelationView[];
  capabilities: {
    canEdit: boolean;
    canDelete: boolean;
    canChangeExternalId: boolean;
    canManageRelations: boolean;
  };
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
  const [deletingRelation, setDeletingRelation] = useState<RelationView | null>(
    null,
  );
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
      <Card>
        <CardContent className="p-12 text-center text-sm text-muted-foreground">
          {loading
            ? "Kişi bilgileri yükleniyor…"
            : message || "Kişi bulunamadı."}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button asChild variant="ghost" className="mb-5">
        <Link href="/persons">
          <ArrowLeft />
          Kişilere dön
        </Link>
      </Button>

      {message ? (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
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
        canManage={detail.capabilities.canManageRelations}
      />

      <Card className="my-6">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
              <UserRound className="size-5" />
            </div>
            <div className="grid gap-1">
              <CardTitle className="text-lg">{detail.person.name}</CardTitle>
              <CardDescription className="font-mono text-xs">
                Dış kaynak #{detail.person.extSourceId}
              </CardDescription>
            </div>
          </div>
          {detail.capabilities.canEdit || detail.capabilities.canChangeExternalId ? <CardAction>
            <Button variant="outline" onClick={() => setPersonFormOpen(true)}>
              <Pencil />
              Kişiyi Düzenle
            </Button>
          </CardAction> : null}
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-5 md:grid-cols-3">
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
        </CardContent>
      </Card>

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
        canManage={detail.capabilities.canManageRelations}
      />

      <PersonFormDialog
        open={personFormOpen}
        onOpenChange={setPersonFormOpen}
        person={detail.person}
        canEditDetails={detail.capabilities.canEdit}
        canChangeExternalId={detail.capabilities.canChangeExternalId}
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
  canManage,
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
  canManage: boolean;
}) {
  const hasFilters = Object.values(filters).some(Boolean);
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-4 border-b py-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Aktarım ilişkileri</CardDescription>
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
          {canManage ? <Button size="sm" onClick={onAdd}>
            <Plus className="size-4" />
            {title === "Hocaları" ? "Hoca Ekle" : "Talebe Ekle"}
          </Button> : null}
        </div>
      </CardHeader>
      <Table className="min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead>Dış Kaynak ID</TableHead>
            <TableHead>{title === "Hocaları" ? "Hoca" : "Talebe"}</TableHead>
            <TableHead>Yöntem</TableHead>
            <TableHead>Kapsam</TableHead>
            <TableHead>Kesinlik</TableHead>
            <TableHead>Mekân</TableHead>
            <TableHead>Not</TableHead>
            <TableHead className="w-24 text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relations.map((relation) => (
            <TableRow key={relation.id}>
              <TableCell className="font-mono text-xs text-muted-foreground">
                #{relation.counterpartExtSourceId}
              </TableCell>
              <TableCell>
                <Link
                  className="font-medium hover:underline"
                  href={`/persons/${relation.counterpartId}`}
                >
                  {relation.counterpartName}
                </Link>
              </TableCell>
              <TableCell>{relation.methodName}</TableCell>
              <TableCell>{relation.scopeName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{relation.certaintyName}</Badge>
              </TableCell>
              <TableCell>{relation.placeName || "—"}</TableCell>
              <TableCell
                className="max-w-48 truncate text-muted-foreground"
                title={relation.detailNote ?? ""}
              >
                {relation.detailNote || "—"}
              </TableCell>
              <TableCell>
                {canManage ? <div className="flex justify-end gap-1">
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
                    <Trash2 className="text-destructive" />
                  </Button>
                </div> : null}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {loading ? (
        <div className="p-8 text-center text-sm text-muted-foreground">
          İlişkiler yükleniyor…
        </div>
      ) : !relations.length ? (
        <div className="p-10 text-center">
          <BookOpen className="mx-auto mb-3 size-7 text-muted-foreground/50" />
          <p className="text-sm font-medium text-muted-foreground">
            {emptyText}
          </p>
        </div>
      ) : null}
    </Card>
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
    <div className="grid w-32 gap-2">
      <Label className="text-xs">{label}</Label>
      <Select
        value={value || "all"}
        onValueChange={(next) => onChange(next === "all" ? "" : next)}
      >
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="Tümü" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tümü</SelectItem>
          {items.map((item) => (
            <SelectItem key={item.id} value={String(item.id)}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap text-sm leading-6">
        {value || "—"}
      </dd>
    </div>
  );
}
