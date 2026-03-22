import { Router } from "express";
import { initiateUpload, finalizeUpload, getVideoDetails, getUserVideos, deleteVideo, getComments, addComment, updateVideoStatus } from "../controllers/videoController.ts";
import { strictLimiter } from "../middleware/rateLimiter.ts";

const router = Router();

router.post("/upload/initiate", strictLimiter, initiateUpload);
router.post("/upload/finalize", finalizeUpload);
router.get("/", getUserVideos);
router.get("/:videoId", getVideoDetails);
router.delete("/:videoId", deleteVideo);
router.get("/:videoId/comments", getComments);
router.post("/:videoId/comments", strictLimiter, addComment);
router.put("/:videoId/status", updateVideoStatus);

export default router;
