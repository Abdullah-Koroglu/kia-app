"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/client";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

type ResearcherProgress = {
  userId: string; displayName: string; username: string; isActive: boolean;
  activeAssignmentCount: number; overdueAssignmentCount: number;
  assignedCount: number; createdCount: number; approvedCount: number;
  reviewPendingCount: number; changesRequestedCount: number;
  lastActivityAt: string | null; nearestDeadlineAt: string | null;
};

export function ResearchersProgressClient() {
  const [items, setItems] = useState<ResearcherProgress[]>([]);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try { const data = await api<{ items: ResearcherProgress[] }>("/api/researchers/progress"); setItems(data.items); setMessage(""); }
    catch (error) { setMessage(error instanceof Error ? error.message : "İlerleme yüklenemedi."); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return <><div className="mb-7"><h1 className="font-heading text-2xl font-semibold">Araştırmacı İlerlemesi</h1><p className="mt-1 text-sm text-muted-foreground">Bugüne kadarki görev, veri girişi ve kontrol durumu</p></div>{message ? <Alert variant="destructive" className="mb-4"><AlertDescription>{message}</AlertDescription></Alert> : null}<Card className="overflow-hidden py-0"><Table className="min-w-[1100px]"><TableHeader><TableRow><TableHead>Araştırmacı</TableHead><TableHead>Görevler</TableHead><TableHead>Veri girişi</TableHead><TableHead>Onay</TableHead><TableHead>Kontrol</TableHead><TableHead>En yakın deadline</TableHead><TableHead>Son aktivite</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => {
    const entryPercent = item.assignedCount ? Math.round(item.createdCount / item.assignedCount * 100) : 0;
    const approvalPercent = item.assignedCount ? Math.round(item.approvedCount / item.assignedCount * 100) : 0;
    return <TableRow key={item.userId}><TableCell><div className="font-medium">{item.displayName}</div><div className="text-xs text-muted-foreground">@{item.username} · {item.isActive ? "Aktif" : "Pasif"}</div></TableCell><TableCell><Badge variant="secondary">{item.activeAssignmentCount} aktif</Badge>{item.overdueAssignmentCount ? <Badge variant="outline" className="ml-1">{item.overdueAssignmentCount} gecikmiş</Badge> : null}</TableCell><TableCell><div className="text-sm">{item.createdCount}/{item.assignedCount} · %{entryPercent}</div><div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${Math.min(100, entryPercent)}%` }} /></div></TableCell><TableCell><div className="text-sm">{item.approvedCount}/{item.assignedCount} · %{approvalPercent}</div><div className="mt-1 h-1.5 w-32 overflow-hidden rounded-full bg-muted"><div className="h-full bg-emerald-600" style={{ width: `${Math.min(100, approvalPercent)}%` }} /></div></TableCell><TableCell><span className="text-sm">{item.reviewPendingCount} bekliyor</span><span className="ml-2 text-sm text-amber-700">{item.changesRequestedCount} düzeltme</span></TableCell><TableCell>{item.nearestDeadlineAt ? new Date(item.nearestDeadlineAt).toLocaleString("tr-TR") : "—"}</TableCell><TableCell>{item.lastActivityAt ? new Date(item.lastActivityAt).toLocaleString("tr-TR") : "—"}</TableCell></TableRow>;
  })}</TableBody></Table>{!items.length ? <div className="p-12 text-center text-sm text-muted-foreground">Araştırmacı bulunmuyor.</div> : null}</Card></>;
}
