import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, stagesTable } from "@workspace/db";
import {
  ListStagesQueryParams,
  CreateStageBody,
  UpdateStageParams,
  UpdateStageBody,
  DeleteStageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function requireAuth(req: any, res: any): boolean {
  const session = req.session as Record<string, unknown>;
  if (!session.isAuthenticated) {
    res.status(401).json({ error: "Non authentifié" });
    return false;
  }
  return true;
}

function stageToJson(stage: typeof stagesTable.$inferSelect) {
  return {
    ...stage,
    createdAt: stage.createdAt.toISOString(),
  };
}

router.get("/stages", async (req, res): Promise<void> => {
  const queryParams = ListStagesQueryParams.safeParse(req.query);
  const yearId = queryParams.success ? queryParams.data.yearId : undefined;

  let query = db.select().from(stagesTable).$dynamic();
  if (yearId) {
    query = query.where(eq(stagesTable.yearId, yearId));
  }

  const stages = await query.orderBy(stagesTable.order);
  res.json(stages.map(stageToJson));
});

router.post("/stages", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateStageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [stage] = await db.insert(stagesTable).values(parsed.data).returning();
  res.status(201).json(stageToJson(stage));
});

router.put("/stages/:stageId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = UpdateStageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateStageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [stage] = await db
    .update(stagesTable)
    .set(parsed.data)
    .where(eq(stagesTable.id, params.data.stageId))
    .returning();

  if (!stage) {
    res.status(404).json({ error: "Étape non trouvée" });
    return;
  }

  res.json(stageToJson(stage));
});

router.delete("/stages/:stageId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = DeleteStageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(stagesTable)
    .where(eq(stagesTable.id, params.data.stageId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Étape non trouvée" });
    return;
  }

  res.json({ message: "Étape supprimée" });
});

export default router;
