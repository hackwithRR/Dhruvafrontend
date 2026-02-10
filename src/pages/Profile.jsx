import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import { motion } from "framer-motion";
import {
    FaArrowLeft, FaSave, FaSyncAlt, FaShieldAlt,
    FaChevronDown, FaLanguage, FaEye, FaEyeSlash, FaUserCircle,
    FaGraduationCap, FaBook, FaBolt, FaDice, FaKey, FaMars, FaVenus, FaGenderless
} from "react-icons/fa";

const themes = {
    dark: {
        bg: "bg-[#000000]",
        card: "bg-[#0a0a0c] border-[#1d1d21] text-white shadow-[0_0_60px_rgba(0,0,0,0.8)]",
        input: "bg-[#141417] border-[#2a2a2f] text-white focus:border-cyan-500 focus:bg-[#1a1a1e]",
        label: "text-cyan-400 bg-[#0a0a0c]",
        accent: "text-cyan-400",
        btnGradient: "from-[#6366f1] via-[#a855f7] to-[#6366f1]",
        warnGradient: "from-[#ef4444] via-[#f97316] to-[#ef4444]",
        safeGradient: "from-[#10b981] via-[#34d399] to-[#10b981]"
    },
    light: {
        bg: "bg-[#f8fafc]",
        card: "bg-white border-[#e2e8f0] text-[#0f172a] shadow-2xl",
        input: "bg-[#ffffff] border-[#cbd5e1] text-[#0f172a] focus:border-blue-600 shadow-sm",
        label: "text-blue-600 bg-white",
        accent: "text-blue-600",
        btnGradient: "from-[#2563eb] via-[#7c3aed] to-[#2563eb]",
        warnGradient: "from-[#dc2626] via-[#ea580c] to-[#dc2626]",
        safeGradient: "from-[#059669] via-[#10b981] to-[#059669]"
    }
};

