import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let gcs: Storage | null = null;

if (projectId && clientEmail && privateKey) {
  gcs = new Storage({
    projectId,
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
  });
  console.log("✅ Google Cloud Storage Initialized");
} else {
  console.warn("⚠️ GCS credentials missing. Uploads will fail.");
}

export const bucketName = process.env.GCS_BUCKET_NAME || "";
export default gcs;
