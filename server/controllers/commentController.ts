import { Request, Response } from "express";
import { db } from "../config/firebase.ts";

export const getAllComments = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.uid || "anonymous";

    // 1. Get all videos that belong to this user
    const videosSnapshot = await db.collection("videos").where("userId", "==", userId).get();
    
    if (videosSnapshot.empty) {
      return res.json([]);
    }

    const allComments: any[] = [];

    // 2. Extract videos into a map of ID -> Title for quick referencing
    const videoMap = new Map();
    videosSnapshot.docs.forEach(doc => {
      videoMap.set(doc.id, doc.data().title);
    });

    // 3. For each video, query its comments subcollection
    // We run these queries in parallel using Promise.all
    const commentPromises = videosSnapshot.docs.map(videoDoc => 
      db.collection("videos").doc(videoDoc.id).collection("comments").get()
    );

    const commentSnapshots = await Promise.all(commentPromises);

    // 4. Flatten the subcollection results into a single array
    commentSnapshots.forEach((snap, index) => {
      const videoId = videosSnapshot.docs[index].id;
      const videoTitle = videoMap.get(videoId);

      snap.docs.forEach(commentDoc => {
        const data = commentDoc.data();
        allComments.push({
          id: commentDoc.id,
          videoId,
          videoTitle,
          text: data.text,
          author: data.author || "Unknown",
          createdAt: data.createdAt,
          timestamp: data.timestamp || 0 // Optional video timestamp playhead
        });
      });
    });

    // 5. Sort comments by createdAt (newest first)
    allComments.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    res.json(allComments);
  } catch (error) {
    console.error("Failed to fetch all comments:", error);
    res.status(500).json({ error: "Failed to fetch all comments" });
  }
};
