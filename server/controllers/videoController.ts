import { Request, Response } from "express";
import { db } from "../config/firebase.ts";
import { generateResumableUploadUrl } from "../services/storageService.ts";
import { transcodeToHLS } from "../services/videoProcessor.ts";
import gcs, { bucketName } from "../config/gcs.ts";

export const initiateUpload = async (req: Request, res: Response) => {
  try {
    const { fileName, contentType, title } = req.body;
    const userId = (req as any).user?.uid || "anonymous"; // In real app, get from auth middleware

    const { url, blobName } = await generateResumableUploadUrl(fileName, contentType, userId);

    const videoRef = await db.collection("videos").add({
      title,
      originalName: fileName,
      userId,
      status: "pending_upload",
      blobName,
      createdAt: new Date(),
      updatedAt: new Date(),
      viewCount: 0,
      approvalStatus: "pending"
    });

    res.json({
      uploadUrl: url,
      videoId: videoRef.id,
      blobName
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to initiate upload" });
  }
};

export const finalizeUpload = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;
    const videoRef = db.collection("videos").doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoData = videoDoc.data()!;
    const bucket = gcs!.bucket(bucketName);
    const file = bucket.file(videoData.blobName);

    const [exists] = await file.exists();
    if (!exists) {
      return res.status(400).json({ error: "File not found in storage" });
    }

    // Trigger background transcoding
    // In a production app, this would be pushed to a Redis queue (BullMQ)
    // For this demo, we'll run it as a detached promise to not block the response
    const tempInputPath = `/tmp/${videoId}_input`;
    await file.download({ destination: tempInputPath });
    
    transcodeToHLS(videoId, tempInputPath, videoData.userId).finally(() => {
      // Cleanup temp input file
      // fs.unlinkSync(tempInputPath);
    });

    res.json({ message: "Upload finalized. Processing started.", videoId });
  } catch (error) {
    res.status(500).json({ error: "Failed to finalize upload" });
  }
};

export const getVideoDetails = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const videoDoc = await db.collection("videos").doc(videoId).get();

    if (!videoDoc.exists) {
      return res.status(404).json({ error: "Video not found" });
    }

    res.json({ id: videoDoc.id, ...videoDoc.data() });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch video details" });
  }
};
