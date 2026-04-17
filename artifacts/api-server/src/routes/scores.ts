import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, scoresTable, playersTable, stagesTable, scoringRulesTable } from "@workspace/db";
import {
  ListScoresQueryParams,
  CreateOrUpdateScoreBody,
  DeleteScoreParams,
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

async function computePointsForStage(stageId: number): Promise<void> {
  const stageScores = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.stageId, stageId))
    .orderBy(scoresTable.score);

  const rules = await db
    .select()
    .from(scoringRulesTable)
    .orderBy(scoringRulesTable.position);

  for (let i = 0; i < stageScores.length; i++) {
    const position = i + 1;
    const rule = rules.find((r) => r.position === position);
    const points = rule ? rule.points : 0;

    await db
      .update(scoresTable)
      .set({ points })
      .where(eq(scoresTable.id, stageScores[i].id));
  }
}

router.get("/scores", async (req, res): Promise<void> => {
  const queryParams = ListScoresQueryParams.safeParse(req.query);
  const { stageId, playerId } = queryParams.success ? queryParams.data : {};

  const conditions: ReturnType<typeof eq>[] = [];
  if (stageId) conditions.push(eq(scoresTable.stageId, stageId));
  if (playerId) conditions.push(eq(scoresTable.playerId, playerId));

  const rows = await db
    .select({
      id: scoresTable.id,
      playerId: scoresTable.playerId,
      stageId: scoresTable.stageId,
      score: scoresTable.score,
      points: scoresTable.points,
      playerName: playersTable.name,
      stageName: stagesTable.name,
      createdAt: scoresTable.createdAt,
    })
    .from(scoresTable)
    .leftJoin(playersTable, eq(scoresTable.playerId, playersTable.id))
    .leftJoin(stagesTable, eq(scoresTable.stageId, stagesTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined);

  res.json(
    rows.map((r) => ({
      ...r,
      playerName: r.playerName ?? "",
      stageName: r.stageName ?? "",
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/scores", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = CreateOrUpdateScoreBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { playerId, stageId, score } = parsed.data;

  const existing = await db
    .select()
    .from(scoresTable)
    .where(and(eq(scoresTable.playerId, playerId), eq(scoresTable.stageId, stageId)));

  let savedScore: typeof scoresTable.$inferSelect;

  if (existing.length > 0) {
    const [updated] = await db
      .update(scoresTable)
      .set({ score, points: 0 })
      .where(and(eq(scoresTable.playerId, playerId), eq(scoresTable.stageId, stageId)))
      .returning();
    savedScore = updated;
  } else {
    const [inserted] = await db
      .insert(scoresTable)
      .values({ playerId, stageId, score, points: 0 })
      .returning();
    savedScore = inserted;
  }

  await computePointsForStage(stageId);

  const [updated] = await db
    .select({
      id: scoresTable.id,
      playerId: scoresTable.playerId,
      stageId: scoresTable.stageId,
      score: scoresTable.score,
      points: scoresTable.points,
      playerName: playersTable.name,
      stageName: stagesTable.name,
      createdAt: scoresTable.createdAt,
    })
    .from(scoresTable)
    .leftJoin(playersTable, eq(scoresTable.playerId, playersTable.id))
    .leftJoin(stagesTable, eq(scoresTable.stageId, stagesTable.id))
    .where(eq(scoresTable.id, savedScore.id));

  res.json({
    ...updated,
    playerName: updated?.playerName ?? "",
    stageName: updated?.stageName ?? "",
    createdAt: updated?.createdAt.toISOString() ?? new Date().toISOString(),
  });
});

router.delete("/scores/:scoreId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = DeleteScoreParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [score] = await db
    .select()
    .from(scoresTable)
    .where(eq(scoresTable.id, params.data.scoreId));

  if (!score) {
    res.status(404).json({ error: "Score non trouvé" });
    return;
  }

  const stageId = score.stageId;

  await db.delete(scoresTable).where(eq(scoresTable.id, params.data.scoreId));
  await computePointsForStage(stageId);

  res.json({ message: "Score supprimé" });
});

export default router;
