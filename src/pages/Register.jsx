import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaCheck, FaMars, FaVenus, FaGenderless, FaGoogle, FaRobot } from "react-icons/fa";
// Import your background component
import Background2 from "../components/Background2";

import 'katex/dist/katex.min.css';

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("other");
    const [selectedAvatar, setSelectedAvatar] = useState(1);
    const [isVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(8);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { register, googleLogin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    useEffect(() => {
        let timer;
        let interval;
        if (isVerified) {
            timer = setTimeout(() => navigate("/login"), 8000);
            interval = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
        }
        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, [isVerified, navigate]);

    const avatars = [
        { id: 1, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
        { id: 2, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
        { id: 3, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" },
        { id: 4, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max" },
        { id: 5, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Nova" },
        { id: 6, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zeta" },
    ];

    const handleRegister = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const avatarUrl = avatars.find(a => a.id === selectedAvatar).url;

            /** * CRITICAL UPDATE: 
             * We now pass all data directly to the register function. 
             * This ensures Firestore is updated BEFORE the app redirects to the Profile page.
             */
            await register(email, password, name, gender, avatarUrl);

            toast.success("Welcome to the Neural Core!");

            // Redirecting to Profile as requested
            navigate("/profile");

        } catch (err) {
            const errorMessage = err.code === 'auth/email-already-in-use'
                ? "This email is already registered."
                : (err.message || "Registration failed.");
            toast.error(errorMessage);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#05000a] overflow-x-hidden relative selection:bg-fuchsia-500/40">

            {/* Background Component Integrated Here */}
            <div className="absolute inset-0 z-0">
                <Background2 />
            </div>

            {/* Mouse Glow Overlay */}
            <div className="absolute inset-0 z-1 pointer-events-none overflow-hidden">
                <div
                    className="absolute inset-0 transition-opacity duration-300 opacity-60"
                    style={{ background: `radial-gradient(800px at ${mousePos.x}px ${mousePos.y}px, rgba(147, 51, 234, 0.2), transparent 80%)` }}
                />
            </div>

            <ToastContainer theme="dark" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: isVerified ? 0 : 1, y: isVerified ? -20 : 0 }}
                className="relative z-10 w-full max-w-6xl"
            >
                <div className="grid grid-cols-1 lg:grid-cols-12 bg-black/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden shadow-2xl">

                    {/* Left Panel */}
                    <div className="lg:col-span-5 p-8 md:p-16 bg-gradient-to-br from-purple-900/40 to-transparent flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5">
                        <div>
                            <div className="flex items-center gap-3 text-fuchsia-400 mb-6">
                                <FaRobot className="text-2xl" />
                                <span className="text-[10px] font-black tracking-[0.4em] uppercase">AI Education Partner</span>
                            </div>
                            <h1 className="text-6xl md:text-8xl font-[1000] text-white italic tracking-tighter leading-none mb-6">DHRUVA</h1>
                            <div className="space-y-4 mb-8">
                                <p className="text-white/80 text-lg font-bold leading-tight">Your personal student-friendly AI.</p>
                                <p className="text-white/50 text-sm md:text-base font-medium max-w-xs leading-relaxed italic">
                                    Dhruva simplifies complex topics, tracks your progress, and acts as a 24/7 mentor.
                                </p>
                            </div>
                        </div>

                        <div className="mt-12">
                            <p className="text-[10px] text-fuchsia-400 font-black tracking-widest mb-4 uppercase">Select Your Student Avatar</p>
                            <div className="flex flex-wrap gap-3">
                                {avatars.map(av => (
                                    <img
                                        key={av.id} src={av.url}
                                        alt={`Avatar ${av.id}`}
                                        onClick={() => setSelectedAvatar(av.id)}
                                        className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl cursor-pointer transition-all border-2 
                                        ${selectedAvatar === av.id ? 'border-fuchsia-500 bg-fuchsia-500/20 scale-110 shadow-lg shadow-fuchsia-500/40' : 'border-white/10 opacity-40 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Panel (Form) */}
                    <form onSubmit={handleRegister} className="lg:col-span-7 p-8 md:p-16 lg:p-20 bg-white/[0.01] flex flex-col gap-8 md:gap-10">
                        <div className="space-y-6">
                            <div className="relative group">
                                <FaUser className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-purple-400 transition-colors" />
                                <input
                                    type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/20 py-4 pl-10 outline-none text-white text-lg focus:border-purple-500 transition-all placeholder:text-white/40" required
                                />
                            </div>
                            <div className="relative group">
                                <FaEnvelope className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-fuchsia-400 transition-colors" />
                                <input
                                    type="email" placeholder="Student Email Address" value={email} onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/20 py-4 pl-10 outline-none text-white text-lg focus:border-fuchsia-500 transition-all placeholder:text-white/40" required
                                />
                            </div>
                            <div className="relative group">
                                <FaLock className="absolute left-0 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-violet-400 transition-colors" />
                                <input
                                    type="password" placeholder="Create Access Cipher" value={password} onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border-b border-white/20 py-4 pl-10 outline-none text-white text-lg focus:border-violet-500 transition-all placeholder:text-white/40" required
                                />
                            </div>
                        </div>

                        {/* Gender Selection */}
                        <div className="space-y-4">
                            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest ml-1">Identity Parameter</p>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'male', label: 'MALE', icon: <FaMars /> },
                                    { id: 'female', label: 'FEMALE', icon: <FaVenus /> },
                                    { id: 'other', label: 'OTHER', icon: <FaGenderless /> }
                                ].map((g) => (
                                    <button
                                        key={g.id} type="button" onClick={() => setGender(g.id)}
                                        className={`flex flex-col items-center justify-center py-4 md:py-6 rounded-3xl border-2 transition-all 
                                        ${gender === g.id ? 'bg-white text-black border-white shadow-xl shadow-white/10' : 'bg-transparent border-white/10 text-white/40 hover:border-white/30'}`}
                                    >
                                        <span className="text-xl mb-1">{g.icon}</span>
                                        <span className="text-[9px] font-black">{g.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6 pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 rounded-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white font-black text-sm tracking-[0.4em] uppercase shadow-2xl shadow-fuchsia-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {loading ? "ENROLLING..." : "START LEARNING"}
                            </button>

                            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                                <button
                                    onClick={(e) => { e.preventDefault(); googleLogin(); }}
                                    type="button"
                                    className="text-[10px] font-black text-white/40 hover:text-white transition-colors uppercase tracking-widest"
                                >
                                    <FaGoogle className="mr-2 text-fuchsia-500 inline" /> Google Auth Sync
                                </button>
                                <button onClick={() => navigate("/login")} type="button" className="text-[10px] font-black text-fuchsia-400 hover:text-white transition-colors uppercase tracking-widest underline underline-offset-4 decoration-fuchsia-500/50">
                                    Already a member? Log In
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Success Modal */}
            <AnimatePresence>
                {isVerified && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center max-w-sm">
                            <div className="w-20 h-20 bg-fuchsia-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-fuchsia-500/50 shadow-2xl">
                                <FaCheck className="text-white text-3xl" />
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight uppercase italic">Enrolled</h2>
                            <p className="text-fuchsia-400 text-[10px] font-black tracking-widest uppercase mb-8">Accessing study materials in {countdown}s</p>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
