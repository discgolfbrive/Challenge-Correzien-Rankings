import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import yearsRouter from "./years";
import playersRouter from "./players";
import stagesRouter from "./stages";
import scoresRouter from "./scores";
import rankingsRouter from "./rankings";
import scoringRulesRouter from "./scoringRules";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(yearsRouter);
router.use(playersRouter);
router.use(stagesRouter);
router.use(scoresRouter);
router.use(rankingsRouter);
router.use(scoringRulesRouter);

export default router;
