import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, eventRegistrationsTable, eventsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/me", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  });
});

router.get("/me/registrations", requireAuth, async (req, res): Promise<void> => {
  const user = req.localUser!;
  const rows = await db
    .select({
      id: eventRegistrationsTable.id,
      eventId: eventRegistrationsTable.eventId,
      userId: eventRegistrationsTable.userId,
      status: eventRegistrationsTable.status,
      notes: eventRegistrationsTable.notes,
      answers: eventRegistrationsTable.answers,
      createdAt: eventRegistrationsTable.createdAt,
      eventTitleEn: eventsTable.titleEn,
      eventTitleAr: eventsTable.titleAr,
    })
    .from(eventRegistrationsTable)
    .innerJoin(eventsTable, eq(eventRegistrationsTable.eventId, eventsTable.id))
    .where(eq(eventRegistrationsTable.userId, user.id))
    .orderBy(desc(eventRegistrationsTable.createdAt));

  res.json(
    rows.map((r) => ({
      id: r.id,
      eventId: r.eventId,
      userId: r.userId,
      userEmail: user.email,
      userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      eventTitleEn: r.eventTitleEn,
      eventTitleAr: r.eventTitleAr,
      status: r.status,
      notes: r.notes,
      answers: r.answers,
      createdAt: r.createdAt,
    })),
  );
});

export default router;
