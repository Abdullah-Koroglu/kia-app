import {
  type AnyPgColumn,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    username: varchar("username", { length: 80 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    displayName: varchar("display_name", { length: 160 }),
    isActive: boolean("is_active").default(true).notNull(),
    mustChangePassword: boolean("must_change_password").default(false).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdByUserId: uuid("created_by_user_id").references(
      (): AnyPgColumn => users.id,
      { onDelete: "set null" },
    ),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    disabledByUserId: uuid("disabled_by_user_id").references(
      (): AnyPgColumn => users.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [uniqueIndex("users_username_uq").on(table.username)],
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 80 }).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    isSystem: boolean("is_system").default(false).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("roles_code_uq").on(table.code),
    uniqueIndex("roles_name_uq").on(table.name),
  ],
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: varchar("code", { length: 100 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("permissions_code_uq").on(table.code)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (table) => [
    uniqueIndex("role_permissions_role_permission_uq").on(
      table.roleId,
      table.permissionId,
    ),
    index("role_permissions_role_id_idx").on(table.roleId),
  ],
);

export const userRoles = pgTable(
  "user_roles",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    assignedByUserId: uuid("assigned_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("user_roles_user_role_uq").on(table.userId, table.roleId),
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_id_idx").on(table.roleId),
  ],
);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "DRAFT",
  "ACTIVE",
  "COMPLETED",
  "CANCELLED",
]);

export const researchAssignments = pgTable(
  "research_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    researcherUserId: uuid("researcher_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }).notNull(),
    status: assignmentStatusEnum("status").default("ACTIVE").notNull(),
    assignedByUserId: uuid("assigned_by_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    completedByUserId: uuid("completed_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelledByUserId: uuid("cancelled_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    index("research_assignments_researcher_idx").on(table.researcherUserId),
    index("research_assignments_status_deadline_idx").on(
      table.status,
      table.deadlineAt,
    ),
  ],
);

export const researchAssignmentScopes = pgTable(
  "research_assignment_scopes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => researchAssignments.id, { onDelete: "cascade" }),
    startExtSourceId: integer("start_ext_source_id").notNull(),
    endExtSourceId: integer("end_ext_source_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("research_assignment_scopes_assignment_idx").on(table.assignmentId),
    index("research_assignment_scopes_range_idx").on(
      table.startExtSourceId,
      table.endExtSourceId,
    ),
    check(
      "research_assignment_scopes_valid_range_ck",
      sql`${table.startExtSourceId} > 0 and ${table.endExtSourceId} >= ${table.startExtSourceId}`,
    ),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("sessions_token_hash_uq").on(table.tokenHash),
    index("sessions_user_id_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ],
);

export const methods = pgTable(
  "methods",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("methods_name_uq").on(table.name)],
);

export const scopes = pgTable(
  "scopes",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("scopes_name_uq").on(table.name)],
);

export const certainties = pgTable(
  "certainties",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 120 }).notNull(),
    description: text("description"),
    ...timestamps,
  },
  (table) => [uniqueIndex("certainties_name_uq").on(table.name)],
);

export const places = pgTable(
  "places",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    name: varchar("name", { length: 160 }).notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("places_name_uq").on(table.name)],
);

export const persons = pgTable(
  "persons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    extSourceId: integer("ext_source_id").notNull(),
    name: varchar("name", { length: 180 }).notNull(),
    nameDescription: text("name_description"),
    birthYearHijri: integer("birth_year_hijri"),
    birthYearGregorian: integer("birth_year_gregorian"),
    deathYearHijri: integer("death_year_hijri"),
    deathYearGregorian: integer("death_year_gregorian"),
    detailNote: text("detail_note"),
    createdByUserId: uuid("created_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdUnderAssignmentId: uuid("created_under_assignment_id").references(
      () => researchAssignments.id,
      { onDelete: "set null" },
    ),
    updatedByUserId: uuid("updated_by_user_id").references(() => users.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("persons_ext_source_id_uq").on(table.extSourceId),
    index("persons_name_idx").on(table.name),
    index("persons_created_under_assignment_idx").on(
      table.createdUnderAssignmentId,
    ),
    check(
      "persons_hijri_year_order_ck",
      sql`${table.birthYearHijri} is null or ${table.deathYearHijri} is null or ${table.deathYearHijri} >= ${table.birthYearHijri}`,
    ),
    check(
      "persons_gregorian_year_order_ck",
      sql`${table.birthYearGregorian} is null or ${table.deathYearGregorian} is null or ${table.deathYearGregorian} >= ${table.birthYearGregorian}`,
    ),
  ],
);

