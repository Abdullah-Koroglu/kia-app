"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Power, ShieldCheck } from "lucide-react";
import { api } from "@/lib/client";
import type { ManagedUser, RoleSummary } from "@/lib/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type Draft = {
  username: string;
  displayName: string;
  password: string;
  roleIds: string[];
};

const emptyDraft: Draft = { username: "", displayName: "", password: "", roleIds: [] };

export function UsersClient({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [editing, setEditing] = useState<ManagedUser | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const [userData, roleData] = await Promise.all([
        api<{ items: ManagedUser[] }>("/api/users"),
        api<{ roles: RoleSummary[] }>("/api/roles"),
      ]);
      setUsers(userData.items);
      setRoles(roleData.roles.filter((role) => role.isActive));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kullanıcılar yüklenemedi.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function startCreate() {
    setEditing(null);
    setDraft(emptyDraft);
    setOpen(true);
  }

  function startEdit(user: ManagedUser) {
    setEditing(user);
    setDraft({
      username: user.username,
      displayName: user.displayName,
      password: "",
      roleIds: user.roles.map((role) => role.id),
    });
    setOpen(true);
  }

  function toggleRole(roleId: string) {
    setDraft((current) => ({
      ...current,
      roleIds: current.roleIds.includes(roleId)
        ? current.roleIds.filter((id) => id !== roleId)
        : [...current.roleIds, roleId],
    }));
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      if (editing) {
        await api(`/api/users/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({ username: draft.username, displayName: draft.displayName }),
        });
        await api(`/api/users/${editing.id}/roles`, {
          method: "PUT",
          body: JSON.stringify({ roleIds: draft.roleIds }),
        });
      } else {
        await api("/api/users", {
          method: "POST",
          body: JSON.stringify({ ...draft, mustChangePassword: true }),
        });
      }
      setOpen(false);
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kullanıcı kaydedilemedi.");
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(user: ManagedUser) {
    setBusy(true);
    try {
      await api(`/api/users/${user.id}/status`, {
        method: "POST",
        body: JSON.stringify({ active: !user.isActive }),
      });
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Durum değiştirilemedi.");
    } finally { setBusy(false); }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (!passwordUser) return;
    setBusy(true);
    try {
      await api(`/api/users/${passwordUser.id}/password`, {
        method: "POST",
        body: JSON.stringify({ password: newPassword, mustChangePassword: true }),
      });
      setPasswordUser(null);
      setNewPassword("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Şifre sıfırlanamadı.");
    } finally { setBusy(false); }
  }

  return (
    <>
      <div className="mb-7 flex items-end justify-between gap-4">
        <div><h1 className="font-heading text-2xl font-semibold">Kullanıcı Yönetimi</h1><p className="mt-1 text-sm text-muted-foreground">{users.length} kullanıcı</p></div>
        <Button onClick={startCreate}><Plus /> Yeni Kullanıcı</Button>
      </div>
      {message ? <Alert variant="destructive" className="mb-4"><AlertDescription>{message}</AlertDescription></Alert> : null}
      <Card className="overflow-hidden py-0">
        <Table>
          <TableHeader><TableRow><TableHead>Kullanıcı</TableHead><TableHead>Roller</TableHead><TableHead>Durum</TableHead><TableHead>Son giriş</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader>
          <TableBody>{users.map((user) => (
            <TableRow key={user.id}>
              <TableCell><div className="font-medium">{user.displayName}</div><div className="text-xs text-muted-foreground">@{user.username}</div></TableCell>
              <TableCell><div className="flex flex-wrap gap-1">{user.roles.map((role) => <Badge variant="secondary" key={role.id}>{role.name}</Badge>)}</div></TableCell>
              <TableCell><Badge variant={user.isActive ? "default" : "outline"}>{user.isActive ? "Aktif" : "Pasif"}</Badge></TableCell>
              <TableCell className="text-sm text-muted-foreground">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("tr-TR") : "—"}</TableCell>
              <TableCell><div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => startEdit(user)} title="Düzenle"><Pencil /></Button>
                <Button variant="ghost" size="icon" onClick={() => { setPasswordUser(user); setNewPassword(""); }} title="Şifre sıfırla"><KeyRound /></Button>
                <Button variant="ghost" size="icon" disabled={user.id === currentUserId || busy} onClick={() => void toggleStatus(user)} title={user.isActive ? "Pasife al" : "Aktifleştir"}><Power className={user.isActive ? "text-destructive" : "text-emerald-600"} /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Kullanıcıyı düzenle" : "Yeni kullanıcı"}</DialogTitle></DialogHeader>
        <form onSubmit={save} className="space-y-4">
          <div className="grid gap-2"><Label>Kullanıcı adı</Label><Input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} required /></div>
          <div className="grid gap-2"><Label>Görünen ad</Label><Input value={draft.displayName} onChange={(e) => setDraft({ ...draft, displayName: e.target.value })} required /></div>
          {!editing ? <div className="grid gap-2"><Label>Geçici şifre</Label><Input type="password" minLength={10} value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} required /></div> : null}
          <div className="grid gap-2"><Label>Roller</Label><div className="grid gap-2 rounded-md border p-3">{roles.map((role) => <label key={role.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.roleIds.includes(role.id)} onChange={() => toggleRole(role.id)} /><ShieldCheck className="size-4 text-muted-foreground" /> {role.name}</label>)}</div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button disabled={busy}>{busy ? "Kaydediliyor…" : "Kaydet"}</Button></DialogFooter>
        </form>
      </DialogContent></Dialog>

      <Dialog open={Boolean(passwordUser)} onOpenChange={(value) => !value && setPasswordUser(null)}><DialogContent><DialogHeader><DialogTitle>Şifre sıfırla</DialogTitle></DialogHeader>
        <form onSubmit={resetPassword} className="space-y-4"><p className="text-sm text-muted-foreground">{passwordUser?.displayName} için en az 10 karakterli geçici şifre belirleyin.</p><Input type="password" minLength={10} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /><DialogFooter><Button type="button" variant="outline" onClick={() => setPasswordUser(null)}>İptal</Button><Button disabled={busy}>Şifreyi Sıfırla</Button></DialogFooter></form>
      </DialogContent></Dialog>
    </>
  );
}
