import React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { MessageSquare, ExternalLink, Video } from "lucide-react";
import Sidebar from "../components/Sidebar.tsx";

interface CommentData {
  id: string;
  videoId: string;
  videoTitle: string;
  text: string;
  author: string;
  createdAt: string;
  timestamp: number;
}

export default function Comments() {
  const { data: comments, isLoading, error } = useQuery({
    queryKey: ["all-comments"],
    queryFn: async () => {
      const { data } = await axios.get("/api/comments/all");
      return data as CommentData[];
    },
  });

  const formatVideoTimestamp = (seconds: number) => {
    if (!seconds) return "";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `@${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <Sidebar />

      <main className="flex-grow p-8 overflow-y-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold mb-2">All Comments</h1>
          <p className="text-zinc-400">Review feedback across all your videos in one place.</p>
        </header>

        {isLoading ? (
          <div className="text-emerald-500 animate-pulse font-medium">Loading comments...</div>
        ) : error ? (
          <div className="text-red-500">Failed to load comments.</div>
        ) : (
          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="p-6 font-medium">Comment</th>
                  <th className="p-6 font-medium">Video</th>
                  <th className="p-6 font-medium">Date</th>
                  <th className="p-6 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {comments?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">
                      No comments found. Share your videos to get feedback!
                    </td>
                  </tr>
                ) : (
                  comments?.map((comment) => (
                    <tr key={comment.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                      <td className="p-6 w-1/2">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 w-8 h-8 rounded-full bg-purple-500/20 text-purple-500 flex items-center justify-center font-bold text-sm shrink-0">
                            {comment.author[0]?.toUpperCase() || "A"}
                          </div>
                          <div>
                            <p className="font-bold text-white mb-1">
                              {comment.author}
                              {comment.timestamp > 0 && (
                                <span className="ml-2 text-xs font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                                  {formatVideoTimestamp(comment.timestamp)}
                                </span>
                              )}
                            </p>
                            <p className="text-zinc-300 text-sm">{comment.text}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                          <Video className="w-4 h-4 text-emerald-500" />
                          <span className="truncate max-w-[200px]">{comment.videoTitle}</span>
                        </div>
                      </td>
                      <td className="p-6 text-sm text-zinc-500 whitespace-nowrap">
                        {new Date(comment.createdAt).toLocaleDateString()}{" "}
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-6 text-right">
                        <Link
                          to={`/watch/${comment.videoId}`}
                          className="inline-flex items-center justify-center p-2 text-zinc-500 hover:text-emerald-400 bg-zinc-800 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          title="View on Video"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
