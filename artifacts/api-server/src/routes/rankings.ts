import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, yearsTable, stagesTable, scoresTable, playersTable } from "@workspace/db";
import { GetRankingsParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/rankings/:yearId", async (req, res): Promise<void> => {
  const params = GetRankingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const yearId = params.data.yearId;

  const [yearRow] = await db.select().from(yearsTable).where(eq(yearsTable.id, yearId));
  if (!yearRow) {
    res.status(404).json({ error: "Année non trouvée" });
    return;
  }

  const stages = await db
    .select()
    .from(stagesTable)
    .where(eq(stagesTable.yearId, yearId))
    .orderBy(stagesTable.order);

  const allScores = await db
    .select({
      id: scoresTable.id,
      playerId: scoresTable.playerId,
      stageId: scoresTable.stageId,
      score: scoresTable.score,
      points: scoresTable.points,
      playerName: playersTable.name,
    })
    .from(scoresTable)
    .leftJoin(playersTable, eq(scoresTable.playerId, playersTable.id))
    .leftJoin(stagesTable, eq(scoresTable.stageId, stagesTable.id))
    .where(eq(stagesTable.yearId, yearId));

  const stageRankings: Record<string, Array<{
    position: number;
    playerId: number;
    playerName: string;
    score: number;
    diffToPar: number;
    points: number;
  }>> = {};

  for (const stage of stages) {
    const stageScores = allScores
      .filter((s) => s.stageId === stage.id)
      .sort((a, b) => a.score - b.score);

    stageRankings[String(stage.id)] = stageScores.map((s, idx) => ({
      position: idx + 1,
      playerId: s.playerId,
      playerName: s.playerName ?? "",
      score: s.score,
      diffToPar: s.score - stage.par,
      points: s.points,
    }));
  }

  const playerMap = new Map<number, { playerId: number; playerName: string; stageScores: Array<{
    stageId: number;
    stageName: string;
    score: number;
    par: number;
    diffToPar: number;
    points: number;
  }> }>();

  for (const s of allScores) {
    const stage = stages.find((st) => st.id === s.stageId);
    if (!stage) continue;

    if (!playerMap.has(s.playerId)) {
      playerMap.set(s.playerId, {
        playerId: s.playerId,
        playerName: s.playerName ?? "",
        stageScores: [],
      });
    }

    playerMap.get(s.playerId)!.stageScores.push({
      stageId: stage.id,
      stageName: stage.name,
      score: s.score,
      par: stage.par,
      diffToPar: s.score - stage.par,
      points: s.points,
    });
  }

  const playerRankings = Array.from(playerMap.values()).map((p) => {
    const totalScore = p.stageScores.reduce((sum, s) => sum + s.score, 0);
    const totalPar = p.stageScores.reduce((sum, s) => sum + s.par, 0);
    const totalDiffToPar = totalScore - totalPar;
    const totalPoints = p.stageScores.reduce((sum, s) => sum + s.points, 0);
    return { ...p, totalScore, totalPar, totalDiffToPar, totalPoints };
  }).sort((a, b) => b.totalPoints - a.totalPoints || a.totalScore - b.totalScore)
    .map((p, idx) => ({ ...p, position: idx + 1 }));

  const cumulatedRankings = playerRankings.map((p, idx) => ({
    position: idx + 1,
    playerId: p.playerId,
    playerName: p.playerName,
    totalScore: p.totalScore,
    totalPar: p.totalPar,
    totalDiffToPar: p.totalDiffToPar,
    totalPoints: p.totalPoints,
  }));

  res.json({
    yearId,
    year: yearRow.year,
    stages: stages.map((s) => ({
      ...s,
      location: s.location ?? undefined,
      date: s.date ?? undefined,
      createdAt: s.createdAt.toISOString(),
    })),
    stageRankings,
    playerRankings,
    cumulatedRankings,
  });
});

router.get("/rankings/:yearId/export", async (req, res): Promise<void> => {
  const params = GetRankingsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const yearId = params.data.yearId;

  const [yearRow] = await db.select().from(yearsTable).where(eq(yearsTable.id, yearId));
  if (!yearRow) {
    res.status(404).json({ error: "Année non trouvée" });
    return;
  }

  const stages = await db
    .select()
    .from(stagesTable)
    .where(eq(stagesTable.yearId, yearId))
    .orderBy(stagesTable.order);

  const allScores = await db
    .select({
      id: scoresTable.id,
      playerId: scoresTable.playerId,
      stageId: scoresTable.stageId,
      score: scoresTable.score,
      points: scoresTable.points,
      playerName: playersTable.name,
    })
    .from(scoresTable)
    .leftJoin(playersTable, eq(scoresTable.playerId, playersTable.id))
    .leftJoin(stagesTable, eq(scoresTable.stageId, stagesTable.id))
    .where(eq(stagesTable.yearId, yearId));

  const playerMap = new Map<number, { playerId: number; playerName: string; stageScores: Map<number, { score: number; points: number; par: number }> }>();

  for (const s of allScores) {
    const stage = stages.find((st) => st.id === s.stageId);
    if (!stage) continue;

    if (!playerMap.has(s.playerId)) {
      playerMap.set(s.playerId, {
        playerId: s.playerId,
        playerName: s.playerName ?? "",
        stageScores: new Map(),
      });
    }

    playerMap.get(s.playerId)!.stageScores.set(stage.id, {
      score: s.score,
      points: s.points,
      par: stage.par,
    });
  }

  const stageHeaders = stages.flatMap((s) => [
    `${s.name} - Score`,
    `${s.name} - Diff/Par`,
    `${s.name} - Points`,
  ]);

  const headers = ["Position", "Joueur", ...stageHeaders, "Score Total", "Par Total", "Diff Total", "Points Total"];

  const players = Array.from(playerMap.values()).map((p) => {
    const scores = stages.map((s) => p.stageScores.get(s.id));
    const totalScore = scores.reduce((sum, s) => sum + (s?.score ?? 0), 0);
    const totalPar = scores.reduce((sum, s) => sum + (s?.par ?? 0), 0);
    const totalPoints = scores.reduce((sum, s) => sum + (s?.points ?? 0), 0);
    return { ...p, scores, totalScore, totalPar, totalDiffToPar: totalScore - totalPar, totalPoints };
  }).sort((a, b) => b.totalPoints - a.totalPoints || a.totalScore - b.totalScore);

  const rows = players.map((p, idx) => {
    const stageData = p.scores.flatMap((s) =>
      s ? [String(s.score), String(s.score - s.par), String(s.points)] : ["", "", ""]
    );
    return [
      String(idx + 1),
      p.playerName,
      ...stageData,
      String(p.totalScore),
      String(p.totalPar),
      String(p.totalDiffToPar),
      String(p.totalPoints),
    ];
  });

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="challenge-correzien-${yearRow.year}.csv"`);
  res.send("\uFEFF" + csv);
});

export default router;
