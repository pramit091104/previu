import gcs, { bucketName } from "../config/gcs.ts";
import { v4 as uuidv4 } from "uuid";

export const generateResumableUploadUrl = async (fileName: string, contentType: string, userId: string) => {
  if (!gcs) throw new Error("GCS not initialized");

  const bucket = gcs.bucket(bucketName);
  const blobName = `uploads/${userId}/${uuidv4()}-${fileName}`;
  const file = bucket.file(blobName);

  // Generate a signed URL for resumable upload
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "write",
    expires: Date.now() + 60 * 60 * 1000, // 1 hour
    contentType,
    extensionHeaders: {
      "x-goog-resumable": "start",
    },
  });

  return { url, blobName };
};

export const getSignedDownloadUrl = async (blobName: string) => {
  if (!gcs) throw new Error("GCS not initialized");

  const bucket = gcs.bucket(bucketName);
  const file = bucket.file(blobName);

  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
  });

  return url;
};
