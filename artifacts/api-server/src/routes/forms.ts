import { Router, type IRouter } from "express";
import { eq, asc, desc } from "drizzle-orm";
import {
  db,
  formsTable,
  formFieldsTable,
  formSubmissionsTable,
} from "@workspace/db";
import {
  CreateFormBody,
  UpdateFormBody,
  SetFormFieldsBody,
  SubmitFormBody,
} from "@workspace/api-zod";
import { requireAdminSession, optionalAdminSession, logAdminActivity } from "../lib/adminAuth";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  if (!raw) return null;
  const s = Array.isArray(raw) ? raw[0]! : raw;
  const n = parseInt(s, 10);
  return Number.isNaN(n) ? null : n;
}

router.get("/forms", optionalAdminSession, async (req, res): Promise<void> => {
  const status = typeof req.query["status"] === "string" ? req.query["status"] : "all";
  const isAdmin = !!req.adminUser;
  let rows = await db.select().from(formsTable).orderBy(desc(formsTable.updatedAt));
  if (!isAdmin || status === "open") {
    rows = rows.filter((f) => f.status === "open");
  }
  res.json(rows);
});

router.post("/forms", requireAdminSession, async (req, res): Promise<void> => {
  const parsed = CreateFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db.insert(formsTable).values(parsed.data).returning();
    await logAdminActivity(req, "form.create", {
      targetType: "form",
      targetId: row!.id,
      summary: `Created form "${row!.titleEn}"`,
    });
    res.status(201).json(row);
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "A form with that slug already exists" });
      return;
    }
    req.log.error({ err }, "form create failed");
    res.status(500).json({ error: "Failed to create form" });
  }
});

router.get("/forms/:slug", optionalAdminSession, async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0]! : req.params.slug;
  const isAdmin = !!req.adminUser;
  let [form] = await db.select().from(formsTable).where(eq(formsTable.slug, slug));
  if (!form && /^\d+$/.test(slug)) {
    [form] = await db.select().from(formsTable).where(eq(formsTable.id, parseInt(slug, 10)));
  }
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  if (!isAdmin && form.status !== "open") {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  const fields = await db
    .select()
    .from(formFieldsTable)
    .where(eq(formFieldsTable.formId, form.id))
    .orderBy(asc(formFieldsTable.order), asc(formFieldsTable.id));
  res.json({ form, fields });
});

router.patch("/forms/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = UpdateFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  try {
    const [row] = await db.update(formsTable).set(parsed.data).where(eq(formsTable.id, id)).returning();
    if (!row) {
      res.status(404).json({ error: "Form not found" });
      return;
    }
    await logAdminActivity(req, "form.update", {
      targetType: "form",
      targetId: row.id,
      summary: `Updated form "${row.titleEn}"`,
    });
    res.json(row);
  } catch (err: unknown) {
    if (typeof err === "object" && err && "code" in err && (err as { code?: string }).code === "23505") {
      res.status(409).json({ error: "A form with that slug already exists" });
      return;
    }
    req.log.error({ err }, "form update failed");
    res.status(500).json({ error: "Failed to update form" });
  }
});

router.delete("/forms/id/:id", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const [existing] = await db.select().from(formsTable).where(eq(formsTable.id, id));
  await db.delete(formsTable).where(eq(formsTable.id, id));
  await logAdminActivity(req, "form.delete", {
    targetType: "form",
    targetId: id,
    summary: existing ? `Deleted form "${existing.titleEn}"` : `Deleted form #${id}`,
  });
  res.sendStatus(204);
});

router.put("/forms/id/:id/fields", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const parsed = SetFormFieldsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [parent] = await db.select().from(formsTable).where(eq(formsTable.id, id));
  if (!parent) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  const inserted = await db.transaction(async (tx) => {
    await tx.delete(formFieldsTable).where(eq(formFieldsTable.formId, id));
    if (parsed.data.fields.length === 0) return [];
    return tx
      .insert(formFieldsTable)
      .values(
        parsed.data.fields.map((f, idx) => ({
          formId: id,
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
  });
  await logAdminActivity(req, "form.fields.update", {
    targetType: "form",
    targetId: id,
    summary: `Updated fields for form #${id}`,
    details: { count: inserted.length },
  });
  res.json(inserted);
});

router.post("/forms/:slug/submit", async (req, res): Promise<void> => {
  const slug = Array.isArray(req.params.slug) ? req.params.slug[0]! : req.params.slug;
  const parsed = SubmitFormBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [form] = await db.select().from(formsTable).where(eq(formsTable.slug, slug));
  if (!form) {
    res.status(404).json({ error: "Form not found" });
    return;
  }
  if (form.status !== "open") {
    res.status(409).json({ error: "This form is not accepting submissions" });
    return;
  }
  const fields = await db.select().from(formFieldsTable).where(eq(formFieldsTable.formId, form.id));
  const answers = (parsed.data.answers ?? {}) as Record<string, unknown>;
  const missing: string[] = [];
  const invalid: string[] = [];
  const PRESENTATION_TYPES = new Set(["section_heading", "description_text"]);
  for (const f of fields) {
    if (PRESENTATION_TYPES.has(f.fieldType)) continue;
    const v = answers[f.fieldKey];
    const isEmpty =
      v === undefined ||
      v === null ||
      (typeof v === "string" && v.trim() === "") ||
      (Array.isArray(v) && v.length === 0) ||
      (typeof v === "boolean" && v === false && f.fieldType !== "yes_no");
    if (f.required && isEmpty) {
      missing.push(f.fieldKey);
      continue;
    }
    if (!isEmpty && f.options && Array.isArray(f.options) && f.options.length > 0 && (f.fieldType === "dropdown" || f.fieldType === "radio" || f.fieldType === "checkbox")) {
      const allowed = new Set(f.options.map((o) => o.value));
      const values = Array.isArray(v) ? v : [v];
      if (!values.every((x) => typeof x === "string" && allowed.has(x))) {
        invalid.push(f.fieldKey);
      }
    }
  }
  if (missing.length || invalid.length) {
    res.status(400).json({ error: "Invalid submission", missing, invalid });
    return;
  }
  const allowedKeys = new Set(fields.filter((f) => !PRESENTATION_TYPES.has(f.fieldType)).map((f) => f.fieldKey));
  const filteredAnswers: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(answers)) {
    if (allowedKeys.has(k)) filteredAnswers[k] = v;
  }
  const [row] = await db
    .insert(formSubmissionsTable)
    .values({
      formId: form.id,
      answers: filteredAnswers,
      submitterName: parsed.data.submitterName ?? null,
      submitterEmail: parsed.data.submitterEmail ?? null,
    })
    .returning();
  res.status(201).json(row);
});

router.get("/forms/id/:id/submissions", requireAdminSession, async (req, res): Promise<void> => {
  const id = parseId(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  const rows = await db
    .select()
    .from(formSubmissionsTable)
    .where(eq(formSubmissionsTable.formId, id))
    .orderBy(desc(formSubmissionsTable.createdAt));
  res.json(rows);
});

export default router;
