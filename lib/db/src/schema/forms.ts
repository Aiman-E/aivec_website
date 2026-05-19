import { pgTable, serial, text, integer, timestamp, varchar, boolean, jsonb } from "drizzle-orm/pg-core";

export const formsTable = pgTable("forms", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  titleEn: text("title_en").notNull().default(""),
  titleAr: text("title_ar").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  descriptionAr: text("description_ar").notNull().default(""),
  logoUrl: text("logo_url"),
  submitLabelEn: text("submit_label_en").notNull().default("Submit"),
  submitLabelAr: text("submit_label_ar").notNull().default("إرسال"),
  successMessageEn: text("success_message_en").notNull().default("Thank you. Your submission has been received."),
  successMessageAr: text("success_message_ar").notNull().default("شكراً لك. تم استلام إرسالك."),
  status: varchar("status", { length: 32 }).notNull().default("draft"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Form = typeof formsTable.$inferSelect;

export const formFieldsTable = pgTable("form_fields", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),
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

export type FormField = typeof formFieldsTable.$inferSelect;

export const formSubmissionsTable = pgTable("form_submissions", {
  id: serial("id").primaryKey(),
  formId: integer("form_id")
    .notNull()
    .references(() => formsTable.id, { onDelete: "cascade" }),
  answers: jsonb("answers").notNull().default({}),
  submitterName: text("submitter_name"),
  submitterEmail: text("submitter_email"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type FormSubmission = typeof formSubmissionsTable.$inferSelect;
