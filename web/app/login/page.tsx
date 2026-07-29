import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Giriş" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/persons");
  const params = await searchParams;

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary text-2xl font-semibold text-primary-foreground">
            ق
          </span>
          <h1 className="mt-4 font-heading text-2xl font-semibold tracking-tight">
            Kıraat Ağı
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Hoca-talebe ilişkileri araştırma çalışma alanı
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Hesabınıza giriş yapın</CardTitle>
            <CardDescription>
              Devam etmek için kullanıcı bilgilerinizi girin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm returnTo={params.returnTo ?? "/persons"} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
