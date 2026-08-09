import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function yearLabel(
  hijri: number | null,
  gregorian: number | null,
  gregorianSecondary: number | null = null,
) {
  if (!hijri && !gregorian) return "—";
  const gregorianLabel = gregorian
    ? `${gregorian}${gregorianSecondary ? `-${gregorianSecondary}` : ""} M`
    : null;
  return [hijri ? `${hijri} H` : null, gregorianLabel]
    .filter(Boolean)
    .join(" / ");
}
