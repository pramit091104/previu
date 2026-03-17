import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log("✅ Firebase Admin Initialized");
  } else {
    console.warn("⚠️ Firebase Admin credentials missing. Some features may not work.");
  }
}

export const db = admin.apps.length > 0 ? admin.firestore() : null as any;
export const auth = admin.apps.length > 0 ? admin.auth() : null as any;
export const storage = admin.apps.length > 0 ? admin.storage() : null as any;
