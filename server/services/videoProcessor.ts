import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import path from "path";
import fs from "fs";
import os from "os";
import { db } from "../config/firebase.ts";
import gcs, { bucketName } from "../config/gcs.ts";

if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

export const transcodeToHLS = async (videoId: string, inputPath: string, userId: string) => {
  const videoRef = db.collection("videos").doc(videoId);
  
  try {
    await videoRef.update({ status: "processing", updatedAt: new Date() });

    const outputDir = path.join(os.tmpdir(), videoId);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const playlistPath = path.join(outputDir, "playlist.m3u8");

    // FFmpeg command for HLS transcoding
    // We use a basic 720p profile for this example. 
    // In a real production app, we'd generate multiple variants for ABR.
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          "-profile:v baseline",
          "-level 3.0",
          "-start_number 0",
          "-hls_time 10",
          "-hls_list_size 0",
          "-f hls"
        ])
        .output(playlistPath)
        .on("start", (cmd) => console.log("FFmpeg started:", cmd))
        .on("progress", (progress) => {
          videoRef.update({ progress: Math.round(progress.percent || 0) });
        })
        .on("error", (err) => {
          console.error("FFmpeg Error:", err);
          reject(err);
        })
        .on("end", () => {
          console.log("FFmpeg finished transcoding");
          resolve(true);
        })
        .run();
    });

    // Upload HLS files to GCS
    const files = fs.readdirSync(outputDir);
    const bucket = gcs!.bucket(bucketName);
    
    await Promise.all(
      files.map((file) => 
        bucket.upload(path.join(outputDir, file), {
          destination: `processed/${userId}/${videoId}/${file}`,
          metadata: { cacheControl: "public, max-age=3600" }
        })
      )
    );

    // Cleanup local files
    fs.rmSync(outputDir, { recursive: true, force: true });

    await videoRef.update({
      status: "completed",
      hlsPath: `processed/${userId}/${videoId}/playlist.m3u8`,
      updatedAt: new Date(),
      progress: 100
    });

  } catch (error) {
    console.error("Transcoding Job Failed:", error);
    await videoRef.update({ status: "failed", error: "Transcoding failed", updatedAt: new Date() });
  }
};

export const analyzeVideo = async (inputPath: string) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputPath, (err, metadata) => {
      if (err) reject(err);
      else resolve(metadata);
    });
  });
};
