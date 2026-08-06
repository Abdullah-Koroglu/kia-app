import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlacesClient } from "@/components/places-client";
import { requireUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Mekân Yönetimi" };

export default async function PlacesPage() {
  const user = await requireUser("/admin/places");
  if (!hasPermission(user.permissions, PERMISSIONS.PLACE_VIEW)) redirect("/persons");
  return <PlacesClient />;
}
