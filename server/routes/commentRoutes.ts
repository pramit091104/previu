import { Router } from "express";
import { getAllComments } from "../controllers/commentController.ts";

const router = Router();

router.get("/all", getAllComments);

export default router;
