import "server-only";
import type { AuthUser } from "./auth";
import type { PermissionCode } from "./permissions";
import { hasPermission } from "./permissions";

export class AuthorizationError extends Error {
  constructor(message = "Bu işlem için yetkiniz bulunmuyor.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function requirePermission(
  user: AuthUser,
  permission: PermissionCode,
) {
  if (!hasPermission(user.permissions, permission)) {
    throw new AuthorizationError();
  }
}

export function forbiddenResponse(error?: unknown) {
  return Response.json(
    {
      error:
        error instanceof AuthorizationError
          ? error.message
          : "Bu işlem için yetkiniz bulunmuyor.",
    },
    { status: 403 },
  );
}
