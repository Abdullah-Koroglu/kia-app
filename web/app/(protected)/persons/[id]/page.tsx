import type { Metadata } from "next";
import { PersonDetailClient } from "@/components/person-detail-client";

export const metadata: Metadata = { title: "Âlim Detayı" };

export default async function PersonDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PersonDetailClient personId={id} />;
}
