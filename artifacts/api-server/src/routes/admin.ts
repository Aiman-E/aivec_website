import { Router, type IRouter } from "express";
import { sql, eq, desc } from "drizzle-orm";
import {
  db,
  usersTable,
  eventsTable,
  eventRegistrationsTable,
  newsPostsTable,
  blogPostsTable,
  contactSubmissionsTable,
} from "@workspace/db";
import { requireAdminSession } from "../lib/adminAuth";

const router: IRouter = Router();

router.get("/admin/dashboard", requireAdminSession, async (_req, res): Promise<void> => {
  const [usersCount] = await db.select({ c: sql<number>`count(*)::int` }).from(usersTable);
  const [eventsCount] = await db.select({ c: sql<number>`count(*)::int` }).from(eventsTable);
  const [openCount] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(eventsTable)
    .where(eq(eventsTable.status, "open"));
  const [enrollCount] = await db.select({ c: sql<number>`count(*)::int` }).from(eventRegistrationsTable);
  const [newsCount] = await db.select({ c: sql<number>`count(*)::int` }).from(newsPostsTable);
  const [blogCount] = await db.select({ c: sql<number>`count(*)::int` }).from(blogPostsTable);
  const [contactCount] = await db.select({ c: sql<number>`count(*)::int` }).from(contactSubmissionsTable);

  const recentReg = await db
    .select({
      id: eventRegistrationsTable.id,
      eventId: eventRegistrationsTable.eventId,
      userId: eventRegistrationsTable.userId,
      status: eventRegistrationsTable.status,
      notes: eventRegistrationsTable.notes,
      answers: eventRegistrationsTable.answers,
      createdAt: eventRegistrationsTable.createdAt,
      userEmail: usersTable.email,
      userFirst: usersTable.firstName,
      userLast: usersTable.lastName,
      eventTitleEn: eventsTable.titleEn,
      eventTitleAr: eventsTable.titleAr,
    })
    .from(eventRegistrationsTable)
    .innerJoin(usersTable, eq(eventRegistrationsTable.userId, usersTable.id))
    .innerJoin(eventsTable, eq(eventRegistrationsTable.eventId, eventsTable.id))
    .orderBy(desc(eventRegistrationsTable.createdAt))
    .limit(8);

  const recentContact = await db
    .select()
    .from(contactSubmissionsTable)
    .orderBy(desc(contactSubmissionsTable.createdAt))
    .limit(8);

  res.json({
    totalUsers: usersCount?.c ?? 0,
    totalEvents: eventsCount?.c ?? 0,
    openRegistrations: openCount?.c ?? 0,
    totalEnrollments: enrollCount?.c ?? 0,
    newsPosts: newsCount?.c ?? 0,
    blogPosts: blogCount?.c ?? 0,
    contactSubmissions: contactCount?.c ?? 0,
    recentRegistrations: recentReg.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      userId: r.userId,
      userEmail: r.userEmail,
      userName: [r.userFirst, r.userLast].filter(Boolean).join(" ") || null,
      eventTitleEn: r.eventTitleEn,
      eventTitleAr: r.eventTitleAr,
      status: r.status,
      notes: r.notes,
      answers: r.answers,
      createdAt: r.createdAt,
    })),
    recentContact,
  });
});

export default router;
