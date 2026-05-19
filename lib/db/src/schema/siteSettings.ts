import { pgTable, serial, text, integer, timestamp, jsonb } from "drizzle-orm/pg-core";

export const siteSettingsTable = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  siteTitleEn: text("site_title_en").notNull().default(""),
  siteTitleAr: text("site_title_ar").notNull().default(""),
  conferenceYear: integer("conference_year").notNull().default(2026),
  conferenceNumber: integer("conference_number").notNull().default(2),
  conferenceOrdinalEn: text("conference_ordinal_en").notNull().default(""),
  conferenceOrdinalAr: text("conference_ordinal_ar").notNull().default(""),
  conferenceDatesEn: text("conference_dates_en").notNull().default(""),
  conferenceDatesAr: text("conference_dates_ar").notNull().default(""),
  venueNameEn: text("venue_name_en").notNull().default(""),
  venueNameAr: text("venue_name_ar").notNull().default(""),
  venueDescEn: text("venue_desc_en").notNull().default(""),
  venueDescAr: text("venue_desc_ar").notNull().default(""),
  contactPhone: text("contact_phone").notNull().default(""),
  contactWhatsapp: text("contact_whatsapp").notNull().default(""),
  contactEmails: jsonb("contact_emails").$type<string[]>().notNull().default([]),
  seoTitleEn: text("seo_title_en").notNull().default(""),
  seoTitleAr: text("seo_title_ar").notNull().default(""),
  seoDescEn: text("seo_desc_en").notNull().default(""),
  seoDescAr: text("seo_desc_ar").notNull().default(""),
  footerNoteEn: text("footer_note_en").notNull().default(""),
  footerNoteAr: text("footer_note_ar").notNull().default(""),
  logoUrl: text("logo_url"),
  faviconUrl: text("favicon_url"),
  socialImageUrl: text("social_image_url"),
  fontEn: text("font_en").notNull().default("Fraunces"),
  fontAr: text("font_ar").notNull().default("Cairo"),
  statEditions: text("stat_editions").notNull().default("02"),
  statDelegates: text("stat_delegates").notNull().default("500+"),
  statFaculty: text("stat_faculty").notNull().default("35"),
  statCmeHours: text("stat_cme_hours").notNull().default("12"),
  statCountries: text("stat_countries").notNull().default("4"),
  heroCtaFormSlug: text("hero_cta_form_slug"),
  heroCtaLabelEn: text("hero_cta_label_en").notNull().default(""),
  heroCtaLabelAr: text("hero_cta_label_ar").notNull().default(""),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type SiteSettings = typeof siteSettingsTable.$inferSelect;
