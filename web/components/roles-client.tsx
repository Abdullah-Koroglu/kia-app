"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Shield } from "lucide-react";
import { api } from "@/lib/client";
import type { PermissionSummary, RoleSummary } from "@/lib/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

type Draft = { code: string; name: string; description: string; isActive: boolean; permissionIds: string[] };
const emptyDraft: Draft = { code: "", name: "", description: "", isActive: true, permissionIds: [] };

export function RolesClient({ canManage }: { canManage: boolean }) {
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [permissions, setPermissions] = useState<PermissionSummary[]>([]);
  const [editing, setEditing] = useState<RoleSummary | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await api<{ roles: RoleSummary[]; permissions: PermissionSummary[] }>("/api/roles");
      setRoles(data.roles); setPermissions(data.permissions); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Roller yüklenemedi."); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  function start(role?: RoleSummary) {
    setEditing(role ?? null);
    setDraft(role ? { code: role.code, name: role.name, description: role.description ?? "", isActive: role.isActive, permissionIds: role.permissionIds } : emptyDraft);
    setOpen(true);
  }
  function togglePermission(id: string) {
    setDraft((current) => ({ ...current, permissionIds: current.permissionIds.includes(id) ? current.permissionIds.filter((item) => item !== id) : [...current.permissionIds, id] }));
  }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      await api(editing ? `/api/roles/${editing.id}` : "/api/roles", {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(editing ? { name: draft.name, description: draft.description || null, isActive: draft.isActive, permissionIds: draft.permissionIds } : { code: draft.code.toUpperCase(), name: draft.name, description: draft.description || null, permissionIds: draft.permissionIds }),
      });
      setOpen(false); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Rol kaydedilemedi."); }
    finally { setBusy(false); }
  }

  return <>
    <div className="mb-7 flex items-end justify-between"><div><h1 className="font-heading text-2xl font-semibold">Roller ve Yetkiler</h1><p className="mt-1 text-sm text-muted-foreground">Veritabanı tabanlı rol tanımları</p></div>{canManage ? <Button onClick={() => start()}><Plus /> Yeni Rol</Button> : null}</div>
    {message ? <Alert variant="destructive" className="mb-4"><AlertDescription>{message}</AlertDescription></Alert> : null}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{roles.map((role) => <Card key={role.id}><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><Shield className="size-4" />{role.name}</CardTitle><p className="mt-1 font-mono text-xs text-muted-foreground">{role.code}</p></div>{canManage ? <Button size="icon" variant="ghost" onClick={() => start(role)}><Pencil /></Button> : null}</div></CardHeader><CardContent><p className="mb-4 text-sm text-muted-foreground">{role.description || "Açıklama yok."}</p><div className="flex flex-wrap gap-1"><Badge variant={role.isActive ? "default" : "outline"}>{role.isActive ? "Aktif" : "Pasif"}</Badge><Badge variant="secondary">{role.userCount} kullanıcı</Badge><Badge variant="secondary">{role.permissionIds.length} yetki</Badge>{role.isSystem ? <Badge variant="outline">Sistem rolü</Badge> : null}</div></CardContent></Card>)}</div>
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{editing ? "Rolü düzenle" : "Yeni rol"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Kod</Label><Input value={draft.code} disabled={Boolean(editing)} onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} required /></div><div className="grid gap-2"><Label>Ad</Label><Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} required /></div></div>
      <div className="grid gap-2"><Label>Açıklama</Label><Textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} /></div>
      {editing ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} /> Rol aktif</label> : null}
      <div className="grid gap-2"><Label>Yetkiler</Label><div className="grid max-h-80 gap-2 overflow-y-auto rounded-md border p-3 sm:grid-cols-2">{permissions.map((permission) => <label key={permission.id} className="flex items-start gap-2 text-sm"><input className="mt-1" type="checkbox" checked={draft.permissionIds.includes(permission.id)} onChange={() => togglePermission(permission.id)} /><span><span className="font-medium">{permission.name}</span><span className="block font-mono text-xs text-muted-foreground">{permission.code}</span></span></label>)}</div></div>
      <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button disabled={busy}>{busy ? "Kaydediliyor…" : "Kaydet"}</Button></DialogFooter>
    </form></DialogContent></Dialog>
  </>;
}
