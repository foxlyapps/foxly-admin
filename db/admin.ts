import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// Roles used to differentiate access levels in the admin panel.
export const adminRole = pgEnum("admin_role", ["admin", "superadmin"]);

// Admin users that authenticate into and manage the admin dashboard.
// Kept in a dedicated file so `drizzle-kit pull` (which overwrites schema.ts)
// does not clobber this hand-written definition.
export const adminUsers = pgTable(
  "admin_users",
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }),
    // Argon2/bcrypt hash. Never store plaintext.
    passwordHash: text("password_hash").notNull(),
    role: adminRole("role").default("admin").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    unique("admin_users_email_unique").on(table.email),
    index("idx_admin_users_email").using("btree", table.email.asc().nullsLast()),
    index("idx_admin_users_role").using("btree", table.role.asc().nullsLast()),
  ],
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
