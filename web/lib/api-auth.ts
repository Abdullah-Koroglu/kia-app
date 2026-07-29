import { getCurrentUser } from "./auth";

export async function requireApiUser() {
  const user = await getCurrentUser();
  if (!user) {
    return {
      user: null,
      response: Response.json(
        { error: "Oturumunuz sona erdi. Lütfen tekrar giriş yapın." },
        { status: 401 },
      ),
    };
  }
  return { user, response: null };
}

