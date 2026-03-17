import { Storage } from "@google-cloud/storage";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing GCP credentials in .env");
    process.exit(1);
}

const storage = new Storage({
    projectId,
    credentials: {
        client_email: clientEmail,
        private_key: privateKey,
    },
});

const bucketName = process.env.GCS_BUCKET_NAME || "previu_videos";

async function configureBucketCors() {
    await storage.bucket(bucketName).setCorsConfiguration([
        {
            maxAgeSeconds: 3600,
            method: ["GET", "PUT", "POST", "DELETE", "HEAD", "OPTIONS"],
            origin: ["*"], // allow all origins for dev
            responseHeader: ["Content-Type", "Authorization", "x-goog-resumable", "Origin", "Accept", "*"],
        },
    ]);

    console.log(`Bucket ${bucketName} was updated with a CORS config
      to allow GET, PUT, POST, DELETE, HEAD, OPTIONS
      for all origins.`);
}

configureBucketCors().catch(console.error);
