import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UsersClient } from "@/components/users-client";
import { requireUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Kullanıcı Yönetimi" };

export default async function UsersPage() {
  const user = await requireUser("/admin/users");
  if (!hasPermission(user.permissions, PERMISSIONS.USER_VIEW)) redirect("/persons");
  return <UsersClient currentUserId={user.id} />;
}
