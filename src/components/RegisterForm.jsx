import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaFingerprint, FaCheck, FaMars, FaVenus, FaGenderless, FaShieldAlt } from "react-icons/fa";

const Background2 = ({ mousePos }) => (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#05000a]">
        <div className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
            style={{ background: `radial-gradient(650px at ${mousePos.x}px ${mousePos.y}px, rgba(219, 39, 119, 0.15), transparent 80%)` }}
        />
        <div className="absolute top-[-15%] left-[-10%] w-[75%] h-[75%] bg-fuchsia-600/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[75%] h-[75%] bg-purple-900/30 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute inset-0 z-0 opacity-40"
            style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
        />
        <div className="absolute inset-0 z-20 pointer-events-none">
            <style>{`@keyframes scan { from { top: 0; } to { top: 100%; } } .animate-scan { animation: scan 3s linear infinite; }`}</style>
            <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500/30 to-transparent absolute top-0 animate-scan" />
        </div>
        <div className="absolute inset-0 z-40 opacity-[0.05] pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
);

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("other");
    const [selectedAvatar, setSelectedAvatar] = useState(1);
    const [isVerified, setIsVerified] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { register, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const handleMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
        window.addEventListener("mousemove", handleMove);
        return () => window.removeEventListener("mousemove", handleMove);
    }, []);

    const avatars = [
        { id: 1, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
        { id: 2, url: "https://api.dicebear.com/7.x/bottts/svg?seed=Alpha" },
        { id: 3, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
        { id: 4, url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Cyber" },
        { id: 5, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Luna" },
        { id: 6, url: "https://api.dicebear.com/7.x/bottts/svg?seed=Beta" },
        { id: 7, url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Max" },
        { id: 8, url: "https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon" },
    ];

    const handleRegister = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const avatarUrl = avatars.find(a => a.id === selectedAvatar).url;
            const res = await register(email, password, name, avatarUrl);

            await setDoc(doc(db, "users", res.user.uid), {
                uid: res.user.uid,
                name,
                email,
                pfp: avatarUrl,
                gender,
                board: "CBSE",
                classLevel: "10",
                createdAt: new Date()
            });

            setIsVerified(true);
            await logout(); // Prevent immediate redirect to chat

            setTimeout(() => {
                navigate("/login", { replace: true });
            }, 4000);

        } catch (err) {
            toast.error(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-10 px-4 overflow-hidden relative">
            <ToastContainer theme="dark" />
            <Background2 mousePos={mousePos} />

            {/* MODERN SUCCESS POPUP */}
            <AnimatePresence>
                {isVerified && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md"
                    >
                        {/* Party Poppers Layer */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            {[...Array(25)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 1, scale: 0, x: "50%", y: "50%" }}
                                    animate={{
                                        opacity: 0,
                                        scale: [0, 1.2, 0.5],
                                        x: `${50 + (Math.random() - 0.5) * 100}%`,
                                        y: `${50 + (Math.random() - 0.5) * 100}%`,
                                        rotate: Math.random() * 360
                                    }}
                                    transition={{ duration: 3, ease: "easeOut" }}
                                    className="absolute text-3xl"
                                >
                                    {["🎉", "✨", "🎊", "💜", "🦄"][i % 5]}
                                </motion.div>
                            ))}
                        </div>

                        {/* Modern Card */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            className="relative max-w-sm w-full bg-[#0a0a0f]/80 border border-white/10 p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                        >
                            {/* Inner Glow Decorations */}
                            <div className="absolute -top-24 -left-24 w-48 h-48 bg-fuchsia-500/20 blur-[60px] rounded-full" />
                            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 blur-[60px] rounded-full" />

                            <div className="relative z-10 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 relative">
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                        transition={{ repeat: Infinity, duration: 4 }}
                                        className="w-full h-full bg-gradient-to-tr from-fuchsia-600 to-purple-600 rounded-3xl flex items-center justify-center shadow-[0_0_30px_rgba(192,38,211,0.4)]"
                                    >
                                        <FaCheck className="text-white text-3xl" />
                                    </motion.div>
                                    <div className="absolute -inset-2 bg-fuchsia-500/20 blur-xl rounded-full animate-pulse" />
                                </div>

                                <h2 className="text-3xl font-black text-white tracking-tighter mb-2 italic">SUCCESSFULLY REGISTERED</h2>
                                <p className="text-white/50 text-sm font-medium leading-relaxed mb-8">
                                    Your identity has been verified. Welcome to the neural network.
                                </p>

                                <div className="flex items-center justify-center gap-3 py-3 px-6 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                                    <span className="text-[10px] text-fuchsia-400 font-black uppercase tracking-[0.3em]">Redirecting to Login...</span>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* REGISTRATION FORM */}
            <motion.div animate={{ opacity: isVerified ? 0 : 1, scale: isVerified ? 0.95 : 1 }} className="relative w-full max-w-lg">
                <form onSubmit={handleRegister} className="backdrop-blur-3xl bg-black/40 border border-white/10 p-8 md:p-12 rounded-[3.5rem] shadow-2xl flex flex-col gap-6">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black tracking-[0.3em] uppercase mb-2">
                            <FaFingerprint className="animate-pulse" /> Registry Node
                        </div>
                        <h2 className="text-5xl font-[1000] text-white italic tracking-tighter">ENROLL</h2>
                    </div>

                    {/* AVATAR SELECT */}
                    <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                        {avatars.map((av) => (
                            <div key={av.id} onClick={() => setSelectedAvatar(av.id)} className={`flex-shrink-0 w-14 h-14 rounded-full border-2 cursor-pointer transition-all ${selectedAvatar === av.id ? 'border-fuchsia-500 scale-110 shadow-lg shadow-fuchsia-500/50' : 'border-transparent opacity-40'}`}>
                                <img src={av.url} alt="avatar" className="rounded-full bg-black/50" />
                            </div>
                        ))}
                    </div>

                    {/* GENDER SELECT */}
                    <div className="grid grid-cols-3 gap-3">
                        {[{ id: 'male', icon: <FaMars />, label: 'M' }, { id: 'female', icon: <FaVenus />, label: 'F' }, { id: 'other', icon: <FaGenderless />, label: 'X' }].map((g) => (
                            <button key={g.id} type="button" onClick={() => setGender(g.id)} className={`py-4 rounded-2xl border flex flex-col items-center gap-1 transition-all ${gender === g.id ? 'bg-fuchsia-500/20 border-fuchsia-500 text-white' : 'border-white/5 text-white/40 hover:bg-white/5'}`}>
                                <span className="text-xl">{g.icon}</span>
                                <span className="text-[10px] font-bold">{g.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* INPUTS */}
                    <div className="space-y-3">
                        <div className="relative">
                            <FaUser className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="text" placeholder="Identity Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 pl-14 rounded-2xl outline-none text-white focus:border-fuchsia-500/50 text-sm transition-all" required />
                        </div>
                        <div className="relative">
                            <FaEnvelope className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 pl-14 rounded-2xl outline-none text-white focus:border-fuchsia-500/50 text-sm transition-all" required />
                        </div>
                        <div className="relative">
                            <FaLock className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="password" placeholder="Access Cipher" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 pl-14 rounded-2xl outline-none text-white focus:border-fuchsia-500/50 text-sm transition-all" required />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full py-4 rounded-2xl font-[1000] tracking-widest text-[10px] uppercase bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-xl shadow-fuchsia-500/20 transition-all active:brightness-90 disabled:opacity-50"
                    >
                        {loading ? "PROCESSING..." : "Initialize Identity"}
                    </motion.button>

                    <p className="text-center text-[10px] text-white/30 uppercase font-bold tracking-widest">
                        Known Entity? <span onClick={() => navigate("/login")} className="text-fuchsia-400 cursor-pointer hover:underline">Log In</span>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}