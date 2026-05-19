import { pgTable, serial, text, timestamp, varchar, jsonb } from "drizzle-orm/pg-core";

export const pagesTable = pgTable("pages", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(),
  titleEn: text("title_en").notNull().default(""),
  titleAr: text("title_ar").notNull().default(""),
  subtitleEn: text("subtitle_en").notNull().default(""),
  subtitleAr: text("subtitle_ar").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyAr: text("body_ar").notNull().default(""),
  sections: jsonb("sections"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Page = typeof pagesTable.$inferSelect;
