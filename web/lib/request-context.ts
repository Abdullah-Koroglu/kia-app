import { randomUUID } from "node:crypto";

export function requestContext(request: Request) {
  const trustProxy = process.env.TRUST_PROXY === "true";
  const forwardedFor = trustProxy
    ? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    : null;

  return {
    requestId: randomUUID(),
    route: new URL(request.url).pathname,
    httpMethod: request.method,
    ipAddress:
      forwardedFor ??
      request.headers.get("x-real-ip") ??
      request.headers.get("cf-connecting-ip"),
    userAgent: request.headers.get("user-agent"),
  };
}

