import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit2, Briefcase } from "lucide-react";
import Sidebar from "../components/Sidebar.tsx";

interface ClientData {
    id: string;
    clientName: string;
    description: string;
    status: "pending" | "ongoing" | "done";
    durationStart: string;
    durationEnd: string;
    totalPaymentAsked: number;
    totalPaymentGot: number;
    createdAt: string;
}

export default function Clients() {
    const { user, logout } = useAuth();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<ClientData | null>(null);

    const [formData, setFormData] = useState({
        clientName: "",
        description: "",
        status: "pending",
        durationStart: "",
        durationEnd: "",
        totalPaymentAsked: "",
        totalPaymentGot: ""
    });

    const { data: clients, isLoading } = useQuery({
        queryKey: ["clients"],
        queryFn: async () => {
            const { data } = await axios.get("/api/clients");
            return data as ClientData[];
        },
    });

    const createMutation = useMutation({
        mutationFn: async (newClient: any) => {
            const { data } = await axios.post("/api/clients", newClient);
            return data as ClientData;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            closeModal();
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string, data: any }) => {
            const resp = await axios.put(`/api/clients/${id}`, data);
            return resp.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
            closeModal();
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`/api/clients/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            totalPaymentAsked: Number(formData.totalPaymentAsked),
            totalPaymentGot: Number(formData.totalPaymentGot)
        };

        if (editingClient) {
            updateMutation.mutate({ id: editingClient.id, data: payload });
        } else {
            createMutation.mutate(payload);
        }
    };

    const openModal = (client?: ClientData) => {
        if (client) {
            setEditingClient(client);
            setFormData({
                clientName: client.clientName,
                description: client.description,
                status: client.status,
                durationStart: client.durationStart || "",
                durationEnd: client.durationEnd || "",
                totalPaymentAsked: client.totalPaymentAsked.toString(),
                totalPaymentGot: client.totalPaymentGot.toString()
            });
        } else {
            setEditingClient(null);
            setFormData({
                clientName: "",
                description: "",
                status: "pending",
                durationStart: "",
                durationEnd: "",
                totalPaymentAsked: "",
                totalPaymentGot: ""
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Delete this client?")) {
            deleteMutation.mutate(id);
        }
    };

    const statusBadge = (status: string) => {
        const colors = {
            pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
            ongoing: "bg-blue-500/10 text-blue-500 border-blue-500/20",
            done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${colors[status as keyof typeof colors]}`}>
                {status}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex">
            <Sidebar />

            {/* Main Content */}
            <main className="flex-grow p-8">
                <header className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Clients</h1>
                        <p className="text-zinc-400">Manage client information, project status, and payments.</p>
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold hover:bg-emerald-400 transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
                    >
                        <Plus className="w-5 h-5" />
                        New Client
                    </button>
                </header>

                {isLoading ? (
                    <div>Loading...</div>
                ) : (
                    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-wider">
                                    <th className="p-6 font-medium">Client</th>
                                    <th className="p-6 font-medium">Status</th>
                                    <th className="p-6 font-medium">Duration</th>
                                    <th className="p-6 font-medium text-right">Payment Status</th>
                                    <th className="p-6 font-medium text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clients?.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-zinc-500">
                                            No clients found. Add one to get started.
                                        </td>
                                    </tr>
                                )}
                                {clients?.map(client => (
                                    <tr key={client.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                        <td className="p-6">
                                            <div className="font-bold text-white mb-1 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-emerald-500" />
                                                {client.clientName}
                                            </div>
                                            <div className="text-sm text-zinc-400 max-w-xs truncate">{client.description}</div>
                                        </td>
                                        <td className="p-6">
                                            {statusBadge(client.status)}
                                        </td>
                                        <td className="p-6">
                                            <div className="text-sm text-zinc-300">
                                                {client.durationStart ? new Date(client.durationStart).toLocaleDateString() : 'N/A'} -
                                                {client.durationEnd ? new Date(client.durationEnd).toLocaleDateString() : 'N/A'}
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="font-bold text-white">${client.totalPaymentGot}</div>
                                            <div className="text-xs text-zinc-500">of ${client.totalPaymentAsked}</div>
                                            <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                                                <div
                                                    className="bg-emerald-500 h-full"
                                                    style={{ width: `${Math.min(100, (client.totalPaymentGot / (client.totalPaymentAsked || 1)) * 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-6 text-right">
                                            <div className="flex items-center gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => openModal(client)} className="p-2 text-zinc-500 hover:text-emerald-400 bg-zinc-800 rounded-lg">
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => handleDelete(client.id)} className="p-2 text-zinc-500 hover:text-red-400 bg-zinc-800 rounded-lg">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-xl shadow-2xl"
                        >
                            <h2 className="text-2xl font-bold mb-6">{editingClient ? "Edit Client" : "Add New Client"}</h2>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Client Name</label>
                                    <input required type="text" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Work Description</label>
                                    <textarea required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white resize-none" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Status</label>
                                        <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white appearance-none">
                                            <option value="pending">Pending</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="done">Done</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Payment Asked ($)</label>
                                        <input required type="number" min="0" value={formData.totalPaymentAsked} onChange={e => setFormData({ ...formData, totalPaymentAsked: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Duration Start</label>
                                        <input type="date" value={formData.durationStart} onChange={e => setFormData({ ...formData, durationStart: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-1">Duration End</label>
                                        <input type="date" value={formData.durationEnd} onChange={e => setFormData({ ...formData, durationEnd: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-1">Payment Received ($)</label>
                                    <input required type="number" min="0" value={formData.totalPaymentGot} onChange={e => setFormData({ ...formData, totalPaymentGot: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" />
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={closeModal} className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl font-bold transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="flex-1 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold transition-colors disabled:opacity-50">
                                        {editingClient ? "Save Changes" : "Create Client"}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
