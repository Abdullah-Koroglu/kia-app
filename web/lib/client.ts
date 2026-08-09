import { toast } from "sonner";

const fieldLabels: Record<string, string> = {
  extSourceId: "Dış kaynak ID",
  name: "Ad",
  nameDescription: "İsim açıklaması",
  birthYearHijri: "Hicrî doğum yılı",
  birthYearGregorian: "Miladî doğum yılı",
  birthYearGregorianSecondary: "İkinci Miladî doğum yılı",
  deathYearHijri: "Hicrî vefat yılı",
  deathYearGregorian: "Miladî vefat yılı",
  deathYearGregorianSecondary: "İkinci Miladî vefat yılı",
  homelandId: "Memleket",
  detailNote: "Detay notu",
  username: "Kullanıcı adı",
  displayName: "Görünen ad",
  password: "Şifre",
  roleIds: "Roller",
  permissionIds: "Yetkiler",
  researcherUserId: "Araştırmacı",
  title: "Başlık",
  startsAt: "Başlangıç",
  deadlineAt: "Deadline",
  scopes: "Görev kapsamı",
  teacherId: "Hoca",
  studentId: "Talebe",
  methodId: "Yöntem",
  scopeId: "Kapsam",
  certaintyId: "Kesinlik",
  placeId: "Mekân",
  comment: "Yorum",
};

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
      fields?: Record<string, string[]>;
    } | null;
    const fieldMessages = Object.entries(body?.fields ?? {})
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => ({
        field,
        message: messages.join(" "),
      }));
    for (const item of fieldMessages) {
      toast.error(fieldLabels[item.field] ?? item.field, {
        description: item.message,
      });
    }
    throw new Error(
      fieldMessages[0]
        ? `${fieldLabels[fieldMessages[0].field] ?? fieldMessages[0].field}: ${fieldMessages[0].message}`
        : body?.error ?? "İşlem tamamlanamadı.",
    );
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
