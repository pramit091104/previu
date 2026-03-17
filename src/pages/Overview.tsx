import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Link } from "react-router-dom";
import Sidebar from "../components/Sidebar.tsx";
import {
  Users,
  Video,
  MessageSquare,
  HardDrive,
  Activity,
  AlertCircle,
  Clock,
  ExternalLink
} from "lucide-react";

interface OverviewStats {
  totalClients: number;
  totalVideos: number;
  totalComments: number;
  totalStorageUsed: string;
  activeNow: number;
  needsRevision: Array<{ id: string; title: string; createdAt: string }>;
  pendingReview: Array<{ id: string; title: string; createdAt: string }>;
  recentActivity: Array<{ id: string; type: string; message: string; timestamp: string }>;
}

export default function Overview() {
  const { data: stats, isLoading } = useQuery<OverviewStats>({
    queryKey: ["overview-stats"],
    queryFn: async () => {
      const { data } = await axios.get("/api/overview");
      return data;
    },
  });

  const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: any, color: string }) => (
    <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 hover:bg-zinc-900 transition-colors">
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-zinc-400 font-medium">{title}</h3>
      </div>
      <div className="text-3xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex">
      <Sidebar />

      <main className="flex-grow p-8 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold mb-2">Overview</h1>
          <p className="text-zinc-400">Here's what's happening with your projects today.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center gap-2 text-emerald-500">
            <Clock className="w-5 h-5 animate-spin" /> Fetching stats...
          </div>
        ) : stats ? (
          <div className="space-y-8">
            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <StatCard title="Total Clients" value={stats.totalClients} icon={Users} color="bg-blue-500/20" />
              <StatCard title="Total Videos" value={stats.totalVideos} icon={Video} color="bg-emerald-500/20" />
              <StatCard title="Total Comments" value={stats.totalComments} icon={MessageSquare} color="bg-purple-500/20" />
              <StatCard title="Storage Used" value={stats.totalStorageUsed} icon={HardDrive} color="bg-amber-500/20" />
              <StatCard title="Active (24h)" value={stats.activeNow} icon={Activity} color="bg-rose-500/20" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Lists */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* Needs Revision */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <h2 className="text-xl font-bold">Needs Revision</h2>
                  </div>
                  {stats.needsRevision.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No videos currently require revision. Great job!</p>
                  ) : (
                    <ul className="space-y-4">
                      {stats.needsRevision.map(video => (
                        <li key={video.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                          <div>
                            <p className="font-bold">{video.title}</p>
                            <p className="text-xs text-zinc-500">{new Date(video.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Link to={`/review/${video.id}`} className="text-emerald-500 hover:text-emerald-400 text-sm font-medium flex items-center gap-1">
                            Go to Video <ExternalLink className="w-4 h-4" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Pending Review */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-5 h-5 text-amber-500" />
                    <h2 className="text-xl font-bold">Pending Review</h2>
                  </div>
                  {stats.pendingReview.length === 0 ? (
                    <p className="text-zinc-500 text-sm">No videos are waiting for client review.</p>
                  ) : (
                    <ul className="space-y-4">
                      {stats.pendingReview.map(video => (
                        <li key={video.id} className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                          <div>
                            <p className="font-bold">{video.title}</p>
                            <p className="text-xs text-zinc-500">{new Date(video.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Link to={`/review/${video.id}`} className="text-emerald-500 hover:text-emerald-400 text-sm font-medium flex items-center gap-1">
                            Go to Video <ExternalLink className="w-4 h-4" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>

              {/* Right Column: Activity Feed */}
              <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-6">
                  <Activity className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-xl font-bold">Recent Activity</h2>
                </div>
                {stats.recentActivity.length === 0 ? (
                  <p className="text-zinc-500 text-sm">No recent activity found.</p>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                    {stats.recentActivity.map((activity, idx) => (
                      <div key={activity.id + idx} className="relative pl-6">
                        {/* Timeline line */}
                        {idx !== stats.recentActivity.length - 1 && (
                          <div className="absolute left-[11px] top-6 bottom-[-24px] w-px bg-white/10" />
                        )}
                        {/* Timeline dot */}
                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-4 border-zinc-950 flex items-center justify-center
                          ${activity.type === 'comment' ? 'bg-purple-500' : 
                            activity.type === 'upload' ? 'bg-emerald-500' : 'bg-blue-500'}`} 
                        />
                        
                        <p className="text-sm font-medium text-white mb-1 leading-snug">{activity.message}</p>
                        <p className="text-xs text-zinc-500">{new Date(activity.timestamp).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-rose-500">Failed to load statistics.</div>
        )}
      </main>
    </div>
  );
}
