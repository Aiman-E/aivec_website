import { Router, type IRouter } from "express";
import { eq, asc, desc, and, gte, lt } from "drizzle-orm";
import {
  db,
  eventsTable,
  eventFieldsTable,
  eventRegistrationsTable,
  usersTable,
} from "@workspace/db";
import {
  CreateEventBody,
  UpdateEventBody,
  SetEventFieldsBody,
  RegisterForEventBody,
  UpdateRegistrationBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { requireAdminSession, optionalAdminSession, logAdminActivity } from "../lib/adminAuth";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw[0]! : raw;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

router.get("/events", optionalAdminSession, async (req, res): Promise<void> => {
  const status = typeof req.query["status"] === "string" ? req.query["status"] : "all";
  const isAdmin = !!req.adminUser;
  const PUBLIC_STATUSES = ["open", "closed", "coming_soon"];
  const now = new Date();
  let rows;
  if (status === "upcoming") {
    rows = await db.select().from(eventsTable).where(gte(eventsTable.startsAt, now)).orderBy(asc(eventsTable.startsAt));
  } else if (status === "past") {
    rows = await db.select().from(eventsTable).where(lt(eventsTable.endsAt, now)).orderBy(desc(eventsTable.startsAt));
  } else if (status === "open") {
    rows = await db.select().from(eventsTable).where(eq(eventsTable.status, "open")).orderBy(asc(eventsTable.startsAt));
  } else {
    rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.featured), asc(eventsTable.startsAt));
  }
  if (!isAdmin) {
    rows = rows.filter((e) => PUBLIC_STATUSES.includes(e.status));
  }
  res.json(rows);
});

router.post("/events", requireAdminSession, async (req, res): Promise<void> => {
  const parsed = CreateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.insert(eventsTable).values(parsed.data).returning();
  await logAdminActivity(req, "event.create", {
    targetType: "event",
    targetId: row!.id,
    summary: `Created event "${row!.titleEn}"`,
  });
  res.status(201).json(row);
});

router.get("/events/:slug", optionalAdminSession, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0]! : req.params.slug;
  const isAdmin = !!req.adminUser;
  let [event] = await db.select().from(eventsTable).where(eq(eventsTable.slug, slug));
  if (!event && /^\d+$/.test(slug)) {
    [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, parseInt(slug, 10)));
  }
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const PUBLIC_STATUSES = ["open", "closed", "coming_soon"];
  if (!isAdmin && !PUBLIC_STATUSES.includes(event.status)) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const fields = await db
    .select()
    .from(eventFieldsTable)
    .where(eq(eventFieldsTable.eventId, event.id))
    .orderBy(asc(eventFieldsTable.order), asc(eventFieldsTable.id));
  res.json({ event, fields });
});

router.patch("/events/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [row] = await db.update(eventsTable).set(parsed.data).where(eq(eventsTable.id, id)).returning();
  if (!row) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  await logAdminActivity(req, "event.update", {
    targetType: "event",
    targetId: row.id,
    summary: `Updated event "${row.titleEn}"`,
  });
  res.json(row);
});

router.delete("/events/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  await logAdminActivity(req, "event.delete", {
    targetType: "event",
    targetId: id,
    summary: existing ? `Deleted event "${existing.titleEn}"` : `Deleted event #${id}`,
  });
  res.sendStatus(204);
});

router.put("/events/id/:id/fields", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = SetEventFieldsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  await db.delete(eventFieldsTable).where(eq(eventFieldsTable.eventId, id));
  if (parsed.data.fields.length === 0) {
    res.json([]);
    return;
  }
  const inserted = await db
    .insert(eventFieldsTable)
    .values(
      parsed.data.fields.map((f, idx) => ({
        eventId: id,
        fieldKey: f.fieldKey,
        fieldType: f.fieldType,
        labelEn: f.labelEn,
        labelAr: f.labelAr,
        helpEn: f.helpEn ?? "",
        helpAr: f.helpAr ?? "",
        placeholderEn: f.placeholderEn ?? "",
        placeholderAr: f.placeholderAr ?? "",
        required: f.required ?? false,
        order: f.order ?? idx,
        options: f.options ?? null,
      })),
    )
    .returning();
  await logAdminActivity(req, "event.fields.update", {
    targetType: "event",
    targetId: id,
    summary: `Updated registration fields for event #${id}`,
    details: { count: inserted.length },
  });
  res.json(inserted);
});

router.post("/events/id/:id/register", requireAuth, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = RegisterForEventBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const user = req.localUser!;
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  if (event.status !== "open") {
    res.status(409).json({ error: "Registration is not open for this event" });
    return;
  }
  const fields = await db.select().from(eventFieldsTable).where(eq(eventFieldsTable.eventId, id));
  const answers = (parsed.data.answers ?? {}) as Record<string, unknown>;
  const missing: string[] = [];
  const invalid: string[] = [];
  for (const f of fields) {
    const v = answers[f.fieldKey];
    const isEmpty =
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0);
    if (f.required && isEmpty) {
      missing.push(f.fieldKey);
      continue;
    }
    if (!isEmpty && f.options && Array.isArray(f.options) && f.options.length > 0) {
      const allowed = new Set(f.options.map((o) => o.value));
      const values = Array.isArray(v) ? v : [v];
      if (!values.every((x) => typeof x === "string" && allowed.has(x))) {
        invalid.push(f.fieldKey);
      }
    }
  }
  if (missing.length || invalid.length) {
    res.status(400).json({ error: "Invalid registration", missing, invalid });
    return;
  }
  const allowedKeys = new Set(fields.map((f) => f.fieldKey));
  const filteredAnswers: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (allowedKeys.has(k)) filteredAnswers[k] = v;
  }
  let row;
  try {
    [row] = await db
      .insert(eventRegistrationsTable)
      .values({
        eventId: id,
        userId: user.id,
        answers: filteredAnswers,
        status: "submitted",
      })
      .returning();
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "You have already registered for this event" });
      return;
    }
    req.log.error({ err }, "event registration failed");
    res.status(500).json({ error: "Registration failed" });
    return;
  }
  res.status(201).json({
    ...row,
    userEmail: user.email,
    userName: [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
    eventTitleEn: event.titleEn,
    eventTitleAr: event.titleAr,
  });
});

router.get("/events/id/:id/registrations", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
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
    .where(eq(eventRegistrationsTable.eventId, id))
    .orderBy(desc(eventRegistrationsTable.createdAt));

  res.json(
    rows.map((r) => ({
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
  );
});

router.patch("/registrations/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateRegistrationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Partial<typeof eventRegistrationsTable.$inferInsert> = {};
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  const [row] = await db
    .update(eventRegistrationsTable)
    .set(updates)
    .where(eq(eventRegistrationsTable.id, id))
    .returning();
  if (!row) {
    res.status(404).json({ error: "Registration not found" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, row.userId));
  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, row.eventId));
  await logAdminActivity(req, "registration.update", {
    targetType: "registration",
    targetId: row.id,
    summary: `Updated registration #${row.id}${parsed.data.status ? ` → ${parsed.data.status}` : ""}`,
  });
  res.json({
    ...row,
    userEmail: user?.email ?? null,
    userName: user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || null : null,
    eventTitleEn: event?.titleEn ?? null,
    eventTitleAr: event?.titleAr ?? null,
  });
});

export default router;
