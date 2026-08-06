import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AssignmentsClient } from "@/components/assignments-client";
import { requireUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Görev Yönetimi" };

export default async function AdminAssignmentsPage() {
  const user = await requireUser("/admin/assignments");
  if (!hasPermission(user.permissions, PERMISSIONS.ASSIGNMENT_VIEW_ALL)) redirect("/persons");
  return <AssignmentsClient manager />;
}
