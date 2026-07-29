import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "@/components/login-form";

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
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-900 font-serif text-3xl font-bold text-white shadow-lg">
            ق
          </span>
          <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight text-stone-950">
            Kıraat Ağı
          </h1>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Hoca-talebe ilişkileri araştırma çalışma alanı
          </p>
        </div>
        <section className="surface p-7 sm:p-8">
          <p className="eyebrow">Güvenli çalışma alanı</p>
          <h2 className="font-serif text-2xl font-semibold text-stone-950">
            Hesabınıza giriş yapın
          </h2>
          <LoginForm returnTo={params.returnTo ?? "/persons"} />
        </section>
      </div>
    </main>
  );
}

