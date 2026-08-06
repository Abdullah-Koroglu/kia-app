"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/client";
import { Alert, AlertDescription } from "./ui/alert";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { ConfirmDialog } from "./ui/confirm-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type Place = { id: number; name: string; usageCount: number };

export function PlacesClient() {
  const [items, setItems] = useState<Place[]>([]);
  const [editing, setEditing] = useState<Place | null>(null);
  const [deleting, setDeleting] = useState<Place | null>(null);
  const [name, setName] = useState("");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try { const data = await api<{ items: Place[] }>("/api/places"); setItems(data.items); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Mekânlar yüklenemedi."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  function start(place?: Place) { setEditing(place ?? null); setName(place?.name ?? ""); setOpen(true); }
  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true);
    try {
      await api(editing ? `/api/places/${editing.id}` : "/api/places", {
        method: editing ? "PATCH" : "POST", body: JSON.stringify({ name }),
      });
      setOpen(false); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Mekân kaydedilemedi."); }
    finally { setBusy(false); }
  }
  async function remove() {
    if (!deleting) return; setBusy(true);
    try { await api(`/api/places/${deleting.id}`, { method: "DELETE" }); setDeleting(null); await load(); }
    catch (error) { setMessage(error instanceof Error ? error.message : "Mekân silinemedi."); setDeleting(null); }
    finally { setBusy(false); }
  }
  return <><div className="mb-7 flex items-end justify-between"><div><h1 className="font-heading text-2xl font-semibold">Mekân Yönetimi</h1><p className="mt-1 text-sm text-muted-foreground">İlişkilerde seçilen aktarım mekânları</p></div><Button onClick={() => start()}><Plus /> Yeni Mekân</Button></div>{message ? <Alert variant="destructive" className="mb-4"><AlertDescription>{message}</AlertDescription></Alert> : null}<Card className="overflow-hidden py-0"><Table><TableHeader><TableRow><TableHead>Mekân</TableHead><TableHead>Kullanım</TableHead><TableHead className="text-right">İşlemler</TableHead></TableRow></TableHeader><TableBody>{items.map((place) => <TableRow key={place.id}><TableCell className="font-medium"><span className="flex items-center gap-2"><MapPin className="size-4 text-muted-foreground" />{place.name}</span></TableCell><TableCell>{place.usageCount} ilişki</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" onClick={() => start(place)}><Pencil /></Button><Button variant="ghost" size="icon" disabled={place.usageCount > 0} onClick={() => setDeleting(place)} title={place.usageCount ? "Kullanılan mekân silinemez" : "Sil"}><Trash2 className="text-destructive" /></Button></div></TableCell></TableRow>)}</TableBody></Table></Card><Dialog open={open} onOpenChange={setOpen}><DialogContent><DialogHeader><DialogTitle>{editing ? "Mekânı düzenle" : "Yeni mekân"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4"><div className="grid gap-2"><Label>Mekân adı</Label><Input value={name} onChange={(event) => setName(event.target.value)} required /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button><Button disabled={busy}>Kaydet</Button></DialogFooter></form></DialogContent></Dialog><ConfirmDialog open={Boolean(deleting)} onOpenChange={(value) => !value && setDeleting(null)} title="Mekânı silmek istiyor musunuz?" description={deleting ? `${deleting.name} kalıcı olarak silinecek.` : ""} onConfirm={() => void remove()} busy={busy} /></>;
}
