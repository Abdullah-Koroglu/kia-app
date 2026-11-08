import type { Metadata } from "next";
import { PersonsClient } from "@/components/persons-client";

export const metadata: Metadata = { title: "Âlimler" };

export default async function PersonsPage({
  searchParams,
}: {
  searchParams: Promise<{ homelandId?: string; homelandName?: string }>;
}) {
  const params = await searchParams;
  const requestedHomelandId = Number(params.homelandId);
  const homelandId =
    Number.isSafeInteger(requestedHomelandId) && requestedHomelandId > 0
      ? requestedHomelandId
      : undefined;

  return (
    <PersonsClient
      initialHomelandId={homelandId}
      initialHomelandName={params.homelandName}
    />
  );
}
