import { useState } from "react";
import { motion } from "motion/react";
import { Check, Play } from "lucide-react";
import { useAuth } from "../context/AuthContext.tsx";
import { Link } from "react-router-dom";
import AuthModal from "../components/AuthModal.tsx";

export default function Pricing() {
  const { user } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  const tiers = [
    {
      name: "Free",
      price: "0",
      features: ["5GB Storage", "720p Transcoding", "3 Review Links", "Basic Comments"],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Pro",
      price: "29",
      features: ["50GB Storage", "1080p Transcoding", "Unlimited Review Links", "Timestamped Comments", "Custom Branding"],
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Enterprise",
      price: "99",
      features: ["500GB Storage", "4K Transcoding", "SSO Integration", "Advanced Security", "Dedicated Support"],
      cta: "Contact Sales",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-emerald-500/30">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-8 py-6 border-b border-white/5">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <Play className="w-5 h-5 text-black fill-current" />
          </div>
          <span className="text-xl font-bold tracking-tight">VidiReview</span>
        </Link>
        <div className="flex items-center gap-8">
          <Link to="/pricing" className="text-sm text-emerald-500 font-medium">Pricing</Link>
          {user ? (
            <Link to="/dashboard" className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">
              Dashboard
            </Link>
          ) : (
            <button onClick={() => setIsAuthOpen(true)} className="bg-white text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-200 transition-colors">
              Get Started
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-24 px-8">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Simple, transparent pricing.</h2>
          <p className="text-zinc-400 text-lg">Choose the plan that's right for your workflow.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className={`p-8 rounded-3xl border ${tier.popular ? 'border-emerald-500 bg-emerald-500/5' : 'border-white/5 bg-zinc-900/50'} flex flex-col`}
            >
              {tier.popular && (
                <span className="bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full w-fit mb-4">MOST POPULAR</span>
              )}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-4xl font-bold">${tier.price}</span>
                <span className="text-zinc-400">/month</span>
              </div>
              <ul className="space-y-4 mb-12 flex-grow">
                {tier.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3 text-zinc-300">
                    <Check className="w-5 h-5 text-emerald-500" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (!user) {
                    setIsAuthOpen(true);
                  }
                }}
                className={`w-full py-4 rounded-full font-bold transition-all ${tier.popular ? 'bg-emerald-500 text-black hover:bg-emerald-400' : 'bg-white text-black hover:bg-zinc-200'}`}
              >
                {tier.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
