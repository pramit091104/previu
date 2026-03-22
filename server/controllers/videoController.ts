import { Request, Response } from "express";
import { db } from "../config/firebase.ts";
import { initiateResumableUpload } from "../services/storageService.ts";
import { transcodeToHLS } from "../services/videoProcessor.ts";
import gcs, { bucketName } from "../config/gcs.ts";
import path from "path";
import os from "os";

export const initiateUpload = async (req: Request, res: Response) => {
  try {
    const { fileName, contentType, title, clientName, description } = req.body;
    const userId = (req as any).user?.uid || "anonymous"; // In real app, get from auth middleware
    const origin = req.headers.origin || "http://localhost:3000";

    const { sessionUri, blobName } = await initiateResumableUpload(fileName, contentType, userId, origin);
    
    if (clientName) {
      const clientSnapshot = await db.collection("clients")
        .where("userId", "==", userId)
        .where("clientName", "==", clientName)
        .limit(1)
        .get();

      if (clientSnapshot.empty) {
        await db.collection("clients").add({
          clientName,
          description: "Auto-created from video upload",
          status: "pending",
          durationStart: "",
          durationEnd: "",
          totalPaymentAsked: 0,
          totalPaymentGot: 0,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }

    const videoRef = await db.collection("videos").add({
      title,
      clientName: clientName || "",
      description: description || "",
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
      sessionUri,
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
    const tempInputPath = path.join(os.tmpdir(), `${videoId}_input`);
    await file.download({ destination: tempInputPath });

    transcodeToHLS(videoId, tempInputPath, videoData.userId).finally(() => {
      // Cleanup temp input file
      // fs.unlinkSync(tempInputPath);
    });

    res.json({ message: "Upload finalized. Processing started.", videoId });
  } catch (error) {
    console.error("Finalize upload error: ", error);
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

export const getUserVideos = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid || "anonymous"; // Match initiateUpload behavior
    const videosSnapshot = await db.collection("videos")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const videos = videosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(videos);
  } catch (error) {
    console.error("Failed to fetch user videos:", error);
    res.status(500).json({ error: "Failed to fetch user videos" });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const userId = (req as any).user?.uid || "anonymous";

    const videoRef = db.collection("videos").doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      return res.status(404).json({ error: "Video not found" });
    }

    const videoData = videoDoc.data()!;

    // Authorization check
    if (videoData.userId !== userId && userId !== "anonymous") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Delete from Firestore
    await videoRef.delete();

    // Delete from GCS (Original Video)
    if (gcs && videoData.blobName) {
      const bucket = gcs.bucket(bucketName);
      try {
        await bucket.file(videoData.blobName).delete();
      } catch (err) {
        console.warn(`Original video blob ${videoData.blobName} not found or failed to delete.`);
      }

      // Delete HLS output folder
      try {
        await bucket.deleteFiles({ prefix: `hls/${videoId}/` });
      } catch (err) {
        console.warn(`HLS folder for ${videoId} failed to delete.`);
      }
    }

    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Failed to delete video:", error);
    res.status(500).json({ error: "Failed to delete video" });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const commentsSnapshot = await db.collection("videos").doc(videoId).collection("comments").orderBy("timestamp", "asc").get();

    const comments = commentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(comments);
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

export const addComment = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { text, timestamp } = req.body;
    const userId = (req as any).user?.uid || "anonymous";
    const userName = (req as any).user?.displayName || "Anonymous User";
    const userPhoto = (req as any).user?.photoURL || "";

    const newComment = {
      text,
      timestamp,
      userId,
      userName,
      userPhoto,
      createdAt: new Date().toISOString()
    };

    const commentRef = await db.collection("videos").doc(videoId).collection("comments").add(newComment);

    res.json({ id: commentRef.id, ...newComment });
  } catch (error) {
    console.error("Failed to add comment:", error);
    res.status(500).json({ error: "Failed to add comment" });
  }
};

export const updateVideoStatus = async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const { status } = req.body;
    
    if (!["approved", "needs_revision", "pending"].includes(status)) {
      return res.status(400).json({ error: "Invalid status value" });
    }

    const videoRef = db.collection("videos").doc(videoId);
    const videoDoc = await videoRef.get();

    if (!videoDoc.exists) {
      return res.status(404).json({ error: "Video not found" });
    }

    await videoRef.update({
      approvalStatus: status,
      updatedAt: new Date()
    });

    res.json({ message: "Video status updated", status });
  } catch (error) {
    console.error("Failed to update video status:", error);
    res.status(500).json({ error: "Failed to update video status" });
  }
};
