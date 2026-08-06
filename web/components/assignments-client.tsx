"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { CheckCircle2, Clock3, Pencil, Plus, Trash2, XCircle } from "lucide-react";
import { api } from "@/lib/client";
import type { AssignmentScope, ManagedUser, ResearchAssignment } from "@/lib/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";

type Draft = { researcherUserId: string; title: string; description: string; startsAt: string; deadlineAt: string; scopes: AssignmentScope[] };

function localDateInput(value?: string) {
  const date = value ? new Date(value) : new Date();
  const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function freshDraft(): Draft {
  const deadline = new Date(); deadline.setDate(deadline.getDate() + 7);
  return { researcherUserId: "", title: "", description: "", startsAt: localDateInput(), deadlineAt: localDateInput(deadline.toISOString()), scopes: [{ startExtSourceId: 1, endExtSourceId: 1 }] };
}

export function AssignmentsClient({ manager }: { manager: boolean }) {
  const [items, setItems] = useState<ResearchAssignment[]>([]);
  const [researchers, setResearchers] = useState<ManagedUser[]>([]);
  const [editing, setEditing] = useState<ResearchAssignment | null>(null);
  const [draft, setDraft] = useState<Draft>(freshDraft());
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const assignmentData = await api<{ items: ResearchAssignment[] }>("/api/assignments");
      setItems(assignmentData.items);
      if (manager) {
        const userData = await api<{ items: ManagedUser[] }>("/api/users");
        setResearchers(userData.items.filter((user) => user.isActive && user.roles.some((role) => role.code === "RESEARCHER")));
      }
      setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Görevler yüklenemedi."); }
  }, [manager]);
  useEffect(() => { void load(); }, [load]);

  function startCreate() { setEditing(null); setDraft(freshDraft()); setOpen(true); }
  function startEdit(item: ResearchAssignment) {
    setEditing(item); setDraft({ researcherUserId: item.researcherUserId, title: item.title, description: item.description ?? "", startsAt: localDateInput(item.startsAt), deadlineAt: localDateInput(item.deadlineAt), scopes: item.scopes.map((scope) => ({ startExtSourceId: scope.startExtSourceId, endExtSourceId: scope.endExtSourceId })) }); setOpen(true);
  }
  function updateScope(index: number, field: "startExtSourceId" | "endExtSourceId", value: number) {
    setDraft((current) => ({ ...current, scopes: current.scopes.map((scope, position) => position === index ? { ...scope, [field]: value } : scope) }));
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      await api(editing ? `/api/assignments/${editing.id}` : "/api/assignments", { method: editing ? "PATCH" : "POST", body: JSON.stringify({ ...draft, startsAt: new Date(draft.startsAt).toISOString(), deadlineAt: new Date(draft.deadlineAt).toISOString(), description: draft.description || null }) });
      setOpen(false); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Görev kaydedilemedi."); }
    finally { setBusy(false); }
  }
  async function changeStatus(item: ResearchAssignment, action: "CANCEL" | "COMPLETE") {
    setBusy(true);
    try { await api(`/api/assignments/${item.id}/status`, { method: "POST", body: JSON.stringify({ action }) }); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Görev durumu değiştirilemedi."); }
    finally { setBusy(false); }
  }

  return <>
    <div className="mb-7 flex items-end justify-between gap-4"><div><h1 className="font-heading text-2xl font-semibold">{manager ? "Görev Yönetimi" : "Görevlerim"}</h1><p className="mt-1 text-sm text-muted-foreground">{items.length} görev</p></div>{manager ? <Button onClick={startCreate}><Plus /> Yeni Görev</Button> : null}</div>
    {message ? <Alert variant="destructive" className="mb-4"><AlertDescription>{message}</AlertDescription></Alert> : null}
    <div className="grid gap-4 lg:grid-cols-2">{items.map((item) => {
      const percent = item.assignedCount ? Math.round(item.createdCount / item.assignedCount * 100) : 0;
      return (
        <Card key={item.id}>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>{item.title}</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.researcherName}
                </p>
              </div>
              <div className="flex gap-1">
                <Badge variant={item.status === "ACTIVE" ? "default" : "outline"}>
                  {item.status === "ACTIVE"
                    ? item.isOverdue
                      ? "Gecikmiş"
                      : "Aktif"
                    : item.status === "COMPLETED"
                      ? "Tamamlandı"
                      : "İptal"}
                </Badge>
                {manager && item.status === "ACTIVE" ? (
                  <Button variant="ghost" size="icon" onClick={() => startEdit(item)}>
                    <Pencil />
                  </Button>
                ) : null}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-1">
              {item.scopes.map((scope) => (
                <Badge variant="secondary" key={`${scope.startExtSourceId}-${scope.endExtSourceId}`}>
                  {scope.startExtSourceId}–{scope.endExtSourceId}
                </Badge>
              ))}
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>{item.createdCount}/{item.assignedCount} âlim</span>
                <span>%{percent}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${percent}%` }} />
              </div>
              {item.missingIds.length ? (
                <div className="mt-3">
                  <p className="mb-1 text-xs font-medium text-muted-foreground">Eksik ID&apos;ler</p>
                  <div className="flex max-h-20 flex-wrap gap-1 overflow-y-auto">
                    {item.missingIds.map((missingId) => (
                      <Badge variant="outline" key={missingId}>{missingId}</Badge>
                    ))}
                  </div>
                </div>
              ) : null}
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <Badge variant="secondary">Onay {item.approvedCount}/{item.assignedCount}</Badge>
                <Badge variant="outline">Kontrol bekleyen {item.reviewPendingCount}</Badge>
                <Badge variant="outline">Düzeltme bekleyen {item.changesRequestedCount}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock3 className="size-4" />
              Deadline: {new Date(item.deadlineAt).toLocaleString("tr-TR")}
            </div>
            {manager && item.status === "ACTIVE" ? (
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="outline" disabled={busy} onClick={() => void changeStatus(item, "CANCEL")}>
                  <XCircle /> İptal Et
                </Button>
                <Button size="sm" disabled={busy || item.approvedCount < item.assignedCount} onClick={() => void changeStatus(item, "COMPLETE")}>
                  <CheckCircle2 /> Tamamla
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      );
    })}</div>

    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{editing ? "Görevi düzenle" : "Yeni görev"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
      <div className="grid gap-2"><Label>Araştırmacı</Label><Select value={draft.researcherUserId} onValueChange={(value) => setDraft({ ...draft, researcherUserId: value })} required><SelectTrigger className="w-full"><SelectValue placeholder="Araştırmacı seçin" /></SelectTrigger><SelectContent>{researchers.map((user) => <SelectItem value={user.id} key={user.id}>{user.displayName}</SelectItem>)}</SelectContent></Select></div>
      <div className="grid gap-2"><Label>Başlık</Label><Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required /></div>
      <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
      <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Başlangıç</Label><Input type="datetime-local" value={draft.startsAt} onChange={(e) => setDraft({ ...draft, startsAt: e.target.value })} required /></div><div className="grid gap-2"><Label>Deadline</Label><Input type="datetime-local" value={draft.deadlineAt} onChange={(e) => setDraft({ ...draft, deadlineAt: e.target.value })} required /></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between"><Label>Dış kaynak ID aralıkları</Label><Button type="button" size="sm" variant="outline" onClick={() => setDraft({ ...draft, scopes: [...draft.scopes, { startExtSourceId: 1, endExtSourceId: 1 }] })}><Plus /> Aralık</Button></div>{draft.scopes.map((scope, index) => <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={index}><Input type="number" min={1} value={scope.startExtSourceId} onChange={(e) => updateScope(index, "startExtSourceId", Number(e.target.value))} required /><Input type="number" min={1} value={scope.endExtSourceId} onChange={(e) => updateScope(index, "endExtSourceId", Number(e.target.value))} required /><Button type="button" variant="ghost" size="icon" disabled={draft.scopes.length === 1} onClick={() => setDraft({ ...draft, scopes: draft.scopes.filter((_, position) => position !== index) })}><Trash2 className="text-destructive" /></Button></div>)}</div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button disabled={busy}>{busy ? "Kaydediliyor…" : "Kaydet"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </>;
}
