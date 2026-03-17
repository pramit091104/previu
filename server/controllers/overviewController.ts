import { Request, Response } from "express";
import { db } from "../config/firebase.ts";
import gcs, { bucketName } from "../config/gcs.ts";

export const getOverviewStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid || "anonymous";

    // 1. Total Clients
    const clientsSnapshot = await db.collection("clients")
      .where("userId", "==", userId)
      .get();
    const totalClients = clientsSnapshot.size;

    // 2. Total Videos & Aggregating Metrics directly from Videos
    const videosSnapshot = await db.collection("videos")
      .where("userId", "==", userId)
      .get();
    
    const totalVideos = videosSnapshot.size;
    let totalStorageUsedBytes = 0;
    
    const needsRevision: any[] = [];
    const pendingReview: any[] = [];
    
    // Recent Activity Feed
    const recentActivity: any[] = [];
    let totalComments = 0;

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let activeNow = 0;

    for (const doc of videosSnapshot.docs) {
      const videoData = doc.data();
      const videoId = doc.id;

      // Status arrays
      if (videoData.approvalStatus === "needs_revision") {
        needsRevision.push({ id: videoId, title: videoData.title, createdAt: videoData.createdAt });
      } else if (videoData.approvalStatus === "pending") {
        pendingReview.push({ id: videoId, title: videoData.title, createdAt: videoData.createdAt });
      }

      // Check Activity (views/updates in last 24h)
      // If we don't have a distinct lastViewedAt yet, we approximate with updatedAt
      const lastActive = videoData.lastViewedAt || videoData.updatedAt || videoData.createdAt;
      // handle firestore timestamp vs string gracefully
      const activeDateStr = lastActive?.toDate ? lastActive.toDate().toISOString() : new Date(lastActive).toISOString();
      if (activeDateStr >= oneDayAgo) {
        activeNow++;
      }

      // Activity: Uploads
      const createdDateStr = videoData.createdAt?.toDate ? videoData.createdAt.toDate().toISOString() : new Date(videoData.createdAt).toISOString();
      recentActivity.push({
        id: `upload-${videoId}`,
        type: "upload",
        message: `Uploaded video: ${videoData.title}`,
        timestamp: createdDateStr
      });

      // Total Comments & Comment Activity
      const commentsSnapshot = await db.collection("videos").doc(videoId).collection("comments").get();
      totalComments += commentsSnapshot.size;

      commentsSnapshot.docs.forEach(cDoc => {
        const commentData = cDoc.data();
        recentActivity.push({
          id: `comment-${cDoc.id}`,
          type: "comment",
          message: `New comment on ${videoData.title}: "${commentData.text}"`,
          timestamp: new Date(commentData.createdAt || Date.now()).toISOString()
        });
      });
    }

    // 3. Storage Used (GCS)
    try {
      if (gcs) {
        const bucket = gcs.bucket(bucketName);
        const [files] = await bucket.getFiles({ prefix: `uploads/${userId}/` });
        const [processedFiles] = await bucket.getFiles({ prefix: `processed/${userId}/` });
        
        [...files, ...processedFiles].forEach(file => {
          totalStorageUsedBytes += parseInt(file.metadata.size?.toString() || "0", 10);
        });
      }
    } catch (e) {
      console.warn("Could not fetch storage size from GCS", e);
    }

    // Client Creation Activity
    clientsSnapshot.docs.forEach(doc => {
      const clientData = doc.data();
      recentActivity.push({
        id: `client-${doc.id}`,
        type: "client",
        message: `Added new client: ${clientData.clientName}`,
        timestamp: new Date(clientData.createdAt || Date.now()).toISOString()
      });
    });

    // Sort and limit recent activity
    recentActivity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const latestActivity = recentActivity.slice(0, 10);

    // Sort lists
    needsRevision.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    pendingReview.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({
      totalClients,
      totalVideos,
      totalComments,
      totalStorageUsed: formatBytes(totalStorageUsedBytes),
      activeNow,
      needsRevision: needsRevision.slice(0, 5),
      pendingReview: pendingReview.slice(0, 5),
      recentActivity: latestActivity
    });

  } catch (error) {
    console.error("Failed to fetch overview stats:", error);
    res.status(500).json({ error: "Failed to fetch overview stats" });
  }
};

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
