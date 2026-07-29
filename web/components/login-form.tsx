"use client";

import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { api } from "@/lib/client";
import { Button } from "./ui/button";
import { FieldError, Input, Label } from "./ui/field";

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
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
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
      <div>
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
      <FieldError>{error}</FieldError>
      <Button className="w-full" type="submit" disabled={busy}>
        <LogIn className="size-4" />
        {busy ? "Giriş yapılıyor…" : "Giriş Yap"}
      </Button>
    </form>
  );
}

