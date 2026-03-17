import { Request, Response } from "express";
import { db } from "../config/firebase.ts";

export const getClients = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.uid || "anonymous";
        const snapshot = await db.collection("clients")
            .where("userId", "==", userId)
            .orderBy("createdAt", "desc")
            .get();

        const clients = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json(clients);
    } catch (error) {
        console.error("Failed to fetch clients:", error);
        res.status(500).json({ error: "Failed to fetch clients" });
    }
};

export const createClient = async (req: Request, res: Response) => {
    try {
        const { clientName, description, status, durationStart, durationEnd, totalPaymentAsked, totalPaymentGot } = req.body;
        const userId = (req as any).user?.uid || "anonymous";

        const newClient = {
            clientName,
            description,
            status: status || "pending",
            durationStart,
            durationEnd,
            totalPaymentAsked: Number(totalPaymentAsked) || 0,
            totalPaymentGot: Number(totalPaymentGot) || 0,
            userId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const docRef = await db.collection("clients").add(newClient);
        res.json({ id: docRef.id, ...newClient });
    } catch (error) {
        console.error("Failed to create client:", error);
        res.status(500).json({ error: "Failed to create client" });
    }
};

export const updateClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const userId = (req as any).user?.uid || "anonymous";

        const clientRef = db.collection("clients").doc(id);
        const clientDoc = await clientRef.get();

        if (!clientDoc.exists) {
            return res.status(404).json({ error: "Client not found" });
        }

        if (clientDoc.data()?.userId !== userId && userId !== "anonymous") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        const updatedData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };

        if (updatedData.totalPaymentAsked !== undefined) updatedData.totalPaymentAsked = Number(updatedData.totalPaymentAsked);
        if (updatedData.totalPaymentGot !== undefined) updatedData.totalPaymentGot = Number(updatedData.totalPaymentGot);

        await clientRef.update(updatedData);

        const freshDoc = await clientRef.get();
        res.json({ id: freshDoc.id, ...freshDoc.data() });
    } catch (error) {
        console.error("Failed to update client:", error);
        res.status(500).json({ error: "Failed to update client" });
    }
};

export const deleteClient = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.uid || "anonymous";

        const clientRef = db.collection("clients").doc(id);
        const clientDoc = await clientRef.get();

        if (!clientDoc.exists) {
            return res.status(404).json({ error: "Client not found" });
        }

        if (clientDoc.data()?.userId !== userId && userId !== "anonymous") {
            return res.status(403).json({ error: "Unauthorized" });
        }

        await clientRef.delete();
        res.json({ message: "Client deleted successfully" });
    } catch (error) {
        console.error("Failed to delete client:", error);
        res.status(500).json({ error: "Failed to delete client" });
    }
};
