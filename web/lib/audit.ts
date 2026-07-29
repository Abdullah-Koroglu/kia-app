import type postgres from "postgres";
import type { AuthUser } from "./auth";

type Queryable = ReturnType<typeof postgres>;

type AuditInput = {
  actor?: AuthUser | null;
  actorUsername?: string;
  actorType?: "USER" | "SYSTEM";
  action:
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "LOGIN_SUCCESS"
    | "LOGIN_FAILED"
    | "LOGOUT"
    | "SEED";
  entityType?: string;
  entityId?: string;
  source?: "WEB" | "SEED" | "MIGRATION" | "DATABASE_ADMIN";
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  context?: {
    requestId?: string;
    route?: string;
    httpMethod?: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
};

const REDACTED_FIELDS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "token",
  "sessionToken",
  "authorization",
  "databaseUrl",
]);

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => !REDACTED_FIELDS.has(key))
        .map(([key, nested]) => [key, sanitize(nested)]),
    );
  }
  return value;
}

function changes(
  before: Record<string, unknown> | null | undefined,
  after: Record<string, unknown> | null | undefined,
) {
  if (!before || !after) return [];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);

  return [...keys]
    .filter((key) => !REDACTED_FIELDS.has(key))
    .filter(
      (key) =>
        JSON.stringify(before[key] ?? null) !==
        JSON.stringify(after[key] ?? null),
    )
    .map((key) => ({
      fieldName: key,
      oldValue: sanitize(before[key] ?? null),
      newValue: sanitize(after[key] ?? null),
    }));
}

export async function writeAudit(client: Queryable, input: AuditInput) {
  const actorType = input.actorType ?? (input.actor ? "USER" : "SYSTEM");
  const actorUsername =
    input.actor?.username ?? input.actorUsername ?? "system";
  const before = input.before ? sanitize(input.before) : null;
  const after = input.after ? sanitize(input.after) : null;
  const metadata = input.metadata ? sanitize(input.metadata) : null;

  const events = await client<{ id: string }[]>`
    insert into audit_events (
      actor_user_id, actor_username, actor_type, action, entity_type, entity_id,
      request_id, source, route, http_method, ip_address, user_agent,
      before_snapshot, after_snapshot, metadata
    ) values (
      ${input.actor?.id ?? null},
      ${actorUsername},
      ${actorType},
      ${input.action},
      ${input.entityType ?? null},
      ${input.entityId ?? null},
      ${input.context?.requestId ?? null},
      ${input.source ?? "WEB"},
      ${input.context?.route ?? null},
      ${input.context?.httpMethod ?? null},
      ${input.context?.ipAddress ?? null},
      ${input.context?.userAgent ?? null},
      ${before ? JSON.stringify(before) : null}::jsonb,
      ${after ? JSON.stringify(after) : null}::jsonb,
      ${metadata ? JSON.stringify(metadata) : null}::jsonb
    )
    returning id
  `;

  const eventId = events[0].id;
  for (const change of changes(input.before, input.after)) {
    await client`
      insert into audit_field_changes (
        audit_event_id, field_name, old_value, new_value
      ) values (
        ${eventId},
        ${change.fieldName},
        ${JSON.stringify(change.oldValue)}::jsonb,
        ${JSON.stringify(change.newValue)}::jsonb
      )
    `;
  }

  return eventId;
}
