"use client";

import Link from "next/link";
import { ClipboardCheck, ListTodo, LogOut, MapPin, Shield, Users } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { Button } from "./ui/button";

export function AppHeader({
  user,
}: {
  user: { username: string; displayName: string; permissions: string[] };
}) {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await api("/api/auth/logout", { method: "POST" });
      window.location.href = "/login";
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/persons" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-lg font-semibold text-primary-foreground">
              ق
            </span>
            <span className="font-heading text-lg font-semibold">
              Kıraat Ağı
            </span>
          </Link>
          <Link
            href="/persons"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Âlimler
          </Link>
          {hasPermission(user.permissions, PERMISSIONS.ASSIGNMENT_VIEW_OWN) ? (
            <Link href="/my-assignments" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground lg:flex">
              <ListTodo className="size-4" /> Görevlerim
            </Link>
          ) : null}
          {hasPermission(user.permissions, PERMISSIONS.ASSIGNMENT_VIEW_ALL) ? (
            <>
              <Link href="/admin/assignments" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground lg:flex">
                <ListTodo className="size-4" /> Görevler
              </Link>
              <Link href="/admin/researchers" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground xl:flex">
                <Users className="size-4" /> Araştırmacılar
              </Link>
            </>
          ) : null}
          {hasPermission(user.permissions, PERMISSIONS.USER_VIEW) ? (
            <Link href="/admin/users" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground lg:flex">
              <Users className="size-4" /> Kullanıcılar
            </Link>
          ) : null}
          {hasPermission(user.permissions, PERMISSIONS.ROLE_VIEW) ? (
            <Link href="/admin/roles" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground lg:flex">
              <Shield className="size-4" /> Roller
            </Link>
          ) : null}
          {hasPermission(user.permissions, PERMISSIONS.PLACE_VIEW) ? (
            <Link href="/admin/places" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground xl:flex">
              <MapPin className="size-4" /> Mekânlar
            </Link>
          ) : null}
          {hasPermission(user.permissions, PERMISSIONS.REVIEW_QUEUE_VIEW) ? (
            <Link href="/reviews" className="hidden items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground lg:flex">
              <ClipboardCheck className="size-4" /> Kontrol
            </Link>
          ) : null}
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {user.displayName}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void logout()}
            disabled={busy}
          >
            <LogOut className="size-4" />
            Çıkış
          </Button>
        </div>
      </div>
    </header>
  );
}
