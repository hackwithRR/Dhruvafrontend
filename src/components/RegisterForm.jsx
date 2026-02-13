import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock, FaFingerprint, FaMars, FaVenus, FaGenderless } from "react-icons/fa";

const Background2 = ({ mousePos }) => (
    <div className="fixed inset-0 -z-50 overflow-hidden bg-[#05000a]">
        <div className="pointer-events-none absolute inset-0 z-10"
            style={{ background: `radial-gradient(650px at ${mousePos.x}px ${mousePos.y}px, rgba(219, 39, 119, 0.15), transparent 80%)` }}
        />
        <div className="absolute top-[-15%] left-[-10%] w-[75%] h-[75%] bg-fuchsia-600/20 blur-[120px] rounded-full" />
        <div className="absolute inset-0 z-0 opacity-40"
            style={{ backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
        />
    </div>
);

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [gender, setGender] = useState("other");
    const [selectedAvatar, setSelectedAvatar] = useState(1);
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    const { register } = useAuth();
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
    ];

    const handleRegister = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const avatarUrl = avatars.find(a => a.id === selectedAvatar).url;

            // 1. Create User in Firebase Auth
            const res = await register(email, password, name, avatarUrl);

            // 2. Immediate Firestore Write (Setting defaults for Class 8)
            await setDoc(doc(db, "users", res.user.uid), {
                uid: res.user.uid,
                name,
                email,
                pfp: avatarUrl,
                gender,
                board: "CBSE",
                classLevel: "8",
                language: "English",
                xp: 0,
                streak: 0,
                theme: "DeepSpace",
                createdAt: serverTimestamp()
            });

            // 3. Instant Redirect to Chat
            navigate("/chat", { replace: true });

        } catch (err) {
            toast.error(err.message);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-10 px-4 relative overflow-hidden">
            <ToastContainer theme="dark" />
            <Background2 mousePos={mousePos} />

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative w-full max-w-lg">
                <form onSubmit={handleRegister} className="backdrop-blur-3xl bg-black/40 border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl flex flex-col gap-6">
                    <div className="text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[9px] font-black tracking-[0.3em] uppercase mb-2">
                            <FaFingerprint /> Registration Node
                        </div>
                        <h2 className="text-5xl font-[1000] text-white italic tracking-tighter">ENROLL</h2>
                    </div>

                    <div className="flex justify-center gap-4">
                        {avatars.map((av) => (
                            <img
                                key={av.id} src={av.url}
                                onClick={() => setSelectedAvatar(av.id)}
                                className={`w-12 h-12 rounded-full cursor-pointer transition-all ${selectedAvatar === av.id ? 'ring-2 ring-fuchsia-500 scale-110 shadow-[0_0_15px_rgba(217,70,239,0.5)]' : 'opacity-30'}`}
                                alt="avatar"
                            />
                        ))}
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="text" placeholder="Identity Name" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-fuchsia-500/50" required />
                        </div>
                        <div className="relative">
                            <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-fuchsia-500/50" required />
                        </div>
                        <div className="relative">
                            <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                            <input type="password" placeholder="Access Cipher" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-white/5 border border-white/10 p-4 pl-12 rounded-xl text-white outline-none focus:border-fuchsia-500/50" required />
                        </div>
                    </div>

                    <button disabled={loading} className="w-full py-4 rounded-xl font-black bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white uppercase tracking-widest active:scale-95 transition-all">
                        {loading ? "PROCESSING..." : "Initialize Identity"}
                    </button>

                    <p className="text-center text-[10px] text-white/30 uppercase font-bold tracking-widest">
                        Known Entity? <span onClick={() => navigate("/login")} className="text-fuchsia-400 cursor-pointer hover:underline">Log In</span>
                    </p>
                </form>
            </motion.div>
        </div>
    );
}
