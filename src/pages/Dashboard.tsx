import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import {
  Upload,
  Video,
  MoreVertical,
  ExternalLink,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  X
} from "lucide-react";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar.tsx";

interface VideoData {
  id: string;
  title: string;
  originalName: string;
  status: "pending_upload" | "processing" | "completed" | "failed";
  createdAt: string;
  viewCount: number;
  approvalStatus: "pending" | "approved" | "rejected";
  progress?: number;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    clientName: "",
    description: ""
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Fetch clients to populate the dropdown
  const { data: clients } = useQuery({
    queryKey: ["clients"],
    queryFn: async () => {
      const { data } = await axios.get("/api/clients");
      return data;
    },
  });

  const { data: videos, isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const { data } = await axios.get("/api/videos");
      return data as VideoData[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/videos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
    onError: (error) => {
      console.error("Delete failed:", error);
      alert("Failed to delete video.");
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this video?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleUploadClick = () => {
    setUploadData({ title: "", clientName: "", description: "" });
    setIsUploadModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadModalOpen(false);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Initiate upload on backend (server creates the resumable session)
      const { data: initData } = await axios.post("/api/videos/upload/initiate", {
        fileName: file.name,
        contentType: file.type,
        title: uploadData.title || file.name,
        clientName: uploadData.clientName,
        description: uploadData.description
      });

      // 2. Upload file directly to the session URI (simple PUT, no CORS preflight)
      await axios.put(initData.sessionUri, file, {
        headers: { "Content-Type": file.type },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(percentCompleted);
        },
      });

      // 3. Finalize upload on backend
      await axios.post("/api/videos/upload/finalize", {
        videoId: initData.videoId,
      });

      queryClient.invalidateQueries({ queryKey: ["videos"] });
      setIsUploading(false);
    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      alert("Upload failed. There was an error finalizing the video upload.");
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "processing": return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-grow p-8">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Library</h1>
            <p className="text-zinc-400">Manage your projects and review links.</p>
          </div>
          <button
            onClick={handleUploadClick}
            className="flex items-center gap-2 bg-emerald-500 text-black px-6 py-3 rounded-full font-bold hover:bg-emerald-400 transition-all hover:scale-105 shadow-lg shadow-emerald-500/20"
          >
            <Plus className="w-5 h-5" />
            New Upload
          </button>
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept="video/*" />
        </header>

        {/* Custom Upload Modal */}
        <AnimatePresence>
          {isUploadModalOpen && (
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
                className="bg-zinc-900 border border-white/10 rounded-3xl p-8 w-full max-w-lg shadow-2xl relative"
              >
                <button
                  onClick={() => setIsUploadModalOpen(false)}
                  className="absolute right-6 top-6 text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
                <h2 className="text-2xl font-bold mb-6">Upload Video</h2>

                <form onSubmit={handleModalSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Video Title <span className="text-red-500">*</span></label>
                    <input required type="text" value={uploadData.title} onChange={e => setUploadData({ ...uploadData, title: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Client Name <span className="text-red-500">*</span></label>
                    <input required type="text" value={uploadData.clientName} onChange={e => setUploadData({ ...uploadData, clientName: e.target.value })} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white" placeholder="E.g. Apple Inc..." />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Video Description <span className="text-red-500">*</span></label>
                    <textarea required value={uploadData.description} onChange={e => setUploadData({ ...uploadData, description: e.target.value })} rows={3} className="w-full bg-black border border-white/5 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 text-white resize-none" />
                  </div>

                  <button type="submit" className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-bold transition-colors mt-4">
                    Select File & Upload
                  </button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload Progress Overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-8 right-8 w-96 bg-zinc-900 border border-emerald-500/30 p-6 rounded-3xl shadow-2xl z-50"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-emerald-500" />
                  Uploading Video...
                </h3>
                <span className="text-sm font-bold text-emerald-500">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-emerald-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500 mt-3">Don't close this tab until upload is complete.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Video Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {videos?.map((video) => (
            <motion.div
              key={video.id}
              layout
              className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden hover:border-emerald-500/30 transition-all group"
            >
              <div className="aspect-video bg-zinc-800 relative flex items-center justify-center group-hover:bg-zinc-700 transition-colors">
                <Video className="w-12 h-12 text-zinc-600 group-hover:scale-110 transition-transform" />
                <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-2">
                  {statusIcon(video.status)}
                  {video.status.toUpperCase()}
                </div>
                {video.status === "completed" && (
                  <Link
                    to={`/watch/${video.id}`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-sm"
                  >
                    <div className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Open Review
                    </div>
                  </Link>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg mb-1 truncate max-w-[200px]">{video.title}</h3>
                    <p className="text-zinc-500 text-xs">{video.originalName}</p>
                  </div>
                  <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-zinc-500" />
                  </button>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Views</p>
                      <p className="text-sm font-bold">{video.viewCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Approval</p>
                      <p className={`text-sm font-bold ${video.approvalStatus === 'approved' ? 'text-emerald-500' : 'text-zinc-400'}`}>
                        {video.approvalStatus.charAt(0).toUpperCase() + video.approvalStatus.slice(1)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(video.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
