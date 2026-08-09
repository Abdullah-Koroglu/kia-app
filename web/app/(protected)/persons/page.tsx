import type { Metadata } from "next";
import { PersonsClient } from "@/components/persons-client";

export const metadata: Metadata = { title: "Âlimler" };

export default function PersonsPage() {
  return <PersonsClient />;
}
