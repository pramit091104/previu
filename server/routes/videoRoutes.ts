import { Router } from "express";
import { initiateUpload, finalizeUpload, getVideoDetails, getUserVideos, deleteVideo, getComments, addComment } from "../controllers/videoController.ts";
import { strictLimiter } from "../middleware/rateLimiter.ts";

const router = Router();

router.post("/upload/initiate", strictLimiter, initiateUpload);
router.post("/upload/finalize", finalizeUpload);
router.get("/", getUserVideos);
router.get("/:videoId", getVideoDetails);
router.delete("/:videoId", deleteVideo);
router.get("/:videoId/comments", getComments);
router.post("/:videoId/comments", strictLimiter, addComment);

export default router;
