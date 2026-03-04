import { Router, Request, Response } from "express";
import gcs, { bucketName } from "../config/gcs.ts";
import { verifyAuth } from "../middleware/auth.ts";

const router = Router();

/**
 * Proxy for HLS segments and playlists.
 * This obfuscates the GCS URL and allows us to check permissions before serving.
 */
router.get("/stream/:videoId/:file", async (req: Request, res: Response) => {
  try {
    const { videoId, file } = req.params;
    // In a real app, we'd check if the user has permission to view this videoId
    // For now, we assume if they have the link and are authed (optional depending on video privacy)
    
    // For HLS segments (.ts), we might want to skip heavy auth for performance
    // but for the playlist (.m3u8), we definitely check.
    
    const blobPath = `processed/anonymous/${videoId}/${file}`; // Hardcoded 'anonymous' for demo, should be dynamic
    const bucket = gcs!.bucket(bucketName);
    const blob = bucket.file(blobPath);

    const [exists] = await blob.exists();
    if (!exists) {
      return res.status(404).json({ error: "Segment not found" });
    }

    // Set appropriate headers
    if (file.endsWith(".m3u8")) {
      res.setHeader("Content-Type", "application/x-mpegURL");
    } else if (file.endsWith(".ts")) {
      res.setHeader("Content-Type", "video/MP2T");
    }

    // Pipe the stream directly from GCS to the response
    blob.createReadStream().pipe(res);
  } catch (error) {
    console.error("Streaming Error:", error);
    res.status(500).json({ error: "Failed to stream video" });
  }
});

export default router;
