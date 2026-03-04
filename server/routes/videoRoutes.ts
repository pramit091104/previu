import { Router } from "express";
import { initiateUpload, finalizeUpload, getVideoDetails } from "../controllers/videoController.ts";
import { strictLimiter } from "../middleware/rateLimiter.ts";

const router = Router();

router.post("/upload/initiate", strictLimiter, initiateUpload);
router.post("/upload/finalize", finalizeUpload);
router.get("/:videoId", getVideoDetails);

export default router;
