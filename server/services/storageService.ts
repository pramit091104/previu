import gcs, { bucketName } from "../config/gcs.ts";
import { v4 as uuidv4 } from "uuid";

export const initiateResumableUpload = async (fileName: string, contentType: string, userId: string, origin: string) => {
  if (!gcs) throw new Error("GCS not initialized");

  const bucket = gcs.bucket(bucketName);
  const blobName = `uploads/${userId}/${uuidv4()}-${fileName}`;
  const file = bucket.file(blobName);

  // Initiate a resumable upload session on the server side
  // This returns a session URI that the browser can PUT to directly (no CORS preflight)
  const [sessionUri] = await file.createResumableUpload({
    origin,
    metadata: {
      contentType,
    },
  });

  return { sessionUri, blobName };
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
