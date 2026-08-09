import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const invitations = sqliteTable(
  "invitations",
  {
    id: text("id").primaryKey(),
    publicToken: text("public_token").notNull(),
    statusTokenHash: text("status_token_hash").notNull(),
    templateId: text("template_id", { enum: ["playful", "sincere"] }).notNull(),
    fromName: text("from_name").notNull(),
    toName: text("to_name").notNull(),
    activity: text("activity", {
      enum: ["coffee", "dinner", "walk", "movie", "outing", "custom"],
    }).notNull(),
    customActivity: text("custom_activity").notNull().default(""),
    place: text("place").notNull(),
    eventDate: text("event_date").notNull(),
    eventTime: text("event_time").notNull(),
    message: text("message").notNull(),
    status: text("status", { enum: ["open", "responded"] })
      .notNull()
      .default("open"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [
    uniqueIndex("invitations_public_token_unique").on(table.publicToken),
    uniqueIndex("invitations_status_token_hash_unique").on(table.statusTokenHash),
    index("invitations_expires_at_index").on(table.expiresAt),
  ],
);

export const invitationResponses = sqliteTable(
  "invitation_responses",
  {
    invitationId: text("invitation_id")
      .primaryKey()
      .references(() => invitations.id, { onDelete: "cascade" }),
    choice: text("choice", { enum: ["yes", "adjust", "no"] }).notNull(),
    note: text("note").notNull().default(""),
    respondedAt: integer("responded_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => [index("invitation_responses_responded_at_index").on(table.respondedAt)],
);

export const invitationPlans = sqliteTable("invitation_plans", {
  invitationId: text("invitation_id")
    .primaryKey()
    .references(() => invitations.id, { onDelete: "cascade" }),
  activityOptions: text("activity_options").notNull(),
  selectedActivity: text("selected_activity", {
    enum: ["coffee", "dinner", "walk", "movie", "outing", "custom"],
  }),
  preferredTime: text("preferred_time"),
});
