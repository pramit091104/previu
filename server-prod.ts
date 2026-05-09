import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { apiLimiter } from "./server/middleware/rateLimiter.ts";
import { idempotency } from "./server/middleware/idempotency.ts";
import { errorHandler } from "./server/middleware/errorHandler.ts";
import videoRoutes from "./server/routes/videoRoutes.ts";
import protectedRoutes from "./server/routes/protectedRoutes.ts";
import paymentRoutes from "./server/routes/paymentRoutes.ts";
import clientRoutes from "./server/routes/clientRoutes.ts";
import overviewRoutes from "./server/routes/overviewRoutes.ts";
import commentRoutes from "./server/routes/commentRoutes.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(
  helmet({
    contentSecurityPolicy: true,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS — allow only your Vercel frontend
const allowedOrigins = (process.env.APP_URL || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
      if (!origin) return callback(null, true);
      // Allow any Vercel preview deployment for this project
      if (origin.match(/^https:\/\/previu.*\.vercel\.app$/)) {
        return callback(null, true);
      }
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(apiLimiter);
app.use(idempotency);

// API Routes
app.use("/api/videos", videoRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/comments", commentRoutes);

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error Handler (must be last)
app.use(errorHandler);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
});
