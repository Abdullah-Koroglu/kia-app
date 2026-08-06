import { getCurrentUser } from "./auth";
import { forbiddenResponse, requirePermission } from "./authorization";
import type { PermissionCode } from "./permissions";

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

export async function requireApiPermission(permission: PermissionCode) {
  const auth = await requireApiUser();
  if (auth.response || !auth.user) return auth;
  try {
    requirePermission(auth.user, permission);
    return auth;
  } catch (error) {
    return { user: null, response: forbiddenResponse(error) };
  }
}
