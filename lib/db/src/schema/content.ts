import { pgTable, serial, text, timestamp, varchar, boolean, integer } from "drizzle-orm/pg-core";

export const newsPostsTable = pgTable("news_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  titleEn: text("title_en").notNull().default(""),
  titleAr: text("title_ar").notNull().default(""),
  excerptEn: text("excerpt_en").notNull().default(""),
  excerptAr: text("excerpt_ar").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyAr: text("body_ar").notNull().default(""),
  category: varchar("category", { length: 64 }).notNull().default("general"),
  coverUrl: text("cover_url"),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
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

export type NewsPost = typeof newsPostsTable.$inferSelect;

export const blogPostsTable = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  titleEn: text("title_en").notNull().default(""),
  titleAr: text("title_ar").notNull().default(""),
  excerptEn: text("excerpt_en").notNull().default(""),
  excerptAr: text("excerpt_ar").notNull().default(""),
  bodyEn: text("body_en").notNull().default(""),
  bodyAr: text("body_ar").notNull().default(""),
  tags: text("tags").array().notNull().default([]),
  coverUrl: text("cover_url"),
  authorName: text("author_name").notNull().default(""),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
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

export type BlogPost = typeof blogPostsTable.$inferSelect;

export const contactSubmissionsTable = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull().default(""),
  subject: text("subject").notNull().default(""),
  message: text("message").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ContactSubmission = typeof contactSubmissionsTable.$inferSelect;

export const sponsorsTable = pgTable("sponsors", {
  id: serial("id").primaryKey(),
  nameEn: text("name_en").notNull(),
  nameAr: text("name_ar").notNull(),
  tier: varchar("tier", { length: 32 }).notNull().default("supporter"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  order: serial("order"),
});

export type Sponsor = typeof sponsorsTable.$inferSelect;

export const heroImagesTable = pgTable("hero_images", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  captionEn: text("caption_en").notNull().default(""),
  captionAr: text("caption_ar").notNull().default(""),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type HeroImage = typeof heroImagesTable.$inferSelect;
