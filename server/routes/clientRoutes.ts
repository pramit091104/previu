import { Router } from "express";
import { getClients, createClient, updateClient, deleteClient } from "../controllers/clientController.ts";
import { strictLimiter } from "../middleware/rateLimiter.ts";

const router = Router();

router.get("/", getClients);
router.post("/", strictLimiter, createClient);
router.put("/:id", strictLimiter, updateClient);
router.delete("/:id", deleteClient);

export default router;
