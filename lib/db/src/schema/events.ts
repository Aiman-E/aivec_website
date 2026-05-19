import { pgTable, serial, text, integer, timestamp, varchar, boolean, jsonb, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const eventsTable = pgTable("events", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  titleEn: text("title_en").notNull().default(""),
  titleAr: text("title_ar").notNull().default(""),
  summaryEn: text("summary_en").notNull().default(""),
  summaryAr: text("summary_ar").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyAr: text("body_ar").notNull().default(""),
  venueEn: text("venue_en").notNull().default(""),
  venueAr: text("venue_ar").notNull().default(""),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  featured: boolean("featured").notNull().default(false),
  posterUrl: text("poster_url"),
  seoTitleEn: text("seo_title_en"),
  seoTitleAr: text("seo_title_ar"),
  seoDescEn: text("seo_desc_en"),
  seoDescAr: text("seo_desc_ar"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Event = typeof eventsTable.$inferSelect;

export const eventFieldsTable = pgTable("event_fields", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => eventsTable.id, { onDelete: "cascade" }),
  fieldKey: varchar("field_key", { length: 64 }).notNull(),
  fieldType: varchar("field_type", { length: 32 }).notNull(),
  labelEn: text("label_en").notNull().default(""),
  labelAr: text("label_ar").notNull().default(""),
  helpEn: text("help_en").notNull().default(""),
  helpAr: text("help_ar").notNull().default(""),
  placeholderEn: text("placeholder_en").notNull().default(""),
  placeholderAr: text("placeholder_ar").notNull().default(""),
  required: boolean("required").notNull().default(false),
  order: integer("order").notNull().default(0),
  options: jsonb("options").$type<Array<{ value: string; labelEn: string; labelAr: string }>>(),
});

export type EventField = typeof eventFieldsTable.$inferSelect;

export const eventRegistrationsTable = pgTable("event_registrations", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id")
    .notNull()
    .references(() => eventsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 32 }).notNull().default("submitted"),
  notes: text("notes"),
  answers: jsonb("answers").notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqUserEvent: uniqueIndex("event_registrations_event_user_uniq").on(table.eventId, table.userId),
}));

export type EventRegistration = typeof eventRegistrationsTable.$inferSelect;
