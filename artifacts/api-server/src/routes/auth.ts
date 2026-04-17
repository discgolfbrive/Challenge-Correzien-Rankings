import { Router, type IRouter } from "express";
import { createHash } from "crypto";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const ADMIN_USERNAME = "dgb";
const ADMIN_PASSWORD_HASH = createHash("sha256")
  .update("briveperrieres")
  .digest("hex");

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;

  if (username !== ADMIN_USERNAME || hashPassword(password) !== ADMIN_PASSWORD_HASH) {
    res.status(401).json({ error: "Identifiant ou mot de passe incorrect" });
    return;
  }

  (req.session as Record<string, unknown>).isAuthenticated = true;
  (req.session as Record<string, unknown>).username = username;

  res.json({ success: true, message: "Connexion réussie" });
});

router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session.destroy(() => {
    res.json({ message: "Déconnexion réussie" });
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const session = req.session as Record<string, unknown>;
  if (!session.isAuthenticated) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }
  res.json({ isAuthenticated: true, username: session.username });
});

export default router;
