import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { apiLimiter } from "./server/middleware/rateLimiter.ts";
import { idempotency } from "./server/middleware/idempotency.ts";
import { errorHandler } from "./server/middleware/errorHandler.ts";
import videoRoutes from "./server/routes/videoRoutes.ts";
import protectedRoutes from "./server/routes/protectedRoutes.ts";
import paymentRoutes from "./server/routes/paymentRoutes.ts";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Security Middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for development to allow Vite HMR/Assets
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(cors({
    origin: process.env.APP_URL || "*",
    credentials: true,
  }));

  app.use(express.json());
  app.use(apiLimiter);
  app.use(idempotency);

  // --- API Routes ---
  app.use("/api/videos", videoRoutes);
  app.use("/api/protected", protectedRoutes);
  app.use("/api/payments", paymentRoutes);
  
  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Placeholder for future routes
  // app.use("/api/auth", authRoutes);
  // app.use("/api/videos", videoRoutes);
  // app.use("/api/payments", paymentRoutes);

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  // Error Handler (Must be last)
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