export const relations = pgTable(
  "relations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teacherId: uuid("teacher_id")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => persons.id, { onDelete: "restrict" }),
    methodId: integer("method_id")
      .notNull()
      .references(() => methods.id, { onDelete: "restrict" }),
    scopeId: integer("scope_id")
      .notNull()
      .references(() => scopes.id, { onDelete: "restrict" }),
    certaintyId: integer("certainty_id")
      .notNull()
      .references(() => certainties.id, { onDelete: "restrict" }),
    placeId: integer("place_id").references(() => places.id, {
      onDelete: "restrict",
    }),
    detailNote: text("detail_note"),
    ...timestamps,
  },
  (table) => [
    check("relations_not_self_ck", sql`${table.teacherId} <> ${table.studentId}`),
    index("relations_teacher_id_idx").on(table.teacherId),
    index("relations_student_id_idx").on(table.studentId),
    uniqueIndex("relations_natural_key_uq").on(
      table.teacherId,
      table.studentId,
      table.methodId,
      table.scopeId,
      table.certaintyId,
      sql`coalesce(${table.placeId}, 0)`,
    ),
  ],
);

export const actorTypeEnum = pgEnum("audit_actor_type", ["USER", "SYSTEM"]);
export const auditActionEnum = pgEnum("audit_action", [
  "CREATE",
  "UPDATE",
  "DELETE",
  "LOGIN_SUCCESS",
  "LOGIN_FAILED",
  "LOGOUT",
  "SEED",
]);
export const auditSourceEnum = pgEnum("audit_source", [
  "WEB",
  "SEED",
  "MIGRATION",
  "DATABASE_ADMIN",
]);

export const auditEvents = pgTable(
  "audit_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorUserId: uuid("actor_user_id"),
    actorUsername: varchar("actor_username", { length: 180 }).notNull(),
    actorType: actorTypeEnum("actor_type").notNull(),
    action: auditActionEnum("action").notNull(),
    entityType: varchar("entity_type", { length: 80 }),
    entityId: varchar("entity_id", { length: 120 }),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    requestId: uuid("request_id"),
    source: auditSourceEnum("source").notNull(),
    route: text("route"),
    httpMethod: varchar("http_method", { length: 12 }),
    ipAddress: varchar("ip_address", { length: 80 }),
    userAgent: text("user_agent"),
    beforeSnapshot: jsonb("before_snapshot"),
    afterSnapshot: jsonb("after_snapshot"),
    metadata: jsonb("metadata"),
  },
  (table) => [
    index("audit_events_entity_idx").on(table.entityType, table.entityId),
    index("audit_events_actor_idx").on(table.actorUserId),
    index("audit_events_occurred_at_idx").on(table.occurredAt),
    index("audit_events_action_idx").on(table.action),
    index("audit_events_request_id_idx").on(table.requestId),
  ],
);

export const auditFieldChanges = pgTable(
  "audit_field_changes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    auditEventId: uuid("audit_event_id")
      .notNull()
      .references(() => auditEvents.id, { onDelete: "cascade" }),
    fieldName: varchar("field_name", { length: 160 }).notNull(),
    oldValue: jsonb("old_value"),
    newValue: jsonb("new_value"),
  },
  (table) => [index("audit_field_changes_event_idx").on(table.auditEventId)],
);
