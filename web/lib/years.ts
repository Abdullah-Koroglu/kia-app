export function formatGregorianYearInput(
  primary: number | null,
  secondary: number | null,
) {
  if (primary === null) return "";
  return secondary === null ? String(primary) : `${primary}-${secondary}`;
}

export function parseGregorianYearInput(value: string) {
  const normalized = value.trim();
  if (!normalized) return { primary: null, secondary: null };

  const match = normalized.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
  if (!match) {
    throw new Error("Miladî yıl tek sayı veya 856-857 biçiminde olmalıdır.");
  }

  const primary = Number(match[1]);
  const secondary = match[2] ? Number(match[2]) : null;
  if (secondary !== null && secondary !== primary + 1) {
    throw new Error("İkinci Miladî yıl ilk yıldan bir sonraki yıl olmalıdır.");
  }
  return { primary, secondary };
}
