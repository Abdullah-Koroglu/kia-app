import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function yearLabel(hijri: string | null, gregorian: string | null) {
  if (!hijri && !gregorian) return "—";
  return [hijri ? `${hijri} H` : null, gregorian ? `${gregorian} M` : null]
    .filter(Boolean)
    .join(" / ");
}
