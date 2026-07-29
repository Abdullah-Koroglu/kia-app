"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { api } from "@/lib/client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export function LoginForm({ returnTo }: { returnTo: string }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      window.location.href =
        returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : "/persons";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Giriş yapılamadı.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid gap-2">
        <Label htmlFor="username">Kullanıcı adı</Label>
        <Input
          id="username"
          autoComplete="username"
          required
          autoFocus
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button className="w-full" size="lg" type="submit" disabled={busy}>
        <LogIn className="size-4" />
        {busy ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  );
}
