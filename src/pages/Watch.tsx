import React, { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Hls from "hls.js";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { motion, AnimatePresence } from "motion/react";
import { Send, CheckCircle, XCircle, MessageSquare, Clock, ArrowLeft } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Comment {
  id: string;
  text: string;
  timestamp: number;
  userId: string;
  createdAt: string;
  userName?: string;
  userPhoto?: string;
}

export default function Watch() {
  const { videoId } = useParams<{ videoId: string }>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const [commentText, setCommentText] = useState("");
  const queryClient = useQueryClient();

  const { data: video, isLoading } = useQuery({
    queryKey: ["video", videoId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/videos/${videoId}`);
      return data;
    },
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      const { data } = await axios.get(`/api/videos/${videoId}/comments`);
      return data as Comment[];
    },
  });

  useEffect(() => {
    if (!videoRef.current || !video?.hlsPath) return;

    const videoElement = videoRef.current;
    const hlsUrl = `/api/protected/stream/${videoId}/playlist.m3u8`;

    const defaultOptions: Plyr.Options = {
      controls: [
        "play-large", "play", "progress", "current-time", "mute", "volume", "captions", "settings", "pip", "airplay", "fullscreen"
      ],
      settings: ["quality", "speed"],
      quality: {
        default: 720,
        options: [720, 480, 360],
      },
    };

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(hlsUrl);
      hls.attachMedia(videoElement);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        playerRef.current = new Plyr(videoElement, defaultOptions);
      });
    } else if (videoElement.canPlayType("application/vnd.apple.mpegurl")) {
      videoElement.src = hlsUrl;
      playerRef.current = new Plyr(videoElement, defaultOptions);
    }

    return () => {
      playerRef.current?.destroy();
    };
  }, [video, videoId]);

  const addCommentMutation = useMutation({
    mutationFn: async (newComment: { text: string; timestamp: number }) => {
      const { data } = await axios.post(`/api/videos/${videoId}/comments`, newComment);
      return data as Comment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", videoId] });
      setCommentText("");
    },
    onError: (error) => {
      console.error("Failed to add comment:", error);
      alert("Failed to add comment. Please try again.");
    }
  });

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !playerRef.current) return;

    addCommentMutation.mutate({
      text: commentText,
      timestamp: playerRef.current.currentTime,
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white">Loading review session...</div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col lg:flex-row">
      {/* Video Player Section */}
      <div className="flex-grow p-4 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-1">{video?.title || "Untitled Review"}</h1>
              <p className="text-zinc-400 text-sm">Reviewing: {video?.originalName}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 bg-zinc-900 border border-white/10 px-4 py-2 rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
                <XCircle className="w-4 h-4 text-red-500" />
                Reject
              </button>
              <button className="flex items-center gap-2 bg-emerald-500 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-emerald-400 transition-colors">
                <CheckCircle className="w-4 h-4" />
                Approve
              </button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-white/5 bg-black shadow-2xl">
            <video ref={videoRef} className="w-full aspect-video" crossOrigin="anonymous" playsInline />
          </div>

          {/* Comment Input */}
          <form onSubmit={handleAddComment} className="mt-8 relative">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a timestamped comment..."
              className="w-full bg-zinc-900 border border-white/10 rounded-2xl px-6 py-4 pr-16 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={addCommentMutation.isPending}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-500 rounded-xl text-black hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>

      {/* Sidebar - Comments */}
      <div className="w-full lg:w-96 bg-zinc-900/50 border-l border-white/5 flex flex-col h-screen lg:sticky lg:top-0">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="font-bold flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            Comments ({comments.length})
          </h2>
          <select className="bg-transparent text-xs text-zinc-400 border-none focus:ring-0">
            <option>Newest First</option>
            <option>Timestamp</option>
          </select>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <AnimatePresence initial={false}>
            {comments.map((comment) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 bg-zinc-900 border border-white/5 rounded-2xl hover:border-emerald-500/30 transition-colors cursor-pointer group"
                onClick={() => {
                  if (playerRef.current) playerRef.current.currentTime = comment.timestamp;
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatTime(comment.timestamp)}
                  </span>
                  <span className="text-[10px] text-zinc-500 uppercase tracking-wider">
                    {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-sm text-zinc-300 leading-relaxed">{comment.text}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
