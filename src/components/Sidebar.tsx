import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.tsx";
import { Video, LayoutGrid, Users, Activity, List, LogOut, MessageSquare } from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: "/overview", icon: Activity, label: "Overview" },
    { path: "/dashboard", icon: LayoutGrid, label: "Library" },
    { path: "/clients", icon: Users, label: "Clients" },
    { path: "/comments", icon: MessageSquare, label: "Comments" },
  ];

  return (
    <aside className="w-64 border-r border-white/5 p-6 flex flex-col h-screen sticky top-0">
      <Link to="/" className="flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
          <Video className="w-5 h-5 text-black fill-current" />
        </div>
        <span className="text-xl font-bold tracking-tight">Previu</span>
      </Link>

      <nav className="flex-grow space-y-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${isActive
                  ? "bg-emerald-500/10 text-emerald-500"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-white/5">
        <div className="flex items-center gap-3 mb-6 px-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full bg-zinc-800" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold text-sm">
              {user?.email?.[0].toUpperCase() || "U"}
            </div>
          )}
          <div className="flex-grow min-w-0">
            <p className="text-sm font-medium truncate">{user?.displayName || "User"}</p>
            <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Pro Plan</p>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/5 rounded-xl transition-all">
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
