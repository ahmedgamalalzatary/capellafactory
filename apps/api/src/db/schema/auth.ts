import {
  int,
  index,
  mysqlTable,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

export const adminsTable = mysqlTable(
  "admins",
  {
    id: int("id").autoincrement().primaryKey(),
    username: varchar("username", { length: 191 }).notNull(),
    credentialFingerprint: varchar("credential_fingerprint", { length: 64 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    usernameUniqueIndex: uniqueIndex("admins_username_unique").on(table.username),
  }),
);

export const authSessionsTable = mysqlTable(
  "auth_sessions",
  {
    id: int("id").autoincrement().primaryKey(),
    adminId: int("admin_id")
      .notNull()
      .references(() => adminsTable.id, { onDelete: "cascade", onUpdate: "cascade" }),
    tokenHash: varchar("token_hash", { length: 64 }).notNull(),
    credentialFingerprint: varchar("credential_fingerprint", { length: 64 }).notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    tokenHashUniqueIndex: uniqueIndex("auth_sessions_token_hash_unique").on(
      table.tokenHash,
    ),
    adminIdIndex: index("auth_sessions_admin_id_index").on(table.adminId),
    expiresAtIndex: index("auth_sessions_expires_at_index").on(table.expiresAt),
  }),
);
