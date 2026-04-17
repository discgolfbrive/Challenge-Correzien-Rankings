import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, scoringRulesTable } from "@workspace/db";
import {
  CreateScoringRuleBody,
  UpdateScoringRuleParams,
  UpdateScoringRuleBody,
  DeleteScoringRuleParams,
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

router.get("/scoring-rules", async (_req, res): Promise<void> => {
  const rules = await db
    .select()
    .from(scoringRulesTable)
    .orderBy(scoringRulesTable.position);
  res.json(rules.map((r) => ({ id: r.id, position: r.position, points: r.points })));
});

router.post("/scoring-rules", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateScoringRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rule] = await db.insert(scoringRulesTable).values(parsed.data).returning();
  res.status(201).json({ id: rule.id, position: rule.position, points: rule.points });
});

router.put("/scoring-rules/:ruleId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = UpdateScoringRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateScoringRuleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [rule] = await db
    .update(scoringRulesTable)
    .set(parsed.data)
    .where(eq(scoringRulesTable.id, params.data.ruleId))
    .returning();

  if (!rule) {
    res.status(404).json({ error: "Règle non trouvée" });
    return;
  }

  res.json({ id: rule.id, position: rule.position, points: rule.points });
});

router.delete("/scoring-rules/:ruleId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = DeleteScoringRuleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(scoringRulesTable)
    .where(eq(scoringRulesTable.id, params.data.ruleId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Règle non trouvée" });
    return;
  }

  res.json({ message: "Règle supprimée" });
});

export default router;
