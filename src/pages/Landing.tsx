import { useAuth } from "../context/AuthContext.tsx";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Play, Shield, Users, Zap } from "lucide-react";

export default function Landing() {
  const { user, login } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">VidiReview</span>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/pricing" className="text-sm text-zinc-400 hover:text-white transition-colors">Pricing</Link>
          {user ? (
            <Link to="/dashboard" className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">
              Dashboard
            </Link>
          ) : (
            <button onClick={login} className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">
              Get Started
            </button>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 pt-24 pb-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h1 className="text-6xl md:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            Video review for <span className="text-emerald-500">professionals.</span>
          </h1>
          <p className="text-xl text-zinc-400 mb-12 leading-relaxed">
            The fastest way to share, review, and approve video content. 
            Built for scale with enterprise-grade security and HLS streaming.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button onClick={login} className="bg-emerald-500 text-black px-8 py-4 rounded-full text-lg font-semibold hover:bg-emerald-400 transition-all hover:scale-105">
              Start Reviewing Free
            </button>
            <Link to="/pricing" className="bg-zinc-900 border border-white/10 px-8 py-4 rounded-full text-lg font-semibold hover:bg-zinc-800 transition-all">
              View Pricing
            </Link>
          </div>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32">
          {[
            { icon: Shield, title: "Content Protection", desc: "HLS encryption and signed URLs prevent unauthorized downloads." },
            { icon: Zap, title: "Instant Transcoding", desc: "Automated FFmpeg pipeline converts your uploads to adaptive streams." },
            { icon: Users, title: "Team Collaboration", desc: "Timestamped comments and approval workflows for seamless feedback." }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="p-8 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-emerald-500/30 transition-colors group"
            >
              <feature.icon className="w-10 h-10 text-emerald-500 mb-6 group-hover:scale-110 transition-transform" />
              <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
