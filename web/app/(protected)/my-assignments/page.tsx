import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AssignmentsClient } from "@/components/assignments-client";
import { requireUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Görevlerim" };

export default async function MyAssignmentsPage() {
  const user = await requireUser("/my-assignments");
  if (!hasPermission(user.permissions, PERMISSIONS.ASSIGNMENT_VIEW_OWN)) redirect("/persons");
  return <AssignmentsClient manager={false} />;
}
