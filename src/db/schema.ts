import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Auth tables (shape expected by Better Auth; wired up in step 2)     */
/* ------------------------------------------------------------------ */

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const circleRole = pgEnum("circle_role", ["admin", "member"]);

// pending   -> lender created it, waiting for borrower
// confirmed -> borrower accepted; counts toward balances
// rejected  -> borrower declined
// cancelled -> lender withdrew it while still pending
export const loanStatus = pgEnum("loan_status", [
  "pending",
  "confirmed",
  "rejected",
  "cancelled",
]);

// pending   -> borrower says "I paid", waiting for lender
// confirmed -> lender acknowledges receipt; counts
// rejected  -> lender disputes it
export const repaymentStatus = pgEnum("repayment_status", [
  "pending",
  "confirmed",
  "rejected",
]);

export const notificationType = pgEnum("notification_type", [
  "loan_requested",
  "loan_confirmed",
  "loan_rejected",
  "repayment_requested",
  "repayment_confirmed",
  "repayment_rejected",
]);

/* ------------------------------------------------------------------ */
/* Circles                                                             */
/* ------------------------------------------------------------------ */

export const circles = pgTable("circles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  inviteCode: text("invite_code").notNull().unique(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const circleMembers = pgTable(
  "circle_members",
  {
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: circleRole("role").notNull().default("member"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.circleId, t.userId] }),
    index("circle_members_user_idx").on(t.userId),
  ]
);

/* ------------------------------------------------------------------ */
/* Loans & repayments                                                  */
/* ------------------------------------------------------------------ */

export const loans = pgTable(
  "loans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    circleId: uuid("circle_id")
      .notNull()
      .references(() => circles.id, { onDelete: "cascade" }),
    lenderId: text("lender_id")
      .notNull()
      .references(() => user.id),
    borrowerId: text("borrower_id")
      .notNull()
      .references(() => user.id),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    note: text("note"),
    loanDate: date("loan_date", { mode: "string" }).notNull(),
    status: loanStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    respondedAt: timestamp("responded_at"),
  },
  (t) => [
    check("loans_amount_positive", sql`${t.amount} > 0`),
    check("loans_lender_not_borrower", sql`${t.lenderId} <> ${t.borrowerId}`),
    index("loans_circle_idx").on(t.circleId),
    index("loans_borrower_idx").on(t.borrowerId),
    index("loans_lender_idx").on(t.lenderId),
  ]
);

export const repayments = pgTable(
  "repayments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    loanId: uuid("loan_id")
      .notNull()
      .references(() => loans.id, { onDelete: "cascade" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paidDate: date("paid_date", { mode: "string" }).notNull(),
    note: text("note"),
    status: repaymentStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    respondedAt: timestamp("responded_at"),
  },
  (t) => [
    check("repayments_amount_positive", sql`${t.amount} > 0`),
    index("repayments_loan_idx").on(t.loanId),
  ]
);

/* ------------------------------------------------------------------ */
/* Notifications                                                       */
/* ------------------------------------------------------------------ */

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: notificationType("type").notNull(),
    loanId: uuid("loan_id").references(() => loans.id, { onDelete: "cascade" }),
    repaymentId: uuid("repayment_id").references(() => repayments.id, {
      onDelete: "cascade",
    }),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notifications_user_idx").on(t.userId, t.readAt)]
);
