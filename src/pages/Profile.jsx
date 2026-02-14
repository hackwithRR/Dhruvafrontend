import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth, updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider, linkWithCredential } from "firebase/auth";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaArrowLeft, FaSave, FaSyncAlt, FaShieldAlt,
    FaChevronDown, FaLanguage, FaEye, FaEyeSlash, FaUserCircle,
    FaGraduationCap, FaBook, FaBolt, FaDice, FaKey, FaMars, FaVenus, FaGenderless, FaUpload, FaInfoCircle, FaExclamationTriangle,
    FaGlobe, FaCheck
} from "react-icons/fa";

const themes = {
    dark: {
        bg: "bg-[#000000]",
        card: "bg-[#0a0a0c] border-[#1d1d21] text-white shadow-[0_0_60px_rgba(0,0,0,0.8)]",
        input: "bg-[#141417] border-[#2a2a2f] text-white focus:border-cyan-500 focus:bg-[#1a1a1e]",
        label: "text-cyan-400 bg-[#0a0a0c]",
        accent: "text-cyan-400",
        accentBg: "bg-cyan-500/10",
        accentBorder: "border-cyan-500",
        accentGlow: "rgba(6, 182, 212, 0.2)",
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
        accentBg: "bg-blue-50",
        accentBorder: "border-blue-600",
        accentGlow: "rgba(37, 99, 235, 0.2)",
        btnGradient: "from-[#2563eb] via-[#7c3aed] to-[#2563eb]",
        warnGradient: "from-[#dc2626] via-[#ea580c] to-[#dc2626]",
        safeGradient: "from-[#059669] via-[#10b981] to-[#059669]"
    }
};

const avatarStyles = ['bottts', 'avataaars', 'pixel-art', 'adventurer', 'big-smile', 'lorelei', 'notionists', 'personas'];

const languages = [
    { name: "English", type: "Global" },
    { name: "Hindi", type: "Native" }, { name: "Hinglish", type: "Hybrid" },
    { name: "Kannada", type: "Native" }, { name: "Kanglish", type: "Hybrid" },
    { name: "Tamil", type: "Native" }, { name: "Tanglish", type: "Hybrid" },
    { name: "Telugu", type: "Native" }, { name: "Tenglish", type: "Hybrid" },
    { name: "Malayalam", type: "Native" }, { name: "Manglish", type: "Hybrid" },
    { name: "Bengali", type: "Native" }, { name: "Benglish", type: "Hybrid" },
    { name: "Marathi", type: "Native" }, { name: "Marathish", type: "Hybrid" },
    { name: "Gujarati", type: "Native" }, { name: "Gujarish", type: "Hybrid" }
];

