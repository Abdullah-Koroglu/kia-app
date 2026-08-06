import { AppHeader } from "@/components/app-header";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  return (
    <>
      <AppHeader user={user} />
      <main className="mx-auto max-w-[1500px] px-4 py-7 sm:px-6 sm:py-10">
        {children}
      </main>
    </>
  );
}
