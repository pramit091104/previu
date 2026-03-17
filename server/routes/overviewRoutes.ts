import { Router } from "express";
import { getOverviewStats } from "../controllers/overviewController.ts";
import { strictLimiter } from "../middleware/rateLimiter.ts";

const router = Router();

router.get("/", getOverviewStats);

export default router;
