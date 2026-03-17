import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
const bucketName = process.env.GCS_BUCKET_NAME || "previu_videos";

if (!projectId || !clientEmail || !privateKey) {
    console.error("Missing Firebase credentials in .env");
    process.exit(1);
}

admin.initializeApp({
    credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
    }),
    storageBucket: bucketName
});

const bucket = admin.storage().bucket();

async function configureCors() {
    try {
        console.log(`Setting CORS for bucket: ${bucketName}`);

        // GCS requires setting the CORS configuration array
        await bucket.setCorsConfiguration([
            {
                origin: ["*"], // allow all origins for dev, or specify localhost
                method: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD"],
                responseHeader: ["Content-Type", "Authorization", "x-goog-resumable", "x-goog-resumable-id", "Location"],
                maxAgeSeconds: 3600,
            },
        ]);

        console.log("✅ CORS successfully configured for bucket.");
    } catch (error) {
        console.error("❌ Failed to configure CORS:", error);
    }
}

configureCors();
