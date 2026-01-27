import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const subscriberStatusEnum = pgEnum("subscriber_status", [
  "pending",
  "active",
  "unsubscribed",
]);

export const subscriber = pgTable(
  "subscriber",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    email: text("email").notNull().unique(),
    status: subscriberStatusEnum("status").notNull().default("pending"),
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    verifiedAt: timestamp("verified_at"),
    unsubscribedAt: timestamp("unsubscribed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("subscriber_email_idx").on(table.email),
    index("subscriber_status_idx").on(table.status),
  ],
);
