"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ClipboardCheck } from "lucide-react";
import { api } from "@/lib/client";
import type { ReviewQueueItem } from "@/lib/types";
import { Alert, AlertDescription } from "./ui/alert";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export function ReviewsClient() {
  const [items, setItems] = useState<ReviewQueueItem[]>([]);
  const [status, setStatus] = useState("READY_FOR_REVIEW");
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    try {
      const data = await api<{ items: ReviewQueueItem[] }>(`/api/reviews?status=${status}`);
      setItems(data.items); setMessage("");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kontrol kuyruğu yüklenemedi."); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);
  return <>
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h1 className="font-heading text-2xl font-semibold">Kontrol Kuyruğu</h1><p className="mt-1 text-sm text-muted-foreground">{items.length} âlim</p></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-56"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="READY_FOR_REVIEW">Kontrol bekliyor</SelectItem><SelectItem value="CHANGES_REQUESTED">Düzeltme bekliyor</SelectItem><SelectItem value="APPROVED">Onaylandı</SelectItem></SelectContent></Select></div>
    {message ? <Alert variant="destructive" className="mb-4"><AlertDescription>{message}</AlertDescription></Alert> : null}
    <Card className="overflow-hidden py-0"><Table><TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Âlim</TableHead><TableHead>Araştırmacı</TableHead><TableHead>Görev</TableHead><TableHead>Gönderim</TableHead><TableHead>Deadline</TableHead><TableHead className="text-right">İşlem</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="font-mono">#{item.extSourceId}</TableCell><TableCell className="font-medium">{item.name}</TableCell><TableCell>{item.researcherName || "—"}</TableCell><TableCell>{item.assignmentTitle || "—"}</TableCell><TableCell>{item.submittedForReviewAt ? new Date(item.submittedForReviewAt).toLocaleString("tr-TR") : "—"}</TableCell><TableCell>{item.deadlineAt ? <Badge variant={item.isOverdue ? "outline" : "secondary"}>{new Date(item.deadlineAt).toLocaleDateString("tr-TR")}</Badge> : "—"}</TableCell><TableCell className="text-right"><Button asChild size="sm"><Link href={`/persons/${item.id}`}><ClipboardCheck /> İncele</Link></Button></TableCell></TableRow>)}</TableBody></Table>{!items.length ? <div className="p-12 text-center text-sm text-muted-foreground">Bu durumda âlim bulunmuyor.</div> : null}</Card>
  </>;
}
