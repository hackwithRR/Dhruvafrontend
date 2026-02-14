import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaLockOpen, FaShieldAlt, FaGoogle, FaFingerprint } from "react-icons/fa";

export default function LoginForm({ setPage }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const { login, googleLogin, resetPassword } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            triggerSuccess();
        } catch (err) {
            toast.error("❌ Access Denied: " + err.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await googleLogin();
            triggerSuccess();
        } catch (err) {
            toast.error("❌ Auth Failed: " + err.message);
        }
    };

    const triggerSuccess = () => {
        setIsSuccess(true);
        // 5 second delay before navigation as requested
        setTimeout(() => {
            navigate("/chat");
        }, 5000);
    };

    return (
        <>
            {/* 1. CRAZY SUCCESS OVERLAY */}
            <AnimatePresence>
                {isSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl"
                    >
                        <div className="text-center">
                            <motion.div
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", damping: 10 }}
                                className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_50px_rgba(59,130,246,0.5)]"
                            >
                                <FaLockOpen className="text-white text-4xl" />
                            </motion.div>

                            <motion.h2
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-4xl font-black text-white tracking-tighter italic"
                            >
                                ACCESS GRANTED
                            </motion.h2>

                            <motion.div
                                className="mt-4 h-1 bg-white/10 w-64 mx-auto rounded-full overflow-hidden"
                            >
                                <motion.div
                                    initial={{ x: "-100%" }}
                                    animate={{ x: "0%" }}
                                    transition={{ duration: 4.5, ease: "linear" }}
                                    className="h-full bg-blue-500 shadow-[0_0_15px_#3b82f6]"
                                />
                            </motion.div>

                            <p className="mt-2 text-blue-400 font-mono text-xs tracking-widest animate-pulse">
                                INITIALIZING NEURAL LINK...
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 2. THE FORM */}
            <motion.form
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={handleLogin}
                className="relative flex flex-col gap-5 backdrop-blur-3xl bg-black/40 border border-white/10 p-10 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden group"
            >
                {/* Animated Background Line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />

                <div className="text-center space-y-2">
                    <h2 className="text-4xl font-[1000] text-white italic tracking-tighter">Anthariksh_AI</h2>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.4em] font-bold">Secure Terminal Login</p>
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="System Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                            required
                        />
                        <FaShieldAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    </div>

                    <div className="relative">
                        <input
                            type="password"
                            placeholder="Access Key"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-white/[0.03] border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-blue-500/50 transition-all placeholder:text-white/10"
                            required
                        />
                        <FaFingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                    </div>
                </div>

                <button
                    type="submit"
                    className="group relative w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl overflow-hidden transition-all shadow-lg shadow-blue-500/20"
                >
                    <span className="relative z-10 tracking-widest text-xs">ESTABLISH CONNECTION</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:animate-[shine_1.5s_infinite]" />
                </button>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="flex items-center justify-center gap-3 w-full py-3 bg-white/5 border border-white/10 text-white text-[10px] font-bold rounded-xl hover:bg-white/10 transition-all uppercase tracking-widest"
                >
                    <FaGoogle className="text-red-500" /> Google Sync
                </button>

                <div className="flex justify-between items-center mt-2">
                    <button
                        type="button"
                        onClick={() => resetPassword(email)}
                        className="text-[10px] text-white/20 hover:text-blue-400 transition-colors uppercase font-bold"
                    >
                        Lost Cipher?
                    </button>
                    <p className="text-[10px] text-white/20 uppercase font-bold">
                        New?{" "}
                        <span
                            className="text-blue-400 cursor-pointer hover:underline"
                            onClick={() => navigate("/register")}
                        >
                            Register Node
                        </span>
                    </p>
                </div>
            </motion.form>
        </>
    );
}