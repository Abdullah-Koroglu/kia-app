import {
  deleteSession,
  getCurrentUser,
  SESSION_COOKIE,
} from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { sql } from "@/db";
import { requestContext } from "@/lib/request-context";

function readCookie(request: Request, name: string) {
  const cookies = request.headers.get("cookie") ?? "";
  return cookies
    .split(";")
    .map((item) => item.trim().split("="))
    .find(([key]) => key === name)?.[1];
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  const token = readCookie(request, SESSION_COOKIE);

  if (user) {
    await writeAudit(sql, {
      actor: user,
      action: "LOGOUT",
      context: requestContext(request),
    });
  }
  await deleteSession(token);

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  return response;
}

