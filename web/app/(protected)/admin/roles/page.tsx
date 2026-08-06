import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RolesClient } from "@/components/roles-client";
import { requireUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Roller ve Yetkiler" };

export default async function RolesPage() {
  const user = await requireUser("/admin/roles");
  if (!hasPermission(user.permissions, PERMISSIONS.ROLE_VIEW)) redirect("/persons");
  return <RolesClient canManage={hasPermission(user.permissions, PERMISSIONS.ROLE_MANAGE)} />;
}