export default function Profile() {
    const { currentUser, userData, theme, setTheme, reloadUser, logout } = useAuth();
    const navigate = useNavigate();
    const auth = getAuth();

    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [passwords, setPasswords] = useState({ oldPass: "", newPass: "" });
    const [showErrorModal, setShowErrorModal] = useState(false);

    // Glassmorphism dropdown states
    const [boardDropdownOpen, setBoardDropdownOpen] = useState(false);
    const [classDropdownOpen, setClassDropdownOpen] = useState(false);
    const [languageDropdownOpen, setLanguageDropdownOpen] = useState(false);

    // Refs for click outside
    const boardRef = useRef(null);
    const classRef = useRef(null);
    const languageRef = useRef(null);

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (boardRef.current && !boardRef.current.contains(event.target)) {
                setBoardDropdownOpen(false);
            }
            if (classRef.current && !classRef.current.contains(event.target)) {
                setClassDropdownOpen(false);
            }
            if (languageRef.current && !languageRef.current.contains(event.target)) {
                setLanguageDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const [profileData, setProfileData] = useState({
        displayName: userData?.name || userData?.displayName || currentUser?.displayName || "",
        board: userData?.board || "CBSE",
        classLevel: userData?.classLevel || "10",
        language: userData?.language || "English",
        pfp: userData?.pfp || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`,
        gender: userData?.gender || "other"
    });

    const s = themes[theme] || themes.dark;
    const hasPassword = currentUser?.providerData.some(p => p.providerId === 'password');

    // Sync local state when global userData changes
    useEffect(() => {
        if (userData) {
            setProfileData({
                displayName: userData.name || userData.displayName || currentUser?.displayName || "",
                board: userData.board || "CBSE",
                classLevel: userData.classLevel || "10",
                language: userData.language || "English",
                pfp: userData.pfp || currentUser?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${currentUser?.uid}`,
                gender: userData.gender || "other"
            });
        }
    }, [userData, currentUser]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) return toast.error("SOURCE TOO LARGE (MAX 10MB)");

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const SIZE = 400;
                canvas.width = SIZE;
                canvas.height = SIZE;
                const ctx = canvas.getContext("2d");
                const scale = Math.max(SIZE / img.width, SIZE / img.height);
                const x = (SIZE / 2) - (img.width / 2) * scale;
                const y = (SIZE / 2) - (img.height / 2) * scale;
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, x, y, img.width * scale, img.height * scale);

                const compressedBase64 = canvas.toDataURL("image/jpeg", 0.5);
                setProfileData({ ...profileData, pfp: compressedBase64 });
                toast.success("NEURAL IMAGE OPTIMIZED");
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    };

    const generateRandomAvatar = () => {
        const randomStyle = avatarStyles[Math.floor(Math.random() * avatarStyles.length)];
        const randomSeed = Math.random().toString(36).substring(7);
        setProfileData({ ...profileData, pfp: `https://api.dicebear.com/7.x/${randomStyle}/svg?seed=${randomSeed}` });
    };

    const handleSave = async () => {
        if (!profileData.displayName.trim()) return toast.error("ALIAS REQUIRED");

        setLoading(true);
        try {
            const userRef = doc(db, "users", currentUser.uid);

            await setDoc(userRef, {
                name: profileData.displayName,
                displayName: profileData.displayName,
                board: profileData.board,
                classLevel: profileData.classLevel,
                language: profileData.language,
                gender: profileData.gender,
                pfp: profileData.pfp,
                updatedAt: serverTimestamp()
            }, { merge: true });

            await updateProfile(auth.currentUser, {
                displayName: profileData.displayName,
                photoURL: profileData.pfp
            });

            if (reloadUser) await reloadUser();

            toast.success("CORE SYNCED", { icon: <FaBolt className="text-yellow-400" /> });

        } catch (e) {
            console.error(e);
            setShowErrorModal(true);
            toast.error("SYNC FAILED");
        } finally {
            setLoading(false);
        }
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

            {/* Error Modal */}
            <AnimatePresence>
                {showErrorModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className={`max-w-md w-full p-8 rounded-[40px] border-2 border-red-500/30 ${s.card} text-center shadow-[0_0_50px_rgba(239,68,68,0.2)]`}>
                            <FaExclamationTriangle className="text-red-500 text-6xl mx-auto mb-6" />
                            <h2 className="text-3xl font-black uppercase italic mb-4 tracking-tighter text-red-500">Sync_Overflow</h2>
                            <p className="text-[11px] opacity-60 leading-relaxed mb-8 uppercase tracking-widest">
                                The data packet is too large for the cloud. Please try a smaller image or use an avatar.
                            </p>
                            <button onClick={() => setShowErrorModal(false)} className="w-full py-5 bg-white text-black font-black rounded-2xl uppercase tracking-widest text-[11px]">
                                Try Again
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <main className="max-w-5xl mx-auto pt-10 sm:pt-20 px-4 relative z-10">
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-[40px] p-8 sm:p-14 border relative overflow-hidden ${s.card}`}>

                    <motion.button
                        whileHover={{ x: -5, backgroundColor: theme === 'dark' ? '#ffffff' : '#0f172a', color: theme === 'dark' ? '#000000' : '#ffffff' }}
                        onClick={() => navigate("/chat")}
                        className={`absolute top-8 left-8 flex items-center gap-2 px-4 py-2 rounded-xl border-2 font-black text-[10px] uppercase tracking-widest z-30 transition-colors ${s.input}`}
                    >
                        <FaArrowLeft /> Return_Hub
                    </motion.button>

                    <div className="flex flex-col items-center mt-12 mb-16">
                        <div className="relative group">
                            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: "linear" }} className="absolute -inset-6 border-2 border-dashed border-cyan-500/20 rounded-full" />
                            <div className="relative p-2 rounded-[35%] bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 shadow-2xl">
                                <img src={profileData.pfp} className="w-32 h-32 sm:w-44 sm:h-44 rounded-[33%] object-cover bg-black border-4 border-black/40" alt="PFP" />
                                <div className="absolute -bottom-4 -right-2 flex gap-3">
                                    <label className="bg-white text-black p-4 rounded-2xl shadow-2xl border-[3px] border-black cursor-pointer hover:scale-110 active:scale-95 transition-all flex items-center justify-center">
                                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                        <FaUpload className="text-xl" />
                                    </label>
                                    <motion.button whileHover={{ scale: 1.1, rotate: 180 }} onClick={generateRandomAvatar} className="bg-white text-black p-4 rounded-2xl shadow-2xl border-[3px] border-black">
                                        <FaDice className="text-xl" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                        <div className="mt-12 flex items-center gap-2 text-[9px] font-black tracking-[0.3em] opacity-30 uppercase">
                            <FaInfoCircle className={s.accent} /> Neural ID established | Class {profileData.classLevel}
                        </div>
                        <h1 className="text-5xl sm:text-7xl font-black italic tracking-tighter mt-4 uppercase">User<span className={s.accent}>.</span>Meta</h1>
                    </div>

                    <div className="space-y-12">
                        {/* Name Input */}
                        <div className="relative group">
                            <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[10px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Neural Alias</span>
                            <div className={`absolute left-6 top-1/2 -translate-y-1/2 text-xl opacity-40 ${s.accent}`}><FaUserCircle /></div>
                            <input type="text" value={profileData.displayName} onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                                className={`w-full p-6 pl-14 rounded-2xl border-2 outline-none font-bold text-lg transition-all ${s.input}`} />
                        </div>

                        {/* Gender Selection Grid */}
                        <div className="relative">
                            <span className={`absolute -top-3 left-6 px-3 py-1 text-[9px] font-black uppercase rounded-full z-20 border tracking-widest ${s.label}`}>Orientation_Key</span>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { id: 'male', label: 'MALE', icon: <FaMars /> },
                                    { id: 'female', label: 'FEMALE', icon: <FaVenus /> },
                                    { id: 'other', label: 'NEUTRAL', icon: <FaGenderless /> }
                                ].map((g) => (
                                    <button key={g.id} type="button" onClick={() => setProfileData({ ...profileData, gender: g.id })}
                                        className={`flex flex-col items-center justify-center py-6 rounded-3xl border-2 transition-all 
                                        ${profileData.gender === g.id ? `${s.accentBg} ${s.accentBorder} text-white shadow-[0_0_20px_rgba(6,182,212,0.3)]` : 'bg-transparent opacity-30 border-slate-800'}`}
                                    >
                                        <span className="text-2xl mb-2">{g.icon}</span>
                                        <span className="font-black text-[9px] tracking-widest">{g.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Board & Class Row - Glassmorphism Dropdowns */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Board Dropdown */}
                            <div className="relative group" ref={boardRef}>
                                <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[9px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Curriculum</span>
                                <FaBook className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-40 pointer-events-none z-10 ${s.accent}`} />
                                <button
                                    type="button"
                                    onClick={() => { setBoardDropdownOpen(!boardDropdownOpen); setClassDropdownOpen(false); setLanguageDropdownOpen(false); }}
                                    className={`w-full p-6 pl-14 rounded-2xl border-2 outline-none font-black cursor-pointer transition-all flex items-center justify-between ${s.input}
                                    ${boardDropdownOpen ? s.accentBorder : ''}`}
                                    style={boardDropdownOpen ? { boxShadow: `0 0 20px ${s.accentGlow}` } : {}}
                                >
                                    <span>{profileData.board}</span>
                                    <motion.div animate={{ rotate: boardDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="opacity-40">
                                        <FaChevronDown size={14} />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {boardDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-2xl border-2 z-50 overflow-hidden backdrop-blur-xl ${s.card}`}
                                            style={{ boxShadow: `0 0 30px ${s.accentGlow}` }}
                                        >
                                            {['CBSE', 'ICSE'].map((board) => (
                                                <button
                                                    key={board}
                                                    type="button"
                                                    onClick={() => { setProfileData({ ...profileData, board }); setBoardDropdownOpen(false); }}
                                                    className={`w-full px-6 py-3 text-left font-black text-sm flex items-center justify-between transition-all
                                                    ${profileData.board === board
                                                            ? `${s.accent} ${s.accentBg}`
                                                            : theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <span>{board}</span>
                                                    {profileData.board === board && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={s.accent}>
                                                            <FaCheck size={12} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Class Level Dropdown */}
                            <div className="relative group" ref={classRef}>
                                <span className={`absolute -top-2.5 left-6 px-2 py-0.5 text-[9px] font-black uppercase rounded-md z-20 border tracking-widest ${s.label}`}>Neural_Level</span>
                                <FaGraduationCap className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg opacity-40 pointer-events-none z-10 ${s.accent}`} />
                                <button
                                    type="button"
                                    onClick={() => { setClassDropdownOpen(!classDropdownOpen); setBoardDropdownOpen(false); setLanguageDropdownOpen(false); }}
                                    className={`w-full p-6 pl-14 rounded-2xl border-2 outline-none font-black cursor-pointer transition-all flex items-center justify-between ${s.input}
                                    ${classDropdownOpen ? s.accentBorder : ''}`}
                                    style={classDropdownOpen ? { boxShadow: `0 0 20px ${s.accentGlow}` } : {}}
                                >
                                    <span>Class {profileData.classLevel}</span>
                                    <motion.div animate={{ rotate: classDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="opacity-40">
                                        <FaChevronDown size={14} />
                                    </motion.div>
                                </button>

                                <AnimatePresence>
                                    {classDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.15 }}
                                            className={`absolute top-full left-0 right-0 mt-2 py-2 rounded-2xl border-2 z-50 overflow-hidden max-h-[300px] overflow-y-auto backdrop-blur-xl ${s.card}`}
                                            style={{ boxShadow: `0 0 30px ${s.accentGlow}` }}
                                        >
                                            {['8', '9', '10', '11', '12'].map((n) => (
                                                <button
                                                    key={n}
                                                    type="button"
                                                    onClick={() => { setProfileData({ ...profileData, classLevel: n }); setClassDropdownOpen(false); }}
                                                    className={`w-full px-6 py-3 text-left font-black text-sm flex items-center justify-between transition-all
                                                    ${profileData.classLevel === n
                                                            ? `${s.accent} ${s.accentBg}`
                                                            : theme === 'dark' ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}
                                                >
                                                    <span>Class {n}</span>
                                                    {profileData.classLevel === n && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={s.accent}>
                                                            <FaCheck size={12} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Language Selection - Enhanced Glassmorphism */}
                        <div className="relative mt-4" ref={languageRef}>
                            <span className={`absolute -top-3 left-6 px-3 py-1 text-[9px] font-black uppercase rounded-full z-20 border tracking-widest ${s.label}`}>Language_Linguistics</span>

                            <button
                                type="button"
                                onClick={() => { setLanguageDropdownOpen(!languageDropdownOpen); setBoardDropdownOpen(false); setClassDropdownOpen(false); }}
                                className={`w-full p-4 rounded-[35px] border-2 transition-all flex items-center justify-between
                                ${languageDropdownOpen
                                        ? `${s.accentBorder} ${s.accentBg}`
                                        : theme === 'dark'
                                            ? 'border-white/10 bg-[#0a0a0c]/50'
                                            : 'border-gray-200 bg-white/50'
                                    }`}
                            >
                                <div className="flex items-center gap-3 px-2">
                                    <FaGlobe className={profileData.language ? s.accent : 'opacity-30'} />
                                    <span className={`font-black text-sm ${profileData.language ? (theme === 'dark' ? 'text-white' : 'text-[#0f172a]') : 'opacity-30'}`}>
                                        {profileData.language || 'Select Language'}
                                    </span>
                                </div>
                                <motion.div animate={{ rotate: languageDropdownOpen ? 180 : 0 }} transition={{ duration: 0.2 }}
                                    className={theme === 'dark' ? 'text-white/40' : 'text-gray-400'}>
                                    <FaChevronDown size={14} />
                                </motion.div>
                            </button>

                            <AnimatePresence>
                                {languageDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.15 }}
                                        className={`absolute top-full left-0 right-0 mt-2 p-4 rounded-[25px] border-2 z-50 max-h-[350px] overflow-y-auto custom-scrollbar backdrop-blur-xl ${s.card}`}
                                        style={{ boxShadow: `0 0 40px ${s.accentGlow}` }}
                                    >
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                            {languages.map((lang) => (
                                                <button key={lang.name} type="button" onClick={() => { setProfileData({ ...profileData, language: lang.name }); setLanguageDropdownOpen(false); }}
                                                    className={`p-3 rounded-xl border-2 transition-all text-left relative overflow-hidden
                                                    ${profileData.language === lang.name
                                                            ? `${s.accentBorder} ${s.accentBg}`
                                                            : theme === 'dark'
                                                                ? 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'
                                                        }`}
                                                >
                                                    <div className="flex flex-col">
                                                        <span className={`text-[10px] font-black tracking-tight 
                                                            ${profileData.language === lang.name
                                                                ? s.accent
                                                                : theme === 'dark' ? 'text-white' : 'text-gray-700'
                                                            }`}>
                                                            {lang.name}
                                                        </span>
                                                        <span className={`text-[7px] font-bold uppercase tracking-widest 
                                                            ${profileData.language === lang.name
                                                                ? theme === 'dark' ? 'text-cyan-400/70' : 'text-blue-600/70'
                                                                : theme === 'dark' ? 'text-white/50' : 'text-gray-400'
                                                            }`}>
                                                            {lang.type}
                                                        </span>
                                                    </div>
                                                    {profileData.language === lang.name && (
                                                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                                            className={`absolute top-1 right-1 ${s.accent}`}>
                                                            <FaCheck size={10} />
                                                        </motion.div>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <motion.button
                            onClick={handleSave} disabled={loading}
                            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            style={{ backgroundSize: "200% 200%" }}
                            className={`w-full py-8 rounded-[2.5rem] text-white font-black text-sm uppercase tracking-[0.5em] shadow-2xl flex items-center justify-center gap-4 bg-gradient-to-r ${s.btnGradient}`}
                        >
                            {loading ? <FaSyncAlt className="animate-spin" /> : <FaSave className="text-xl" />} Initialize_Sync
                        </motion.button>
                    </div>

                    {/* Security */}
                    <div className="mt-32 pt-16 border-t border-white/5">
                        <div className="flex items-center gap-4 mb-10">
                            <div className={`p-3 rounded-xl ${hasPassword ? 'bg-orange-500/10 text-orange-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                                <FaShieldAlt className="text-2xl" />
                            </div>
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40">Security_Protocol</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-6 max-w-xl mx-auto">
                            {hasPassword && (
                                <input type="password" placeholder="CURRENT ACCESS KEY" value={passwords.oldPass} onChange={(e) => setPasswords({ ...passwords, oldPass: e.target.value })}
                                    className={`w-full p-6 rounded-2xl border-2 outline-none font-black text-[11px] tracking-widest ${s.input}`} />
                            )}
                            <div className="relative">
                                <input type={showPass ? "text" : "password"} placeholder={hasPassword ? "NEW SECURITY HASH" : "INITIALIZE NEW KEY"} value={passwords.newPass} onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                                    className={`w-full p-6 rounded-2xl border-2 outline-none font-black text-[11px] tracking-widest ${s.input}`} />
                                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-6 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-100 transition-opacity">
                                    {showPass ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
                                </button>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                onClick={handlePasswordUpdate} disabled={loading}
                                animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                                style={{ backgroundSize: "200% 200%" }}
                                className={`w-full py-6 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.3em] flex items-center justify-center gap-3 bg-gradient-to-r ${hasPassword ? s.warnGradient : s.safeGradient}`}
                            >
                                {loading ? <FaSyncAlt className="animate-spin" /> : <FaKey />} {hasPassword ? "Rotate_Keys" : "Establish_Node"}
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
