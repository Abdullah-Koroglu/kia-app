import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ReviewsClient } from "@/components/reviews-client";
import { requireUser } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Kontrol Kuyruğu" };

export default async function ReviewsPage() {
  const user = await requireUser("/reviews");
  if (!hasPermission(user.permissions, PERMISSIONS.REVIEW_QUEUE_VIEW)) redirect("/persons");
  return <ReviewsClient />;
}