export default function Profile() {
    const { currentUser, theme, setTheme, reloadUser, logout } = useAuth();
    const navigate = useNavigate();
    const auth = getAuth();

    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [passwords, setPasswords] = useState({ oldPass: "", newPass: "" });

    const [profileData, setProfileData] = useState({
        displayName: currentUser?.displayName || "",
        board: "CBSE",
        classLevel: "10",
        language: "English",
        pfp: currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`,
        gender: "other"
    });

    const s = themes[theme] || themes.dark;
    const hasPassword = currentUser?.providerData.some(p => p.providerId === 'password');

    useEffect(() => {
        if (!currentUser?.uid) return;
        const fetchData = async () => {
            try {
                const docSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (docSnap.exists()) {
                    const d = docSnap.data();
                    setProfileData({
                        displayName: d.name || currentUser.displayName || "",
                        board: d.board || "CBSE",
                        classLevel: String(d.classLevel || d.class || "10"),
                        language: d.language || "English",
                        pfp: d.pfp || currentUser.photoURL || "",
                        gender: d.gender || "other",
                    });
                }
            } catch (err) { console.error("Fetch error:", err); }
        };
        fetchData();
    }, [currentUser]);

    const handleSave = async () => {
        if (!profileData.displayName.trim()) return toast.error("ALIAS REQUIRED");
        setLoading(true);
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                name: profileData.displayName,
                board: profileData.board,
                classLevel: profileData.classLevel,
                language: profileData.language,
                gender: profileData.gender,
                pfp: profileData.pfp,
                updatedAt: serverTimestamp()
            }, { merge: true });
            await updateProfile(auth.currentUser, { displayName: profileData.displayName, photoURL: profileData.pfp });
            if (reloadUser) await reloadUser();
            toast.success("CORE SYNCED", { icon: <FaBolt className="text-yellow-400" /> });
        } catch (e) { toast.error("SYNC FAILED"); }
        finally { setLoading(false); }
    };

    const handlePasswordUpdate = async () => {
        if (!passwords.newPass) return toast.error("NEW KEY MISSING");
        setLoading(true);
        try {
            if (hasPassword) {
                const cred = EmailAuthProvider.credential(currentUser.email, passwords.oldPass);
                await reauthenticateWithCredential(auth.currentUser, cred);
                await updatePassword(auth.currentUser, passwords.newPass);
            } else {
                const credential = EmailAuthProvider.credential(currentUser.email, passwords.newPass);
                await linkWithCredential(auth.currentUser, credential);
            }
            toast.success("SECURITY UPDATED");
            setPasswords({ oldPass: "", newPass: "" });
            if (reloadUser) await reloadUser();
        } catch (e) { toast.error(e.message); }
        finally { setLoading(false); }
    };

    return (
        <div className={`min-h-screen transition-colors duration-500 pb-20 ${s.bg}`}>
            <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
            <ToastContainer position="top-right" theme={theme === 'dark' ? 'dark' : 'light'} />

            <main className="max-w-5xl mx-auto pt-10 sm:pt-20 px-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[40px] p-8 sm:p-14 border relative overflow-hidden ${s.card}`}
                >
                    <motion.button
                        whileHover={{ x: -5, backgroundColor: theme === 'dark' ? '#ffffff' : '#0f172a', color: theme === 'dark' ? '#000000' : '#ffffff' }}
                        onClick={() => navigate("/chat")}
                        className={`absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest z-30 transition-colors ${s.input}`}
                    >
                        <FaArrowLeft /> Return_Hub
                    </motion.button>

                    <div className="flex flex-col items-center mt-12 mb-16">
                        <div className="relative group">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 15, ease: "linear" }} className="absolute -inset-4 border-2 border-dashed border-cyan-500/30 rounded-full" />
                            <div className="relative p-1.5 rounded-[35%] bg-gradient-to-tr from-cyan-500 to-indigo-600 shadow-2xl">
                                <img src={profileData.pfp} className="w-32 h-32 sm:w-40 sm:h-40 rounded-[34%] object-cover bg-black" alt="PFP" />
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 180 }}
                                    onClick={() => setProfileData({ ...profileData, pfp: `https://api.dicebear.com/7.x/bottts/svg?seed=${Math.random()}` })}
                                    className="absolute -bottom-2 -right-2 bg-white text-black p-3 rounded-xl shadow-xl border-4 border-black"
                                >
                                    <FaDice className="text-xl" />
                                </motion.button>
                            </div>
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-black italic tracking-tighter mt-6 uppercase">User<span className={s.accent}>.</span>Meta</h1>
                    </div>

                    <div className="space-y-10">
                        <div className="relative group">
                            <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[10px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Neural Alias</span>
                            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40"><FaUserCircle /></div>
                            <input type="text" value={profileData.displayName} onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                className={`w-full p-5 pl-14 rounded-2xl border-2 outline-none font-bold text-lg transition-all ${s.input}`} />
                        </div>

                        <div className="relative">
                            <span className={`absolute -top-3 left-6 px-3 py-1 text-[9px] font-black uppercase rounded-full z-20 border tracking-widest ${s.label}`}>Orientation_Key</span>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { id: 'male', label: 'MALE', icon: <FaMars /> },
                                    { id: 'female', label: 'FEMALE', icon: <FaVenus /> },
                                    { id: 'other', label: 'NEUTRAL', icon: <FaGenderless /> }
                                ].map((g) => (
                                    <button key={g.id} onClick={() => setProfileData({ ...profileData, gender: g.id })}
                                        className={`flex items-center justify-center gap-3 py-4 rounded-2xl border-2 transition-all font-black text-xs tracking-widest 
                                        ${profileData.gender === g.id ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg' : 'bg-transparent opacity-40 border-slate-700 hover:opacity-100'}`}
                                    >
                                        {g.icon} {g.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Manual rendering to avoid mapping errors with complex objects */}
                            <div className="relative group">
                                <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[9px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Board</span>
                                <FaBook className="absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-40 pointer-events-none" />
                                <select value={profileData.board} onChange={(e) => setProfileData({ ...profileData, board: e.target.value })}
                                    className={`w-full p-5 pl-14 rounded-2xl border-2 outline-none font-black appearance-none cursor-pointer transition-all ${s.input}`}>
                                    <option value="CBSE">CBSE</option>
                                    <option value="ICSE">ICSE</option>
                                </select>
                                <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none" />
                            </div>

                            <div className="relative group">
                                <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[9px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Grade</span>
                                <FaGraduationCap className="absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-40 pointer-events-none" />
                                <select value={profileData.classLevel} onChange={(e) => setProfileData({ ...profileData, classLevel: e.target.value })}
                                    className={`w-full p-5 pl-14 rounded-2xl border-2 outline-none font-black appearance-none cursor-pointer transition-all ${s.input}`}>
                                    {['8', '9', '10', '11', '12'].map(n => <option key={n} value={n} className="bg-black">Class {n}</option>)}
                                </select>
                                <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none" />
                            </div>

                            <div className="relative group">
                                <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[9px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Language</span>
                                <FaLanguage className="absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-40 pointer-events-none" />
                                <select value={profileData.language} onChange={(e) => setProfileData({ ...profileData, language: e.target.value })}
                                    className={`w-full p-5 pl-14 rounded-2xl border-2 outline-none font-black appearance-none cursor-pointer transition-all ${s.input}`}>
                                    <option value="English">English</option>
                                    <option value="Hinglish">Hinglish</option>
                                </select>
                                <FaChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 opacity-20 pointer-events-none" />
                            </div>
                        </div>

                        <motion.button
                            onClick={handleSave} disabled={loading}
                            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            style={{ backgroundSize: "200% 200%" }}
                            className={`w-full py-6 rounded-3xl text-white font-black text-sm uppercase tracking-[0.4em] shadow-xl flex items-center justify-center gap-4 bg-gradient-to-r ${s.btnGradient}`}
                        >
                            {loading ? <FaSyncAlt className="animate-spin" /> : <FaSave className="text-xl" />} Sync_Changes
                        </motion.button>
                    </div>

                    <div className="mt-20 pt-10 border-t border-white/10">
                        <div className="flex items-center gap-4 mb-8">
                            <FaShieldAlt className={`text-2xl ${hasPassword ? 'text-orange-500' : 'text-emerald-500'}`} />
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] opacity-50">Security Protocol</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-5 max-w-xl mx-auto">
                            {hasPassword && (
                                <input type="password" placeholder="CURRENT ACCESS KEY" value={passwords.oldPass} onChange={(e) => setPasswords({ ...passwords, oldPass: e.target.value })}
                                    className={`w-full p-5 rounded-2xl border-2 outline-none font-black text-[11px] tracking-widest ${s.input}`} />
                            )}
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} placeholder={hasPassword ? "NEW SECURITY HASH" : "INITIALIZE NEW KEY"} value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                                    className={`w-full p-5 rounded-2xl border-2 outline-none font-black text-[11px] tracking-widest ${s.input}`} />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-40 hover:opacity-100">
                                    {showPass ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                onClick={handlePasswordUpdate} disabled={loading}
                                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                style={{ backgroundSize: "200% 200%" }}
                                className={`w-full py-5 rounded-2xl text-white font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 bg-gradient-to-r ${hasPassword ? s.warnGradient : s.safeGradient}`}
                            >
                                {loading ? <FaSyncAlt className="animate-spin" /> : <FaKey />} {hasPassword ? "Reset_Hash" : "Establish_Node"}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
