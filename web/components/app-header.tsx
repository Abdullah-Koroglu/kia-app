"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { api } from "@/lib/client";
import { Button } from "./ui/button";

export function AppHeader({ username }: { username: string }) {
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
    <header className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/persons" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-900 font-serif text-lg font-bold text-white">
              ق
            </span>
            <span className="font-serif text-lg font-semibold text-stone-950">
              Kıraat Ağı
            </span>
          </Link>
          <Link
            href="/persons"
            className="hidden text-sm font-medium text-stone-600 hover:text-emerald-800 sm:block"
          >
            Kişiler
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-stone-500 sm:inline">
            {username}
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

