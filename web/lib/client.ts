export async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("Oturum sona erdi.");
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      error?: string;
    } | null;
    throw new Error(body?.error ?? "İşlem tamamlanamadı.");
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

