import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, playersTable } from "@workspace/db";
import {
  CreatePlayerBody,
  UpdatePlayerBody,
  UpdatePlayerParams,
  DeletePlayerParams,
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

router.get("/players", async (_req, res): Promise<void> => {
  const players = await db.select().from(playersTable).orderBy(playersTable.name);
  res.json(players.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })));
});

router.post("/players", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const parsed = CreatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db.insert(playersTable).values(parsed.data).returning();
  res.status(201).json({ ...player, createdAt: player.createdAt.toISOString() });
});

router.put("/players/:playerId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = UpdatePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePlayerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [player] = await db
    .update(playersTable)
    .set(parsed.data)
    .where(eq(playersTable.id, params.data.playerId))
    .returning();

  if (!player) {
    res.status(404).json({ error: "Joueur non trouvé" });
    return;
  }

  res.json({ ...player, createdAt: player.createdAt.toISOString() });
});

router.delete("/players/:playerId", async (req, res): Promise<void> => {
  if (!requireAuth(req, res)) return;

  const params = DeletePlayerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(playersTable)
    .where(eq(playersTable.id, params.data.playerId))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Joueur non trouvé" });
    return;
  }

  res.json({ message: "Joueur supprimé" });
});

export default router;
