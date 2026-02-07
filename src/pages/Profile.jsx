import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../utils/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { getAuth, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaArrowLeft, FaSave, FaSyncAlt, FaShieldAlt,
    FaChevronDown, FaLanguage, FaEye, FaEyeSlash, FaUserCircle,
    FaGraduationCap, FaBook, FaBolt, FaTerminal,
    FaMars, FaVenus, FaGenderless, FaDice, FaKey
} from "react-icons/fa";

// --- Custom Select Component ---
const ModernSelect = ({ label, value, options, onChange, icon: Icon, s, theme }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="relative group w-full">
            <span className={`absolute -top-2 left-5 px-3 py-0.5 text-[8px] sm:text-[9px] font-black uppercase rounded-full z-20 border border-white/10 tracking-widest ${s.label}`}>
                {label}
            </span>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border flex items-center justify-between transition-all duration-300 ${s.input} group-hover:scale-[1.01] ${isOpen ? 'ring-4 ring-indigo-500/20 border-indigo-500 shadow-xl' : ''}`}
            >
                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                    {Icon && <Icon className={`text-lg sm:text-xl shrink-0 transition-colors ${isOpen ? 'text-indigo-500' : 'opacity-30'}`} />}
                    <span className="font-bold text-xs sm:text-sm uppercase tracking-wide truncate">{value}</span>
                </div>
                <FaChevronDown className={`shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-indigo-500' : 'opacity-30'}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 5, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className={`absolute left-0 right-0 z-[70] border border-white/10 rounded-[24px] sm:rounded-[30px] overflow-hidden shadow-2xl ${theme === 'dark' ? 'bg-[#121212]' : 'bg-white'}`}
                        >
                            <div className="max-h-[250px] overflow-y-auto">
                                {options.map((opt) => (
                                    <button key={opt.value} type="button"
                                        onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                        className={`w-full p-4 sm:p-5 text-left text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-colors border-b border-white/5 last:border-none ${theme === 'dark' ? 'hover:bg-indigo-600 text-white/70 hover:text-white' : 'hover:bg-indigo-50 text-slate-600'}`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Profile() {
    const { currentUser, theme, setTheme, reloadUser, logout } = useAuth();
    const navigate = useNavigate();
    const auth = getAuth();

    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState({ old: false, new: false });
    const [passwords, setPasswords] = useState({ oldPass: "", newPass: "" });
    const [profileData, setProfileData] = useState({
        displayName: currentUser?.displayName || "",
        board: "CBSE",
        classLevel: "10",
        language: "English",
        pfp: currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`,
        gender: "other"
    });

    // Check if user has a password provider linked
    const hasPassword = currentUser?.providerData.some(p => p.providerId === 'password');
    const isGoogleUserOnly = currentUser?.providerData.length === 1 && currentUser?.providerData[0].providerId === 'google.com';

    const avatarStyles = [
        "adventurer", "avataaars", "bottts", "big-smile", "miniavs", "open-peeps",
        "pixel-art", "lorelei", "micah", "notionists", "rings", "shapes",
        "thumbs", "croodles", "fun-emoji", "icons", "identicon", "initials"
    ];

    const themes = {
        dark: {
            bg: "bg-[#020205] text-white",
            card: "bg-white/[0.02] border-white/10 backdrop-blur-3xl",
            input: "bg-white/[0.04] border-white/10 text-white focus:bg-white/[0.08]",
            label: "text-indigo-400 bg-[#020205]",
            btn: "bg-gradient-to-r from-indigo-600 to-purple-600",
            accent: "text-indigo-500",
            mesh: "opacity-40"
        },
        light: {
            bg: "bg-[#F8FAFF] text-[#1E293B]",
            card: "bg-white border-slate-200 shadow-xl",
            input: "bg-slate-50 border-slate-200 text-slate-900 focus:bg-white",
            label: "text-blue-600 bg-[#F8FAFF]",
            btn: "bg-gradient-to-r from-blue-600 to-indigo-600",
            accent: "text-blue-600",
            mesh: "opacity-10"
        }
    };

    const s = themes[theme] || themes.dark;

    useEffect(() => {
        if (!currentUser?.uid) return;
        const fetchData = async () => {
            try {
                const docSnap = await getDoc(doc(db, "users", currentUser.uid));
                if (docSnap.exists()) {
                    const d = docSnap.data();
                    setProfileData(prev => ({
                        ...prev,
                        displayName: d.name || currentUser.displayName || "",
                        board: d.board || "CBSE",
                        classLevel: d.class || d.classLevel || "10",
                        language: d.language || "English",
                        pfp: d.pfp || currentUser.photoURL || prev.pfp,
                        gender: d.gender || "other", // Fixed: Ensuring gender syncs from DB
                    }));
                }
            } catch (err) {
                console.error("Neural Link Fetch Error:", err);
            }
        };
        fetchData();
    }, [currentUser]);

    const handleSave = async () => {
        if (!profileData.displayName.trim()) return toast.error("ENTER ALIAS");
        setLoading(true);
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                name: profileData.displayName,
                board: profileData.board,
                class: profileData.classLevel,
                language: profileData.language,
                gender: profileData.gender,
                pfp: profileData.pfp,
                lastSync: new Date()
            }, { merge: true });

            await updateProfile(auth.currentUser, {
                displayName: profileData.displayName,
                photoURL: profileData.pfp
            });

            await reloadUser();
            toast.success("CORE UPDATED", { icon: <FaBolt className="text-yellow-400" /> });
        } catch (e) { toast.error("SYNC FAILED"); }
        finally { setLoading(false); }
    };

    const handlePasswordUpdate = async () => {
        if (!passwords.newPass) return toast.error("NEW KEY MISSING");
        if (passwords.newPass.length < 6) return toast.error("KEY TOO WEAK (MIN 6)");
        
        setLoading(true);
        try {
            if (hasPassword) {
                // Change existing password
                const cred = EmailAuthProvider.credential(currentUser.email, passwords.oldPass);
                await reauthenticateWithCredential(auth.currentUser, cred);
                await updatePassword(auth.currentUser, passwords.newPass);
                toast.success("SECURITY RESET SUCCESSFUL");
            } else {
                // Set password for the first time (Google Link)
                const credential = EmailAuthProvider.credential(currentUser.email, passwords.newPass);
                await linkWithCredential(auth.currentUser, credential);
                toast.success("PASSWORD NODE ESTABLISHED");
            }
            setPasswords({ oldPass: "", newPass: "" });
            await reloadUser();
        } catch (e) { 
            toast.error(e.code === 'auth/wrong-password' ? "INVALID CURRENT KEY" : e.message); 
        }
        finally { setLoading(false); }
    };

    return (
        <div className={`min-h-screen transition-colors duration-700 relative pb-20 ${s.bg}`}>
            <Navbar currentUser={currentUser} theme={theme} setTheme={setTheme} logout={logout} />
            <ToastContainer position="top-right" theme={theme === 'dark' ? 'dark' : 'light'} />

            <div className={`fixed inset-0 pointer-events-none ${s.mesh} overflow-hidden`}>
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/20 blur-[120px] rounded-full" />
            </div>

            <main className="max-w-4xl mx-auto pt-16 sm:pt-24 px-4 sm:px-6 relative z-10">
                <div className="flex justify-center sm:justify-start mb-8 sm:mb-12 opacity-40">
                    <div className="flex items-center gap-3 text-[10px] font-black tracking-[0.3em] uppercase border-l-2 border-indigo-500 pl-4">
                        <FaTerminal />
                        <span>Core Node: {currentUser?.uid?.substring(0, 12)}</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-[40px] sm:rounded-[60px] p-6 sm:p-16 border shadow-2xl ${s.card}`}
                >
                    <div className="flex flex-col items-center sm:flex-row gap-8 sm:gap-12 mb-16 sm:mb-20">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 group-hover:opacity-40 transition-opacity" />
                            <div className="relative p-1 rounded-[38%] bg-gradient-to-br from-indigo-500 via-purple-500 to-fuchsia-500">
                                <img src={profileData.pfp} className="w-32 h-32 sm:w-44 sm:h-44 rounded-[37%] object-cover bg-black" alt="PFP" />
                                <button
                                    onClick={() => setProfileData({ ...profileData, pfp: `https://api.dicebear.com/7.x/${avatarStyles[Math.floor(Math.random() * avatarStyles.length)]}/svg?seed=${Math.random()}` })}
                                    className="absolute -bottom-2 -right-2 bg-indigo-600 text-white p-3 sm:p-4 rounded-2xl sm:rounded-3xl shadow-xl hover:scale-110 active:scale-95 transition-all"
                                >
                                    <FaDice className="text-sm sm:text-lg" />
                                </button>
                            </div>
                        </div>
                        <div className="text-center sm:text-left">
                            <h1 className="text-4xl sm:text-7xl font-black italic uppercase tracking-tighter mb-2 leading-tight">
                                User<span className={s.accent}>.</span>Meta
                            </h1>
                            <p className="text-[9px] sm:text-[11px] font-black opacity-30 tracking-[0.4em] uppercase">Configuration & Neural Identity</p>
                        </div>
                    </div>

                    <div className="mb-16">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40 text-center sm:text-left px-2">Expansion Packs</p>
                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
                            {avatarStyles.slice(0, 12).map((style) => (
                                <button
                                    key={style}
                                    onClick={() => setProfileData({ ...profileData, pfp: `https://api.dicebear.com/7.x/${style}/svg?seed=${profileData.displayName || 'seed'}` })}
                                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl border-2 p-1 transition-all ${profileData.pfp.includes(style) ? 'border-indigo-500 bg-indigo-500/10 scale-110' : 'border-white/5 opacity-40 hover:opacity-100'}`}
                                >
                                    <img src={`https://api.dicebear.com/7.x/${style}/svg?seed=${profileData.displayName || 'preview'}`} alt="" />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-8 sm:space-y-12">
                        <div className="relative group">
                            <span className={`absolute -top-2 left-5 px-3 py-0.5 text-[9px] font-black uppercase rounded-full z-20 border border-white/10 tracking-widest ${s.label}`}>Neural Alias</span>
                            <FaUserCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-xl sm:text-2xl opacity-20" />
                            <input
                                type="text"
                                value={profileData.displayName}
                                onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                className={`w-full p-5 sm:p-6 pl-14 sm:pl-16 rounded-[20px] sm:rounded-[24px] border outline-none font-bold text-base sm:text-lg transition-all ${s.input}`}
                            />
                        </div>

                        <div className="relative">
                            <span className={`absolute -top-3 left-5 px-3 py-1 text-[9px] font-black uppercase rounded-full z-20 border border-white/10 tracking-widest ${s.label}`}>Biological Orientation</span>
                            <div className={`grid grid-cols-3 gap-3 sm:gap-5 p-2 sm:p-3 rounded-[28px] sm:rounded-[32px] border ${theme === 'dark' ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-100/30'}`}>
                                {[
                                    { id: 'male', label: 'MALE', icon: <FaMars />, color: 'text-blue-400' },
                                    { id: 'female', label: 'FEMALE', icon: <FaVenus />, color: 'text-pink-400' },
                                    { id: 'other', label: 'NEUTRAL', icon: <FaGenderless />, color: 'text-indigo-400' }
                                ].map((g) => (
                                    <button key={g.id} type="button" onClick={() => setProfileData({ ...profileData, gender: g.id })}
                                        className={`flex flex-col items-center py-4 sm:py-6 rounded-[20px] sm:rounded-[24px] transition-all duration-300 border ${profileData.gender === g.id ? `${theme === 'dark' ? 'bg-white/10 border-white/20' : 'bg-white border-white shadow-md'} scale-[1.02]` : 'opacity-20 border-transparent'}`}
                                    >
                                        <span className={`text-2xl sm:text-3xl mb-1 sm:mb-2 ${profileData.gender === g.id ? g.color : ''}`}>{g.icon}</span>
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase">{g.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                            <ModernSelect label="Board" value={profileData.board} icon={FaBook} s={s} theme={theme}
                                options={[{ label: "CBSE Standard", value: "CBSE" }, { label: "ICSE Advanced", value: "ICSE" }]}
                                onChange={(val) => setProfileData({ ...profileData, board: val })}
                            />
                            <ModernSelect label="Language" value={profileData.language} icon={FaLanguage} s={s} theme={theme}
                                options={[{ label: "English Global", value: "English" }, { label: "Hinglish Hybrid", value: "Hinglish" }]}
                                onChange={(val) => setProfileData({ ...profileData, language: val })}
                            />
                        </div>

                        <ModernSelect label="Phase" value={`Grade ${profileData.classLevel}`} icon={FaGraduationCap} s={s} theme={theme}
                            options={['8', '9', '10', '11', '12'].map(n => ({ label: `Class ${n} Node`, value: n }))}
                            onChange={(val) => setProfileData({ ...profileData, classLevel: val })}
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                        onClick={handleSave} disabled={loading}
                        className={`w-full mt-12 sm:mt-16 py-6 sm:py-8 rounded-[24px] sm:rounded-[30px] text-white font-black text-xs sm:text-sm uppercase tracking-[0.5em] sm:tracking-[0.8em] shadow-2xl flex items-center justify-center gap-4 ${s.btn}`}
                    >
                        {loading ? <FaSyncAlt className="animate-spin" /> : <FaSave />} Sync_Changes
                    </motion.button>

                    {/* Security Section - Now handles both "Change" and "Set" password */}
                    <div className="mt-16 sm:mt-24 pt-10 sm:pt-12 border-t border-white/5">
                        <div className="flex items-center gap-4 mb-8 sm:mb-10">
                            <FaShieldAlt className={`${hasPassword ? 'text-red-500' : 'text-green-500'} text-lg sm:text-xl`} />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] opacity-40">
                                {hasPassword ? "Security Override" : "Establish Password Node"}
                            </h3>
                        </div>
                        <div className="space-y-4">
                            {hasPassword && (
                                <input
                                    type="password"
                                    placeholder="CURRENT KEY"
                                    value={passwords.oldPass}
                                    onChange={(e) => setPasswords({ ...passwords, oldPass: e.target.value })}
                                    className={`w-full p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border outline-none text-[10px] font-black tracking-widest ${s.input}`}
                                />
                            )}
                            <div className="relative">
                                <input
                                    type={showPass.new ? "text" : "password"}
                                    placeholder={hasPassword ? "NEW SECURITY HASH" : "CREATE NEW KEY"}
                                    value={passwords.newPass}
                                    onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                                    className={`w-full p-5 sm:p-6 rounded-[20px] sm:rounded-[24px] border outline-none text-[10px] font-black tracking-widest ${s.input}`}
                                />
                                <button type="button" onClick={() => setShowPass({ ...showPass, new: !showPass.new })} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30">
                                    {showPass.new ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>
                            <button
                                onClick={handlePasswordUpdate}
                                disabled={loading}
                                className={`w-full py-4 rounded-[20px] sm:rounded-[24px] transition-all flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest ${
                                    hasPassword 
                                    ? 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white' 
                                    : 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 hover:bg-indigo-500 hover:text-white'
                                }`}
                            >
                                {loading ? <FaSyncAlt className="animate-spin" /> : <FaKey />}
                                {hasPassword ? "Flash_Auth_Memory" : "Initialize_Key_Link"}
                            </button>
                        </div>
                    </div>

                    {/* --- IMPROVED RETURN TO CHAT BUTTON --- */}
                    <div className="mt-12 pt-8 border-t border-white/5 flex justify-center">
                        <motion.button
                            whileHover={{ scale: 1.02, backgroundColor: theme === 'dark' ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.02)" }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate("/chat")}
                            className={`group relative w-full flex items-center p-2 pr-10 rounded-[24px] sm:rounded-full bg-transparent border-2 transition-all duration-300 shadow-xl ${theme === 'dark' ? 'border-white/10 hover:border-indigo-500/50' : 'border-slate-200 hover:border-blue-500/50'}`}
                        >
                            <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-slate-100'} group-hover:bg-indigo-600 p-4 sm:p-5 rounded-[18px] sm:rounded-full flex items-center justify-center transition-all duration-300`}>
                                <FaArrowLeft className={`${theme === 'dark' ? 'text-white' : 'text-slate-600'} group-hover:text-white text-lg sm:text-xl transition-transform group-hover:-translate-x-1`} />
                            </div>

                            <div className="text-left ml-5 flex flex-col justify-center overflow-hidden">
                                <span className={`block font-black text-[11px] sm:text-sm uppercase tracking-[0.4em] leading-none mb-1.5 transition-colors ${theme === 'dark' ? 'text-white' : 'text-slate-800'} group-hover:text-indigo-500`}>
                                    Return To Chat
                                </span>
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-indigo-500 group-hover:animate-pulse" />
                                    <span className="text-[8px] sm:text-[9px] opacity-40 font-black uppercase tracking-[0.2em] whitespace-nowrap">
                                        Close_Config // Exit_Node
                                    </span>
                                </div>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>

                <p className="mt-8 text-center text-[8px] font-black uppercase tracking-[1em] opacity-10">
                    System Protocol Alpha
                </p>
            </main>
        </div>
    );
}
