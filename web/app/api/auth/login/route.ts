import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { sql } from "@/db";
import { verifyPassword } from "@/lib/password";
import { requestContext } from "@/lib/request-context";

export async function POST(request: Request) {
  const context = requestContext(request);
  let body: { username?: string; password?: string };

  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const username = body.username?.trim() ?? "";
  const password = body.password ?? "";
  const rows = username
    ? await sql<{ id: string; username: string; passwordHash: string }[]>`
        select id, username, password_hash as "passwordHash"
        from users
        where lower(username) = lower(${username})
        limit 1
      `
    : [];

  const user = rows[0];
  const valid =
    Boolean(user) && Boolean(password) && (await verifyPassword(password, user.passwordHash));

  if (!valid) {
    await writeAudit(sql, {
      actorUsername: username || "(boş)",
      actorType: "USER",
      action: "LOGIN_FAILED",
      metadata: { result: "invalid_credentials" },
      context,
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
    return Response.json(
      { error: "Kullanıcı adı veya şifre hatalı." },
      { status: 401 },
    );
  }

  const session = await createSession(user.id);
  await writeAudit(sql, {
    actor: { id: user.id, username: user.username },
    action: "LOGIN_SUCCESS",
    metadata: { result: "success" },
    context,
  });

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${session.token}; Path=/; HttpOnly; SameSite=Lax; Expires=${session.expiresAt.toUTCString()}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}

