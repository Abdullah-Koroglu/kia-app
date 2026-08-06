import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ResearchersProgressClient } from "@/components/researchers-progress-client";
import { requireUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Araştırmacı İlerlemesi" };

export default async function ResearchersPage() {
  const user = await requireUser("/admin/researchers");
  if (!hasPermission(user.permissions, PERMISSIONS.ASSIGNMENT_VIEW_ALL)) redirect("/persons");
  return <ResearchersProgressClient />;
}
