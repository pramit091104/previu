import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.tsx";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2 } from "lucide-react";

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
    const { login, signup } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await signup(email, password);
            }
            onClose();
        } catch (err: any) {
            setError(err.message || "Authentication failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md p-8 overflow-hidden border bg-zinc-950 border-white/10 rounded-3xl"
                    >
                        <button
                            onClick={onClose}
                            className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="mb-2 text-3xl font-bold">
                            {isLogin ? "Welcome back" : "Create an account"}
                        </h2>
                        <p className="mb-8 text-zinc-400">
                            {isLogin
                                ? "Enter your credentials to access your account."
                                : "Sign up to start reviewing and sharing videos."}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-500/20 rounded-lg">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block mb-2 text-sm font-medium text-zinc-300">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-white/5 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block mb-2 text-sm font-medium text-zinc-300">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-white/5 rounded-xl focus:outline-none focus:border-emerald-500/50 transition-colors"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 mt-6 text-black transition-all bg-emerald-500 rounded-xl hover:bg-emerald-400 font-bold flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>{isLogin ? "Sign In" : "Sign Up"}</>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <button
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-sm text-zinc-400 hover:text-white transition-colors"
                            >
                                {isLogin
                                    ? "Don't have an account? Sign up"
                                    : "Already have an account? Sign in"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
