import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, yearsTable } from "@workspace/db";
import { CreateYearBody, DeleteYearParams } from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): boolean {
  const session = req.session as Record<string, unknown>;
  if (!session.isAuthenticated) {
    res.status(401).json({ error: "Non authentifié" });
    return false;
  }
  return true;
}

router.get("/years", async (_req, res): Promise<void> => {
  const years = await db.select().from(yearsTable).orderBy(yearsTable.year);
  res.json(years.map((y) => ({ ...y, createdAt: y.createdAt.toISOString() })));
});

router.post("/years", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateYearBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [year] = await db.insert(yearsTable).values(parsed.data).returning();
  res.status(201).json({ ...year, createdAt: year.createdAt.toISOString() });
});

router.delete("/years/:yearId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = DeleteYearParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(yearsTable)
    .where(eq(yearsTable.id, params.data.yearId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Année non trouvée" });
    return;
  }

  res.json({ message: "Année supprimée" });
});

export default router;
